"""
Unsupervised Anomaly Scorer for Security Logs.

Pipelines:
1. Text feature extraction (TF-IDF) + numerical features (status, bytes, lengths).
2. Dimensionality reduction (TruncatedSVD) to dense 2D space for clustering & plotting.
3. Clustering (K-Means or DBSCAN).
4. Scoring:
   - Base score: normalized distance to cluster centroid (fixed stats from training).
   - Rarity score: bonus for belonging to a small cluster.
   - Rule boost: regex-based severity boost for known attack patterns.
"""

import re
from typing import Any, Tuple

import numpy as np
from scipy.sparse import hstack
from sklearn.cluster import DBSCAN, KMeans
from sklearn.decomposition import TruncatedSVD
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics import silhouette_score
from sklearn.preprocessing import StandardScaler

# Simple rule-based patterns for the severity boost
THREAT_PATTERNS = {
    "sql injection": [r"(?i)union\s+select", r"(?i)select\s+.*\s+from", r"(?i)drop\s+table", r"\'\s*or\s*\'1\'\=\'1"],
    "brute force": [r"(?i)failed password", r"(?i)invalid user", r"(?i)login failed"],
    "port scan": [r"(?i)connection refused", r"(?i)nmap", r"(?i)masscan"],
    "xss": [r"(?i)<script>", r"(?i)javascript:"],
    "traversal": [r"\.\./\.\.", r"etc/passwd"],
}


class AnomalyScorer:
    """
    ML Pipeline that trains on 'normal' traffic and scores anomalies.
    """

    def __init__(self, use_dbscan: bool = False, max_k: int = 10):
        self.use_dbscan = use_dbscan
        self.max_k = max_k
        self.is_fitted = False

        # Preprocessing: Text + Numeric
        self.tfidf = TfidfVectorizer(max_features=500, stop_words="english")
        self.num_scaler = StandardScaler()
        # Reduce combined features to 2 dimensions for clustering and scatter plot
        self.svd = TruncatedSVD(n_components=2, random_state=42)
        self.scaler = StandardScaler()

        # Clustering
        self.model: Any = None
        
        # Fixed stats for normalization
        self.centroids: np.ndarray | None = None
        self.max_expected_distance: float = 1.0
        self.cluster_sizes: dict[int, int] = {}
        self.total_train_samples: int = 0
        self.cluster_id_map: dict[int, int] = {}

    @staticmethod
    def _extract_numeric_features(raw_logs: list[str]) -> np.ndarray:
        """
        Extract numeric features from raw log strings:
        [status_code, response_bytes, log_length, special_char_count]
        """
        features = []
        for log in raw_logs:
            # Match status code and bytes: e.g. " 200 1495" or " 403 105"
            match = re.search(r'"\s+(\d{3})\s+(\d+)', log)
            if match:
                status_code = float(match.group(1))
                bytes_sent = float(match.group(2))
            else:
                status_match = re.search(r'\s([1-5]\d{2})\s', log)
                status_code = float(status_match.group(1)) if status_match else 200.0
                bytes_sent = 0.0

            log_len = float(len(log))
            special_chars = float(len(re.findall(r'[\'\"<>\;\%\(\)\=]', log)))
            features.append([status_code, bytes_sent, log_len, special_chars])

        return np.array(features, dtype=np.float64)

    def _extract_features(self, raw_logs: list[str], fit: bool = False) -> np.ndarray:
        """Combine TF-IDF text features + scaled numeric features, reduced via TruncatedSVD."""
        num_features = self._extract_numeric_features(raw_logs)

        if fit:
            tfidf_features = self.tfidf.fit_transform(raw_logs)
            scaled_num = self.num_scaler.fit_transform(num_features)
            combined = hstack([tfidf_features, scaled_num])
            reduced = self.svd.fit_transform(combined)
            return self.scaler.fit_transform(reduced)
        else:
            tfidf_features = self.tfidf.transform(raw_logs)
            scaled_num = self.num_scaler.transform(num_features)
            combined = hstack([tfidf_features, scaled_num])
            reduced = self.svd.transform(combined)
            return self.scaler.transform(reduced)

    def _get_rule_boost(self, log: str) -> float:
        """Calculate flat severity boost based on regex match with URL decoding support."""
        import urllib.parse
        decoded_log = urllib.parse.unquote_plus(log)
        boost = 0.0
        for category, patterns in THREAT_PATTERNS.items():
            for p in patterns:
                if re.search(p, log) or re.search(p, decoded_log):
                    boost += 30.0  # +30 for any known threat pattern
                    break
        return min(boost, 100.0)


    def fit(self, logs: list[str]) -> None:
        """
        Train the model on a batch of mostly normal logs.
        """
        if not logs:
            return

        X = self._extract_features(logs, fit=True)
        self.total_train_samples = len(logs)

        if self.use_dbscan:
            self.model = DBSCAN(eps=0.5, min_samples=5)
            labels = self.model.fit_predict(X)
            
            # Valid cluster IDs (excluding noise label -1)
            valid_cluster_ids = sorted([int(lbl) for lbl in set(labels) if lbl != -1])
            self.cluster_sizes = {}
            self.cluster_id_map = {}

            if not valid_cluster_ids:
                self.centroids = np.empty((0, X.shape[1]))
            else:
                self.centroids = np.zeros((len(valid_cluster_ids), X.shape[1]))
                for idx, cid in enumerate(valid_cluster_ids):
                    self.cluster_id_map[cid] = idx
                    mask = (labels == cid)
                    self.centroids[idx] = X[mask].mean(axis=0)
                    self.cluster_sizes[cid] = int(np.sum(mask))
            
            # Distance norm based on core points
            core_distances = []
            for i, lbl in enumerate(labels):
                if lbl != -1 and lbl in self.cluster_id_map:
                    idx = self.cluster_id_map[lbl]
                    dist = float(np.linalg.norm(X[i] - self.centroids[idx]))
                    core_distances.append(dist)

            if core_distances:
                self.max_expected_distance = float(np.percentile(core_distances, 99))
                if self.max_expected_distance == 0:
                    self.max_expected_distance = 1.0
            else:
                self.max_expected_distance = 1.0
        else:
            # Auto-select K using silhouette score
            best_k = 2
            best_score = -1
            max_clusters = min(self.max_k, len(logs) // 10)
            if max_clusters < 2:
                max_clusters = 2
                
            for k in range(2, max_clusters + 1):
                km = KMeans(n_clusters=k, random_state=42, n_init="auto")
                lbls = km.fit_predict(X)
                if len(set(lbls)) > 1:
                    score = silhouette_score(X, lbls)
                    if score > best_score:
                        best_score = score
                        best_k = k
                        self.model = km
            
            if self.model is None:
                self.model = KMeans(n_clusters=2, random_state=42, n_init="auto").fit(X)

            self.centroids = self.model.cluster_centers_
            labels = self.model.labels_
            
            # Fixed stats for normalization
            self.cluster_sizes = {}
            distances = []
            for i, lbl in enumerate(labels):
                c_lbl = int(lbl)
                self.cluster_sizes[c_lbl] = self.cluster_sizes.get(c_lbl, 0) + 1
                dist = float(np.linalg.norm(X[i] - self.centroids[c_lbl]))
                distances.append(dist)
            
            self.max_expected_distance = float(np.percentile(distances, 99))
            if self.max_expected_distance == 0:
                self.max_expected_distance = 1.0

        self.is_fitted = True

    def score(self, raw_log: str) -> Tuple[float, float, float, float, int, list[float]]:
        """
        Score a single log line.
        Returns:
            (distance_score, rarity_score, rule_boost, final_priority, cluster_id, coords)
        """
        if not self.is_fitted:
            raise RuntimeError("Scorer must be fitted before scoring.")

        x = self._extract_features([raw_log], fit=False)[0]
        rule_boost = self._get_rule_boost(raw_log)

        if self.use_dbscan:
            if self.centroids is None or len(self.centroids) == 0:
                return (100.0, 50.0, rule_boost, min(100.0, 100.0 + rule_boost), -1, [float(x[0]), float(x[1])])
                
            distances = np.linalg.norm(self.centroids - x, axis=1)
            closest_idx = int(np.argmin(distances))
            dist = float(distances[closest_idx])
            
            # If distance > eps, classify as noise
            if dist > self.model.eps:
                distance_score = 100.0
                rarity_score = 50.0  # Max rarity for noise
                cluster_id = -1
            else:
                distance_score = min(100.0, (dist / self.max_expected_distance) * 100.0)
                # Map back to cluster ID
                rev_map = {idx: cid for cid, idx in self.cluster_id_map.items()}
                cluster_id = rev_map.get(closest_idx, -1)
                c_size = self.cluster_sizes.get(cluster_id, 1)
                rarity_score = min(50.0, float(self.total_train_samples / c_size))
                
        else:
            # K-Means
            distances = np.linalg.norm(self.centroids - x, axis=1)
            cluster_id = int(np.argmin(distances))
            dist = float(distances[cluster_id])
            
            distance_score = min(100.0, (dist / self.max_expected_distance) * 100.0)
            
            # Rarity score: if a cluster is < 1% of the data, it's rare.
            c_size = self.cluster_sizes.get(cluster_id, 1)
            rarity_score = min(50.0, float(self.total_train_samples / (c_size * 10.0)))
            
        # Clamp priority strictly to [0.0, 100.0]
        final_priority = max(0.0, min(100.0, distance_score * 0.5 + rarity_score * 0.2 + rule_boost))
        
        return (
            round(distance_score, 2),
            round(rarity_score, 2),
            round(rule_boost, 2),
            round(final_priority, 2),
            cluster_id,
            [float(x[0]), float(x[1])] # Return 2D coords for visualization
        )


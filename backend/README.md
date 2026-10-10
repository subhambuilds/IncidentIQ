# 🛡️ Real-Time Security Incident Triager

A high-performance backend and dashboard to ingest, cluster, and prioritize security logs in real-time. Designed to help analysts triage thousands of alerts during an attack by surfacing the most critical incidents instantly.

## 📐 Architecture Overview

```
┌─────────────────────────────────────────────────────┐
│                    FRONTEND                         │
│  Next.js 16 (port 3000)                             │
│  /dashboard ─── fetch (poll) ────────┐              │
│    ├── AlertTable (priority queue)   │              │
│    ├── ClusterScatter (SVD 2D map)   │              │
│    ├── StatsPanel                    │              │
│    └── Controls (escalate/resolve)   │              │
└──────────────────────────────────────┼──────────────┘
                                       │
                          HTTP JSON    │
                                       ▼
┌─────────────────────────────────────────────────────┐
│                    BACKEND                          │
│  FastAPI (port 8000)                                │
│                                                     │
│              ┌──────────────────────┐               │
│              │  MaxHeap (DSA)       │               │
│              │  • O(log N) ops      │               │
│              │  • index map         │               │
│              │  • thread-safe lock  │               │
│              └──────────────────────┘               │
│              ┌──────────────────────┐               │
│              │  AnomalyScorer (ML)  │               │
│              │  • TF-IDF + SVD      │               │
│              │  • K-Means / DBSCAN  │               │
│              │  • rule-based boost  │               │
│              └──────────────────────┘               │
└─────────────────────────────────────────────────────┘
```

## 🚀 Getting Started

### 1. Run the Backend
Requires Python 3.11+.

```bash
cd backend
python -m pip install -r requirements.txt
python run.py
```
The FastAPI server will start on `http://127.0.0.1:8000`. 
*(Note: on first start, the ML model trains on 1,000 logs which takes ~2 seconds).*

### 2. Run the Frontend
```bash
# In the root IncidentIQ/ directory
pnpm install
pnpm dev
```
Navigate to `http://localhost:3000/dashboard`.

## 🎙️ Interview Talking Points

### Why a Heap over a Sorted List?
Insertion into a sorted array is `O(N)` because all subsequent elements must shift. For a high-throughput incident stream (thousands of logs/second), this creates a severe bottleneck. A Max-Heap achieves `O(log N)` insertion. To extract the top `K` elements for the dashboard without paying `O(N log N)` insertion costs, we use the frontier-heap method which takes `O(K log K)`.

### Why the Index Map?
In a standard heap, `update_priority` and `remove` require an `O(N)` scan to find the element. By maintaining a hash map of `alert_id -> array_index` that is updated on every heap swap, we reduce the search time to `O(1)`, keeping the overall operations strictly `O(log N)`.

### K-Means vs DBSCAN
- **K-Means**: Fast, predictable, and forces every point into a cluster. Great for grouping similar traffic patterns, but distance to centroid can be skewed by outliers.
- **DBSCAN**: Better for true anomaly detection because it isolates outliers as "noise" (cluster `-1`). However, it requires careful tuning of `eps` and `min_samples` for high-dimensional text data. We reduced dimensionality with TruncatedSVD first to help density-based clustering perform better.

### Scalability (How to take this to production)
- **Batching & Queuing**: Put a message broker (e.g., Kafka, RabbitMQ) in front of the ingest endpoint so spikes don't overwhelm the FastAPI server.
- **Sharding**: Shard the Max-Heap by Tenant ID so each customer has their own dedicated queue and lock, allowing parallel processing.
- **Persistence**: Periodically snapshot the heap to Redis or PostgreSQL to recover state if the node crashes.

## ⏱️ Time Complexity Table

| Operation | Complexity | Note |
|-----------|------------|------|
| `insert` | `O(log N)` | Sift-up |
| `extract_max` | `O(log N)` | Swap with last, pop, sift-down |
| `peek` | `O(1)` | Return index 0 |
| `update_priority` | `O(log N)` | O(1) lookup + one-directional sift |
| `remove` | `O(log N)` | O(1) lookup, swap with last, sift |
| `build_heap` | `O(N)` | Floyd's bottom-up method |
| `top_k` | `O(K log K)` | Secondary frontier heap |

## 🧪 Testing & Benchmarks

Run the tests and benchmark in the `backend/` directory:

```bash
python -m pytest tests/
python -m tests.benchmark_heap
```

The benchmark proves the `O(N log N)` vs `O(N)` scaling of `insert` vs `build_heap`. At 1,000,000 alerts, throughput reaches over 700,000 logs/second.

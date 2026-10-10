"""
FastAPI application for the Real-Time Security Incident Triager.
"""

import time
import uuid
import threading
from datetime import datetime, timezone
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware

from heap.max_heap import MaxHeap, Alert
from ml.anomaly_scorer import AnomalyScorer
from data.generate_logs import generate_logs
from api.models import (
    LogIngestRequest,
    AlertResponse,
    ClusterSummary,
    StatsResponse,
    PriorityUpdateRequest,
)

# Global State
# A threading lock protects all heap and ML scorer accesses.
lock = threading.Lock()
heap = MaxHeap()
scorer = AnomalyScorer(use_dbscan=False)

# Track stats
stats = {
    "total_processed": 0,
    "start_time": time.time(),
}

# In-memory store for visualization coordinates
# Maps alert_id -> [x, y]
coords_store = {}

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: pre-train the ML scorer with some normal traffic
    with lock:
        print("Training initial ML model...")
        initial_logs = generate_logs(count=1000, attack_ratio=0.0)
        raw_texts = [log["raw_log"] for log in initial_logs]
        scorer.fit(raw_texts)
        print("ML model trained successfully.")
    yield
    # Shutdown
    pass

app = FastAPI(title="Real-Time Security Incident Triager", lifespan=lifespan)

# Allow CORS for Next.js dev server if needed (though rewrite proxy is planned)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.post("/alerts/ingest")
def ingest_logs(req: LogIngestRequest):
    """
    Score and ingest a batch of logs into the heap.
    """
    with lock:
        if not scorer.is_fitted:
            raise HTTPException(status_code=500, detail="Model not trained yet.")
            
        for raw_log in req.raw_logs:
            d_score, r_score, r_boost, priority, c_id, coords = scorer.score(raw_log)
            
            alert_id = str(uuid.uuid4())
            alert = Alert(
                id=alert_id,
                priority=priority,
                cluster_id=c_id,
                timestamp=datetime.now(timezone.utc),
                raw_log=raw_log,
                distance_score=d_score,
                rarity_score=r_score,
                rule_boost=r_boost
            )
            
            coords_store[alert_id] = coords
            heap.insert(alert)
            stats["total_processed"] += 1
            
        return {"message": f"Ingested {len(req.raw_logs)} logs."}


@app.post("/alerts/bulk-load")
def bulk_load(req: LogIngestRequest):
    """
    Build heap from initial large load (O(N) Floyd's method).
    """
    with lock:
        alerts = []
        for raw_log in req.raw_logs:
            d_score, r_score, r_boost, priority, c_id, coords = scorer.score(raw_log)
            alert_id = str(uuid.uuid4())
            alert = Alert(
                id=alert_id,
                priority=priority,
                cluster_id=c_id,
                timestamp=datetime.now(timezone.utc),
                raw_log=raw_log,
                distance_score=d_score,
                rarity_score=r_score,
                rule_boost=r_boost
            )
            coords_store[alert_id] = coords
            alerts.append(alert)
            
        heap.build_heap(alerts)
        stats["total_processed"] += len(req.raw_logs)
        
        return {"message": f"Bulk loaded {len(req.raw_logs)} logs using build_heap."}


@app.get("/alerts/top", response_model=list[AlertResponse])
def get_top_alerts(k: int = 10):
    """
    Return top-k highest priority incidents without removing them.
    """
    with lock:
        top_alerts = heap.top_k(k)
        
        resp = []
        for a in top_alerts:
            resp.append(AlertResponse(
                id=a.id,
                priority=a.priority,
                cluster_id=a.cluster_id,
                timestamp=a.timestamp,
                raw_log=a.raw_log,
                status=a.status,
                distance_score=a.distance_score,
                rarity_score=a.rarity_score,
                rule_boost=a.rule_boost,
                coords=coords_store.get(a.id)
            ))
        return resp


@app.post("/alerts/next", response_model=AlertResponse)
def get_next_alert():
    """
    Extract the maximum priority alert (Analyst takes the next incident).
    """
    with lock:
        if heap.size == 0:
            raise HTTPException(status_code=404, detail="No open alerts.")
            
        a = heap.extract_max()
        return AlertResponse(
            id=a.id,
            priority=a.priority,
            cluster_id=a.cluster_id,
            timestamp=a.timestamp,
            raw_log=a.raw_log,
            status=a.status,
            distance_score=a.distance_score,
            rarity_score=a.rarity_score,
            rule_boost=a.rule_boost,
            coords=coords_store.get(a.id)
        )


@app.patch("/alerts/{alert_id}/priority")
def update_priority(alert_id: str, req: PriorityUpdateRequest):
    """
    Manual escalate/de-escalate.
    """
    with lock:
        try:
            heap.update_priority(alert_id, req.new_priority)
            return {"message": f"Priority updated to {req.new_priority}"}
        except KeyError:
            raise HTTPException(status_code=404, detail="Alert not found in open queue.")


@app.delete("/alerts/{alert_id}")
def resolve_alert(alert_id: str):
    """
    Resolve/remove alert from heap and clean up stored visualization coords.
    """
    with lock:
        try:
            heap.remove(alert_id)
            coords_store.pop(alert_id, None)
            return {"message": "Alert resolved."}
        except KeyError:
            raise HTTPException(status_code=404, detail="Alert not found.")


@app.get("/clusters", response_model=list[ClusterSummary])
def get_clusters():
    """
    Cluster summaries (open alerts count per cluster).
    """
    with lock:
        counts = heap.get_cluster_aggregation()
        return [ClusterSummary(cluster_id=c_id, size=count) for c_id, count in counts.items()]


@app.get("/stats", response_model=StatsResponse)
def get_stats():
    """
    Heap size, throughput.
    """
    with lock:
        elapsed = time.time() - stats["start_time"]
        throughput = stats["total_processed"] / elapsed if elapsed > 0 else 0.0
        
        return StatsResponse(
            heap_size=heap.size,
            total_processed=stats["total_processed"],
            throughput=throughput
        )


@app.post("/simulation/start")
def start_simulation(background_tasks: BackgroundTasks, count: int = 100):
    """
    Endpoint for the UI to request a burst of synthetic logs.
    """
    def sim_worker(c: int):
        logs = generate_logs(count=c, attack_ratio=0.1)
        raw_texts = [log["raw_log"] for log in logs]
        
        # Batch insert to simulate a flood
        with lock:
            for raw_log in raw_texts:
                d_score, r_score, r_boost, priority, c_id, coords = scorer.score(raw_log)
                alert_id = str(uuid.uuid4())
                alert = Alert(
                    id=alert_id,
                    priority=priority,
                    cluster_id=c_id,
                    timestamp=datetime.now(timezone.utc),
                    raw_log=raw_log,
                    distance_score=d_score,
                    rarity_score=r_score,
                    rule_boost=r_boost
                )
                coords_store[alert_id] = coords
                heap.insert(alert)
                stats["total_processed"] += 1

    background_tasks.add_task(sim_worker, count)
    return {"message": f"Simulation started: {count} logs generating in background."}


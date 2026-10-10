"""Pydantic models for the API."""

from datetime import datetime
from pydantic import BaseModel, Field

class LogIngestRequest(BaseModel):
    raw_logs: list[str]

class AlertResponse(BaseModel):
    id: str
    priority: float
    cluster_id: int
    timestamp: datetime
    raw_log: str
    status: str
    distance_score: float
    rarity_score: float
    rule_boost: float
    coords: list[float] | None = None

class ClusterSummary(BaseModel):
    cluster_id: int
    size: int

class StatsResponse(BaseModel):
    heap_size: int
    total_processed: int
    throughput: float

class PriorityUpdateRequest(BaseModel):
    new_priority: float

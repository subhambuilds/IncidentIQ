"""
Custom array-based binary Max-Heap for security alert prioritization.

Design decisions
----------------
- Max-heap: highest-priority alert is always at index 0 (root).
- Tie-breaking: equal priorities resolved by *earlier* timestamp (deterministic).
- Index map: ``dict[alert_id → heap_index]`` for O(1) lookups, enabling O(log N)
  ``update_priority`` and ``remove`` without an O(N) scan.
- Alert lifecycle: the heap holds only **open** alerts.  ``extract_max`` marks
  the alert *in_progress*; ``remove`` marks it *resolved*.  Both go to a
  separate ``_history`` dict so the API can query past alerts.
- Cluster aggregation: ``_cluster_counts[cluster_id]`` is maintained
  incrementally (O(1) per insert/remove) so the API can expose near-duplicate
  grouping without a full scan.

Why a heap over a sorted list?
  Insertion into a sorted list is O(N) (array shift) vs O(log N) in a heap.
  For a high-throughput alert stream this difference is critical.
  ``top_k`` is O(k log k) with the frontier approach, matching a sorted list's
  O(k) but without paying the O(N) insertion cost.

Why the index map?
  Without it, ``update_priority`` and ``remove`` require an O(N) linear scan to
  locate the target.  The map turns both into O(log N) by providing the array
  index in O(1), then only the sift costs O(log N).
"""

from __future__ import annotations

import copy
from dataclasses import dataclass, field
from datetime import datetime
from typing import Optional


# ---------------------------------------------------------------------------
# Alert data model
# ---------------------------------------------------------------------------

@dataclass
class Alert:
    """
    A single security alert with priority metadata.

    Attributes
    ----------
    id : str
        Unique identifier (e.g. UUID).
    priority : float
        Composite score used for heap ordering (higher = more urgent).
    cluster_id : int
        Cluster assignment from the ML pipeline (-1 = noise / unassigned).
    timestamp : datetime
        When the original log event occurred.
    raw_log : str
        The raw log line or message text.
    status : str
        Lifecycle state: ``"open"`` | ``"in_progress"`` | ``"resolved"``.

    Score breakdown (populated by the ML scorer):
    distance_score : float
        Normalized distance to cluster centroid (0-100).
    rarity_score : float
        Bonus for belonging to a small / rare cluster.
    rule_boost : float
        Bonus from the rule-based severity table.
    """

    id: str
    priority: float
    cluster_id: int
    timestamp: datetime
    raw_log: str
    status: str = "open"

    # --- score breakdown for explainability ---
    distance_score: float = 0.0
    rarity_score: float = 0.0
    rule_boost: float = 0.0


# ---------------------------------------------------------------------------
# Max-Heap
# ---------------------------------------------------------------------------

class MaxHeap:
    """
    Array-based binary Max-Heap with O(1)-lookup index map.

    Invariants (checked by ``verify_invariants``):
      1. **Heap property** — every parent's priority ≥ each child's priority;
         ties broken by earlier timestamp.
      2. **Index-map consistency** — ``_index_map[alert.id] == i`` iff
         ``_heap[i].id == alert.id``.
      3. **Cluster-count consistency** — ``_cluster_counts`` matches actual
         per-cluster counts in ``_heap``.
    """

    def __init__(self) -> None:
        self._heap: list[Alert] = []
        self._index_map: dict[str, int] = {}        # alert_id → heap index
        self._history: dict[str, Alert] = {}         # resolved / in-progress alerts
        self._cluster_counts: dict[int, int] = {}    # cluster_id → open alert count

    # ---- properties -------------------------------------------------------

    def __len__(self) -> int:
        return len(self._heap)

    @property
    def size(self) -> int:
        """Number of open alerts in the heap."""
        return len(self._heap)

    # ---- comparison -------------------------------------------------------

    @staticmethod
    def _has_higher_priority(a: Alert, b: Alert) -> bool:
        """
        Return ``True`` if *a* should sit above *b* in the max-heap.

        Ordering rules (deterministic):
          1. Higher ``priority`` value wins.
          2. On tie → earlier ``timestamp`` wins.
        """
        if a.priority != b.priority:
            return a.priority > b.priority
        return a.timestamp < b.timestamp

    # ---- index helpers ----------------------------------------------------

    @staticmethod
    def _parent(i: int) -> int:
        return (i - 1) // 2

    @staticmethod
    def _left(i: int) -> int:
        return 2 * i + 1

    @staticmethod
    def _right(i: int) -> int:
        return 2 * i + 2

    # ---- swap (keeps index map in sync) -----------------------------------

    def _swap(self, i: int, j: int) -> None:
        """Swap elements at indices *i* and *j*, updating the index map."""
        self._index_map[self._heap[i].id] = j
        self._index_map[self._heap[j].id] = i
        self._heap[i], self._heap[j] = self._heap[j], self._heap[i]

    # ---- sift operations --------------------------------------------------

    def _sift_up(self, i: int) -> None:
        """
        Restore heap property by moving the element at *i* toward the root.

        Time complexity: O(log N) — at most ``log₂ N`` swaps along the
        path from *i* to the root.
        """
        while i > 0:
            parent = self._parent(i)
            if self._has_higher_priority(self._heap[i], self._heap[parent]):
                self._swap(i, parent)
                i = parent
            else:
                break

    def _sift_down(self, i: int) -> None:
        """
        Restore heap property by moving the element at *i* toward a leaf.

        Time complexity: O(log N) — at most ``log₂ N`` swaps along the
        longest path from *i* to a leaf.
        """
        n = len(self._heap)
        while True:
            largest = i
            left = self._left(i)
            right = self._right(i)

            if left < n and self._has_higher_priority(self._heap[left], self._heap[largest]):
                largest = left
            if right < n and self._has_higher_priority(self._heap[right], self._heap[largest]):
                largest = right

            if largest != i:
                self._swap(i, largest)
                i = largest
            else:
                break

    # ---- cluster bookkeeping ----------------------------------------------

    def _inc_cluster(self, cluster_id: int) -> None:
        self._cluster_counts[cluster_id] = self._cluster_counts.get(cluster_id, 0) + 1

    def _dec_cluster(self, cluster_id: int) -> None:
        self._cluster_counts[cluster_id] -= 1
        if self._cluster_counts[cluster_id] == 0:
            del self._cluster_counts[cluster_id]

    # ---- public API -------------------------------------------------------

    def insert(self, alert: Alert) -> None:
        """
        Insert an alert into the heap.

        Time complexity: O(log N) — append to end, then sift up at most
        ``log₂ N`` levels.

        Raises
        ------
        ValueError
            If ``alert.id`` already exists in the heap.
        """
        if alert.id in self._index_map:
            raise ValueError(f"Alert '{alert.id}' already exists in heap")

        alert.status = "open"
        idx = len(self._heap)
        self._heap.append(alert)
        self._index_map[alert.id] = idx
        self._inc_cluster(alert.cluster_id)

        self._sift_up(idx)

    def peek(self) -> Alert:
        """
        Return the highest-priority alert without removing it.

        Time complexity: O(1) — direct array access at index 0.

        Raises
        ------
        IndexError
            If the heap is empty.
        """
        if not self._heap:
            raise IndexError("peek from empty heap")
        return self._heap[0]

    def extract_max(self) -> Alert:
        """
        Remove and return the highest-priority alert.

        The extracted alert's status is set to ``"in_progress"`` and it is
        moved to the history dict.

        Time complexity: O(log N) — swap root with last element, pop, then
        sift the new root down.

        Raises
        ------
        IndexError
            If the heap is empty.
        """
        if not self._heap:
            raise IndexError("extract_max from empty heap")

        # Move max to end so we can pop in O(1)
        self._swap(0, len(self._heap) - 1)
        max_alert = self._heap.pop()
        del self._index_map[max_alert.id]
        self._dec_cluster(max_alert.cluster_id)

        # Mark lifecycle
        max_alert.status = "in_progress"
        self._history[max_alert.id] = max_alert

        # Restore heap property from root
        if self._heap:
            self._sift_down(0)

        return max_alert

    def update_priority(self, alert_id: str, new_priority: float) -> None:
        """
        Change an alert's priority and re-heapify in the correct direction.

        - If the priority *increased* → sift up (alert may now outrank parent).
        - If the priority *decreased* → sift down (children may now outrank it).
        - If unchanged → no movement needed.

        Time complexity: O(log N) — one sift direction, at most ``log₂ N``
        swaps.

        Raises
        ------
        KeyError
            If ``alert_id`` is not in the heap.
        """
        if alert_id not in self._index_map:
            raise KeyError(f"Alert '{alert_id}' not found in heap")

        idx = self._index_map[alert_id]
        old_priority = self._heap[idx].priority
        self._heap[idx].priority = new_priority

        if new_priority > old_priority:
            self._sift_up(idx)
        elif new_priority < old_priority:
            self._sift_down(idx)
        # Equal priority, same timestamp → no movement needed.

    def remove(self, alert_id: str) -> Alert:
        """
        Remove an alert by ID, mark it ``"resolved"``, store in history.

        Strategy: swap target with the last element, pop, then sift the
        replacement element up *or* down as needed.

        Time complexity: O(log N) — one sift direction.

        Raises
        ------
        KeyError
            If ``alert_id`` is not in the heap.
        """
        if alert_id not in self._index_map:
            raise KeyError(f"Alert '{alert_id}' not found in heap")

        idx = self._index_map[alert_id]
        last_idx = len(self._heap) - 1
        removed_alert = self._heap[idx]

        if idx == last_idx:
            # Removing the very last element — no sift needed.
            self._heap.pop()
            del self._index_map[alert_id]
        else:
            # Swap with last, pop, then re-heapify the displaced element.
            self._swap(idx, last_idx)
            self._heap.pop()
            del self._index_map[alert_id]

            # The element now at ``idx`` may violate upward or downward.
            if idx > 0 and self._has_higher_priority(
                self._heap[idx], self._heap[self._parent(idx)]
            ):
                self._sift_up(idx)
            else:
                self._sift_down(idx)

        # Bookkeeping
        self._dec_cluster(removed_alert.cluster_id)
        removed_alert.status = "resolved"
        self._history[removed_alert.id] = removed_alert

        return removed_alert

    def build_heap(self, alerts: list[Alert]) -> None:
        """
        Bulk-load alerts using Floyd's bottom-up heapify (replaces current
        heap contents).

        Floyd's algorithm sifts down every internal node from the last one to
        the root.  The total work sums to O(N) because most nodes are near
        the leaves where sift-down is cheap.

        **Comparison with repeated ``insert``:**
          N insertions each cost O(log N) → O(N log N) total.
          ``build_heap`` achieves O(N) by avoiding the top-heavy sift-up cost.

        Time complexity: O(N)

        Raises
        ------
        ValueError
            If any duplicate ``alert.id`` values are found.
        """
        # Duplicate check
        ids = {a.id for a in alerts}
        if len(ids) != len(alerts):
            raise ValueError("Duplicate alert IDs in input list")

        # Replace internal state
        self._heap = list(alerts)                   # shallow copy of the list
        self._index_map = {a.id: i for i, a in enumerate(self._heap)}
        self._cluster_counts = {}

        for alert in self._heap:
            alert.status = "open"
            self._inc_cluster(alert.cluster_id)

        # Floyd's bottom-up heapify: sift down each internal node
        for i in range(len(self._heap) // 2 - 1, -1, -1):
            self._sift_down(i)

    def top_k(self, k: int) -> list[Alert]:
        """
        Return the *k* highest-priority alerts **without** modifying the heap.

        Uses a *frontier-heap* approach:

        1. Seed a frontier with the root (index 0).
        2. Pop the highest-priority element from the frontier → append to
           result.
        3. Push that element's two children (from the *main* heap) into the
           frontier.
        4. Repeat until we have *k* results or the frontier is empty.

        The frontier never exceeds 2k entries, and each pop/push is O(log k)
        on the frontier.

        Time complexity: O(k log k)

        Parameters
        ----------
        k : int
            Number of top alerts to return (clamped to heap size).

        Returns
        -------
        list[Alert]
            Up to *k* alerts ordered by descending priority.
        """
        if not self._heap or k <= 0:
            return []

        k = min(k, len(self._heap))
        result: list[Alert] = []

        # Frontier: list of (alert_ref, main_heap_index).
        # We do a linear scan for the max in the frontier.  Since the frontier
        # has at most ~2k entries and k is typically 10-50 for a dashboard,
        # this is fast and keeps the code simple.
        frontier: list[tuple[Alert, int]] = [(self._heap[0], 0)]
        seen: set[int] = {0}

        for _ in range(k):
            if not frontier:
                break

            # Find the frontier element with highest priority
            best_fi = 0
            for fi in range(1, len(frontier)):
                if self._has_higher_priority(frontier[fi][0], frontier[best_fi][0]):
                    best_fi = fi

            alert, heap_idx = frontier.pop(best_fi)
            result.append(alert)

            # Expand children in the main heap
            for child_idx in (self._left(heap_idx), self._right(heap_idx)):
                if child_idx < len(self._heap) and child_idx not in seen:
                    frontier.append((self._heap[child_idx], child_idx))
                    seen.add(child_idx)

        return result

    # ---- aggregation & history --------------------------------------------

    def get_cluster_aggregation(self) -> dict[int, int]:
        """
        Alert counts per ``cluster_id`` (open alerts only).

        Time complexity: O(C) where C is the number of distinct clusters
        (maintained incrementally — no full scan).
        """
        return dict(self._cluster_counts)

    def get_history(self) -> dict[str, Alert]:
        """Return a copy of all in-progress / resolved alerts."""
        return dict(self._history)

    def get_history_alert(self, alert_id: str) -> Alert | None:
        """Look up a single alert in history.  O(1)."""
        return self._history.get(alert_id)

    # ---- convenience lookups ----------------------------------------------

    def contains(self, alert_id: str) -> bool:
        """``True`` if the alert is currently in the heap (open).  O(1)."""
        return alert_id in self._index_map

    def get_alert(self, alert_id: str) -> Alert | None:
        """Retrieve an open alert by ID.  O(1).  Returns ``None`` if absent."""
        idx = self._index_map.get(alert_id)
        return self._heap[idx] if idx is not None else None

    def get_all_alerts(self) -> list[Alert]:
        """All open alerts (unordered).  O(N)."""
        return list(self._heap)

    # ---- invariant checker (for tests) ------------------------------------

    def verify_invariants(self) -> bool:
        """
        Assert that all three invariants hold.  Intended for test suites.

        Checks
        ------
        1. **Index-map size** matches heap size.
        2. **Index-map consistency**: every heap element's ID maps back to its
           actual index.
        3. **Heap property**: no child has higher priority than its parent.
        4. **Cluster-count consistency**: ``_cluster_counts`` matches a fresh
           count over ``_heap``.

        Returns ``True`` on success; raises ``AssertionError`` with a
        descriptive message on failure.

        Time complexity: O(N)
        """
        n = len(self._heap)

        # 1. Index map size
        assert len(self._index_map) == n, (
            f"Index-map size {len(self._index_map)} ≠ heap size {n}"
        )

        # 2 & 3.  Walk every element once.
        for i in range(n):
            alert = self._heap[i]

            # Index-map consistency
            assert alert.id in self._index_map, (
                f"Alert '{alert.id}' at heap[{i}] missing from index map"
            )
            assert self._index_map[alert.id] == i, (
                f"Index map maps '{alert.id}' → {self._index_map[alert.id]}, "
                f"but it lives at heap[{i}]"
            )

            # Heap property (check against both children)
            for child in (self._left(i), self._right(i)):
                if child < n:
                    assert not self._has_higher_priority(
                        self._heap[child], self._heap[i]
                    ), (
                        f"Heap violation: child[{child}] "
                        f"(pri={self._heap[child].priority}, "
                        f"ts={self._heap[child].timestamp}) > "
                        f"parent[{i}] "
                        f"(pri={self._heap[i].priority}, "
                        f"ts={self._heap[i].timestamp})"
                    )

        # 4. Cluster counts
        actual: dict[int, int] = {}
        for alert in self._heap:
            actual[alert.cluster_id] = actual.get(alert.cluster_id, 0) + 1
        assert actual == self._cluster_counts, (
            f"Cluster count mismatch: actual {actual} ≠ tracked {self._cluster_counts}"
        )

        return True

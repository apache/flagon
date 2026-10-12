---
title: Segmentation & Multi-Format Ingestion
component: distill
permalink: /docs/distill/segmentation/
priority: 3
---

**Apache Flagon Distill** provides schema validation, multi-format normalization (`UserALE JSON`, `Protobuf v1 JSON`, and `OpenTelemetry OTLP/JSON`), session summarization, and time/event-based log segmentation.

---

## Multi-Format Ingestion (`distill.schemas.userale`)

UserALE 2.5+ can emit telemetry in three wire formats:
1. **UserALE Flat JSON (`v2-json`)**: Array of flat JSON objects (`raw`, `interval`, `custom`, `mutation`, `replay`).
2. **Protobuf v1 Canonical JSON (`proto-json`)**: `apache.flagon.userale.v1.LogBatch` (`{"logs": [...]}`).
3. **OpenTelemetry OTLP/JSON (`otlp-json`)**: `ExportLogsServiceRequest` (`{"resourceLogs": [...]}`).

Distill's `extract_logs(payload)` and `normalize_userale_dict(record)` automatically normalize any of these three wire formats into canonical UserALE dictionaries validated by `UserAleSchema`:

```python
import distill
from distill import Log
from distill.core.types import UserAleSchema
from distill.schemas.userale import extract_logs

# Works seamlessly with flat UserALE JSON lists, Proto-JSON LogBatch dicts,
# or OTLP/JSON ExportLogsServiceRequest dicts:
logs = extract_logs(wire_payload)

# Validate with Pydantic v2:
validated = [UserAleSchema.validate_python(entry) for entry in logs]

# Or load into a Distill Log container:
log_container = Log(data=logs[0], schema=UserAleSchema)
```

---

## Session Summary & Click Rate (`distill.analytics.stat`)

### `session_summary`

Aggregates a log stream into per-session behavioral metrics (`durationSeconds`, `eventCount`, `uniqueTargets`, `pageUrls`, `eventTypeCounts`, and `isBounce`):

```python
summary = distill.session_summary(logs)
print(summary["totalSessions"], summary["totalEvents"], summary["bounceRate"])
for session_id, metrics in summary["sessions"].items():
    print(session_id, metrics["durationSeconds"], metrics["uniqueTargets"])
```

### `click_rate`

Computes overall session click rate (`clicks_per_second`, `total_session_seconds`, `total_clicks`):

```python
rate, duration_sec, clicks = distill.click_rate(logs)
```

---

## Session & Window Segmentation (`distill.segmentation`)

Distill's `Segment` and `Segments` classes slice a sorted dictionary of logs (produced by `distill.setup(...)`) into named behavioral windows that support set algebra (`union`, `intersection`, `difference`).

### 1. Creating Explicit & Rule-Based Segments

```python
import distill

sorted_logs = distill.setup("userale_logs.json", date_type="datetime")

# Match logs around specific field values (with pre/post time windows in seconds):
checkout_segments = distill.generate_segments(
    sorted_logs,
    field_name="target",
    field_values=["button#checkout"],
    start_window=5,
    end_window=15,
)

# Fixed-duration sliding windows (e.g., 60-second windows):
fixed_windows = distill.generate_fixed_time_segments(
    sorted_logs,
    interval=60,
     label="minute_window",
)

# Collapsing windows where every log inside the segment satisfies a predicate:
click_bursts = distill.generate_collapsing_window_segments(
    sorted_logs,
    func_Of_Interst=lambda log: log.get("type") == "click",
)

# Detect idle deadspace windows (>= threshold seconds between user events):
idle_periods = distill.detect_deadspace(
    sorted_logs,
    deadspace_threshold=30,
)
```

### 2. Set Operations & Exporting Segments

```python
# Combine or filter segments using set logic:
active_window = distill.difference(
    fixed_windows[0],
    idle_periods[0],
    sorted_logs,
)

# Export segmented logs to a list of dictionaries or CSV file:
records = distill.write_segment(active_window, sorted_logs)
distill.export_segments("./checkout_segments.csv", checkout_segments, sorted_logs)
```

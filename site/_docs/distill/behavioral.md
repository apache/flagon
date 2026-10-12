---
title: Frustration & Spatial Analytics
component: distill
permalink: /docs/distill/behavioral/
priority: 1
---

**Apache Flagon Distill 2.5+** includes dedicated behavioral analytics modules (`distill.analytics.frustration`, `distill.analytics.spatial`, and `distill.analytics.otel`) for quantifying UX friction, mapping spatial click/scroll density, and correlating frontend user telemetry with distributed OpenTelemetry traces.

All behavioral analytics functions accept:
- A list of UserALE flat JSON dictionaries,
- A Protobuf v1 `LogBatch` dictionary (`{"logs": [...]}`),
- An OpenTelemetry OTLP/JSON `ExportLogsServiceRequest` dictionary (`{"resourceLogs": [...]}`), or
- A Distill UID-keyed log dictionary (as returned by `distill.setup(...)`).

---

## UX Frustration Analytics (`distill.analytics.frustration`)

### 1. Rage-Click Detection (`detect_rage_clicks`)

Detects rapid, repeated clicks on the same DOM target within a short time and spatial window. Supports both:
- **Explicit `rage_click` custom logs** emitted in real time by UserALE 2.5's `RageClickDetector` (`source: "explicit"`), and
- **Retroactive detection** across raw `click` event streams (`source: "inferred"`).

```python
import distill

incidents = distill.detect_rage_clicks(
    logs,
    window_ms=1000,   # Sliding window in milliseconds (default: 1000)
    threshold=3,      # Minimum clicks within window_ms (default: 3)
    radius_px=30.0,   # Maximum Euclidean distance in pixels (default: 30.0)
)
```

Each returned incident dictionary contains:
```python
{
    "target": "button#checkout-submit",
    "pageUrl": "https://shop.example.com/cart",
    "sessionId": "session_1712000000",
    "timestamp": 1712000045120,
    "clickCount": 4,
    "targetRect": {"x": 420, "y": 510, "width": 160, "height": 44},
    "traceId": "4bf92f3577b34da6a3ce929d0e0e4736",
    "source": "explicit",  # or "inferred"
}
```

### 2. Dead-Click Detection (`detect_dead_clicks`)

Identifies clicks on elements that produce **no observable application response** within `response_window_ms` — i.e., no subsequent DOM mutation (`logType == "mutation"`), no form/input event (`input`, `change`, `submit`), and no navigation (`load` or `pageUrl` change).

```python
dead_clicks = distill.detect_dead_clicks(
    logs,
    response_window_ms=1000,
)
```

### 3. DOM Mutation Thrash Detection (`detect_dom_thrash`)

Analyzes UserALE `mutation` logs emitted by `MutationCollector` to identify high-churn layout bursts (`addedCount + removedCount + attributeCount >= churn_threshold`) and rank DOM targets by cumulative structural churn.

```python
thrash = distill.detect_dom_thrash(logs, churn_threshold=20)
print(thrash["totalChurn"], thrash["burstCount"])
print(thrash["targetChurn"])  # {"div#product-grid": 64, "ul#search-results": 22}
```

### 4. Composite UX Frustration Score (`frustration_score`)

Computes a normalized `[0.0, 100.0]` UX friction score and severity rating (`"none"`, `"low"`, `"medium"`, `"high"`) combining rage clicks, dead clicks, DOM thrash bursts, and runtime JS errors (`error` / `unhandledrejection`):

```python
report = distill.frustration_score(logs)
# {
#     "frustrationScore": 65.0,
#     "severity": "high",
#     "rageClickCount": 2,
#     "deadClickCount": 1,
#     "domThrashBurstCount": 1,
#     "errorCount": 0,
#     "rageClicks": [...],
#     "deadClicks": [...],
# }
```

---

## Spatial & Viewport Analytics (`distill.analytics.spatial`)

### 1. Viewport-Normalized Click Coordinates (`click_heatmap_data`)

Extracts raw `(x, y)` click coordinates alongside viewport-normalized coordinates (`normX`, `normY` in `[0.0, 1.0]` using `scrnRes`) and element-relative coordinates (`relX`, `relY` in `[0.0, 1.0]` when `targetRect` bounding boxes are present):

```python
points = distill.click_heatmap_data(logs, normalize_viewport=True)
# [
#   {
#     "target": "button#buy-now",
#     "pageUrl": "https://shop.example.com/item/42",
#     "type": "click",
#     "x": 640.0, "y": 360.0,
#     "normX": 0.5, "normY": 0.5,
#     "relX": 0.42, "relY": 0.55,
#     "targetRect": {"x": 580, "y": 340, "width": 140, "height": 36}
#   }
# ]
```

### 2. Interactive 2D Click Density Heatmaps (`plot_click_heatmap`)

Generates a Plotly `Figure` (`go.Histogram2d` with top-down screen y-axis orientation) for rendering in Jupyter notebooks or web dashboards:

```python
fig = distill.plot_click_heatmap(
    logs,
    nbinsx=25,
    nbinsy=25,
    normalize_viewport=True,
)
fig.show()
```

### 3. Scroll Depth Summary (`scroll_depth_summary`)

Aggregates `scroll` and `wheel` telemetry per `pageUrl` to calculate maximum vertical/horizontal scroll reach and how many viewport heights (`maxViewportMultiple`) users scrolled down each page:

```python
scroll_metrics = distill.scroll_depth_summary(logs)
# {
#   "https://shop.example.com/catalog": {
#     "maxScrollX": 0.0,
#     "maxScrollY": 2160.0,
#     "scrollEventCount": 18,
#     "maxViewportMultiple": 3.0
#   }
# }
```

---

## OpenTelemetry Trace & Replay Correlation (`distill.analytics.otel`)

### 1. Correlate Frontend Logs by W3C `traceId` (`correlate_by_trace`)

Groups all frontend UserALE interactions, rage clicks, DOM mutations, and session replay envelopes by their W3C TraceContext `traceId` (`flagon.trace_id` in OTLP):

```python
traces = distill.correlate_by_trace(otlp_or_userale_payload)
for trace_id, info in traces.items():
    print(trace_id, info["targets"], info["rageClickCount"], info["spanIds"])
```

### 2. Extract Session Replay Envelopes (`extract_replay_envelopes`)

Extracts Layer 2 `rrweb`-compatible DOM replay envelopes (`logType == "replay"`) triggered by rage clicks, uncaught exceptions, or manual flushes:

```python
envelopes = distill.extract_replay_envelopes(logs)
for env in envelopes:
    print(env["trigger"], env["sessionId"], env["frameCount"], env["traceId"])
```

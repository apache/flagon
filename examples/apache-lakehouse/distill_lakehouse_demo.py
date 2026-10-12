#
# Licensed to the Apache Software Foundation (ASF) under one or more
# contributor license agreements.  See the NOTICE file distributed with
# this work for additional information regarding copyright ownership.
# The ASF licenses this file to You under the Apache License, Version 2.0
# (the "License"); you may not use this file except in compliance with
# the License.  You may obtain a copy of the License at
#
#   http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

"""
End-to-End "All-Apache" Behavioral Lakehouse Demo:
Apache Flagon UserALE.js (OTLP/JSON) -> Apache Arrow / Parquet / Iceberg ->
Apache DataFusion Vectorized SQL -> Apache Flagon Distill 2.5 Analytics.
"""

from pathlib import Path
import sys
import tempfile

# Allow running directly from the repository root without installing flagon-distill globally
REPO_ROOT = Path(__file__).resolve().parents[2]
DISTILL_PATH = REPO_ROOT / "products" / "distill"
if str(DISTILL_PATH) not in sys.path:
    sys.path.insert(0, str(DISTILL_PATH))

import distill  # noqa: E402
from distill.schemas.userale import extract_logs  # noqa: E402


def build_sample_otlp_payload() -> dict:
    """
    Constructs a realistic OpenTelemetry ExportLogsServiceRequest payload emitted by
    Apache Flagon UserALE.js 2.5 (OtlpJsonExporter), including raw clicks, dead clicks,
    rage clicks, DOM mutation summaries, and W3C traceId/spanId correlation.
    """
    return {
        "resourceLogs": [
            {
                "resource": {
                    "attributes": [
                        {"key": "service.name", "value": {"stringValue": "flagon-storefront"}},
                        {"key": "service.version", "value": {"stringValue": "2.5.0"}},
                        {"key": "telemetry.sdk.name", "value": {"stringValue": "apache-flagon-userale"}},
                        {"key": "telemetry.sdk.version", "value": {"stringValue": "2.4.0"}},
                        {"key": "session.id", "value": {"stringValue": "sess_lakehouse_01"}},
                        {"key": "screen.width", "value": {"intValue": "1440"}},
                        {"key": "screen.height", "value": {"intValue": "900"}},
                        {"key": "browser.name", "value": {"stringValue": "Chrome"}},
                        {"key": "browser.version", "value": {"stringValue": "130.0.0.0"}},
                    ]
                },
                "scopeLogs": [
                    {
                        "scope": {"name": "org.apache.flagon.userale", "version": "2.4.0"},
                        "logRecords": [
                            # 1. User clicks product card -> followed by DOM mutation
                            {
                                "timeUnixNano": "1730000001000000000",
                                "eventName": "userale.raw.click",
                                "traceId": "4bf92f3577b34da6a3ce929d0e0e4736",
                                "spanId": "00f067aa0ba902b7",
                                "attributes": [
                                    {"key": "flagon.log_type", "value": {"stringValue": "raw"}},
                                    {"key": "flagon.event_type", "value": {"stringValue": "click"}},
                                    {"key": "flagon.target", "value": {"stringValue": "button#add-to-cart"}},
                                    {"key": "url.full", "value": {"stringValue": "https://shop.example.org/product/42"}},
                                    {"key": "flagon.location.x", "value": {"intValue": "720"}},
                                    {"key": "flagon.location.y", "value": {"intValue": "450"}},
                                    {
                                        "key": "flagon.target_rect",
                                        "value": {
                                            "kvlistValue": {
                                                "values": [
                                                    {"key": "x", "value": {"intValue": "680"}},
                                                    {"key": "y", "value": {"intValue": "430"}},
                                                    {"key": "width", "value": {"intValue": "80"}},
                                                    {"key": "height", "value": {"intValue": "40"}},
                                                ]
                                            }
                                        },
                                    },
                                ],
                                "body": {"kvlistValue": {"values": [{"key": "clicks", "value": {"intValue": "1"}}]}},
                            },
                            # 2. Throttled DOM mutation summary on cart drawer
                            {
                                "timeUnixNano": "1730000001120000000",
                                "eventName": "userale.mutation.mutation",
                                "traceId": "4bf92f3577b34da6a3ce929d0e0e4736",
                                "spanId": "00f067aa0ba902b7",
                                "attributes": [
                                    {"key": "flagon.log_type", "value": {"stringValue": "mutation"}},
                                    {"key": "flagon.event_type", "value": {"stringValue": "mutation"}},
                                    {"key": "flagon.target", "value": {"stringValue": "aside#cart-drawer"}},
                                    {"key": "url.full", "value": {"stringValue": "https://shop.example.org/product/42"}},
                                ],
                                "body": {
                                    "kvlistValue": {
                                        "values": [
                                            {"key": "addedCount", "value": {"intValue": "14"}},
                                            {"key": "removedCount", "value": {"intValue": "6"}},
                                            {"key": "attributeCount", "value": {"intValue": "4"}},
                                        ]
                                    }
                                },
                            },
                            # 3. Three rapid clicks on an unresponsive promo banner (rage click + dead clicks)
                            *[
                                {
                                    "timeUnixNano": str(1730000003000000000 + offset_ms * 1_000_000),
                                    "eventName": "userale.raw.click",
                                    "traceId": "8a3c60f7d188f8fa79d48a391a778fa6",
                                    "spanId": f"11f067aa0ba902b{idx}",
                                    "attributes": [
                                        {"key": "flagon.log_type", "value": {"stringValue": "raw"}},
                                        {"key": "flagon.event_type", "value": {"stringValue": "click"}},
                                        {"key": "flagon.target", "value": {"stringValue": "div.promo-banner"}},
                                        {"key": "url.full", "value": {"stringValue": "https://shop.example.org/checkout"}},
                                        {"key": "flagon.location.x", "value": {"intValue": str(300 + idx)}},
                                        {"key": "flagon.location.y", "value": {"intValue": str(180 + idx)}},
                                    ],
                                    "body": {},
                                }
                                for idx, offset_ms in enumerate((0, 140, 290))
                            ],
                        ],
                    }
                ],
            }
        ]
    }


def main() -> None:
    # 1. Normalize OTLP/JSON via Apache Flagon Distill
    otlp_payload = build_sample_otlp_payload()
    logs = extract_logs(otlp_payload)
    print(f"[1/3] Ingested & normalized {len(logs)} UserALE OTLP log records via Distill.")

    # 2. Write to Apache Parquet & query with Apache DataFusion (if installed)
    try:
        import datafusion
        import pyarrow as pa
        import pyarrow.parquet as pq

        with tempfile.TemporaryDirectory() as tmpdir:
            parquet_path = Path(tmpdir) / "userale_events.parquet"
            arrow_rows = [
                {
                    "session_id": r.get("sessionId"),
                    "client_time": int(r.get("clientTime", 0)),
                    "log_type": r.get("logType"),
                    "event_type": r.get("type"),
                    "target": r.get("target"),
                    "page_url": r.get("pageUrl"),
                    "trace_id": r.get("traceId"),
                }
                for r in logs
            ]
            table = pa.Table.from_pylist(arrow_rows)
            pq.write_table(table, parquet_path)

            ctx = datafusion.SessionContext()
            ctx.register_parquet("userale_events", str(parquet_path))
            df = ctx.sql(
                """
                SELECT
                    session_id,
                    client_time,
                    event_type,
                    target,
                    LEAD(target) OVER (PARTITION BY session_id ORDER BY client_time) AS next_target,
                    trace_id
                FROM userale_events
                ORDER BY client_time
                """
            )
            print("\n[2/3] Apache DataFusion Vectorized SQL Window Query over Apache Parquet:")
            df.show()
    except ImportError:
        print("\n[2/3] (Optional pyarrow/datafusion not installed; skipping SQL preview)")

    # 3. Run Apache Flagon Distill 2.5 Behavioral & Frustration Analytics
    summary = distill.session_summary(logs)
    frustration = distill.frustration_score(logs)
    transitions = distill.transition_matrix(logs, drop_recursions=True, as_dataframe=False)
    traces = distill.correlate_by_trace(logs)

    print("\n[3/3] Apache Flagon Distill 2.5 Behavioral Analytics:")
    print(f"  - Session Summary:     {summary}")
    print(
        f"  - Frustration Score:   {frustration['frustrationScore']} ({frustration['severity']}) "
        f"[rage={frustration['rageClickCount']}, dead={frustration['deadClickCount']}, "
        f"thrash={frustration['domThrashBurstCount']}]"
    )
    print(f"  - Markov Transitions:  {transitions}")
    print(f"  - Correlated Traces:   {list(traces.keys())}")


if __name__ == "__main__":
    main()

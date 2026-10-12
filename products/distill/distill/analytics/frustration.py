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

import math
from typing import Any, Dict, Iterable, List, Optional, Union

from distill.schemas.userale import extract_logs


def _normalize_logs(
    logs_input: Union[List[Dict[str, Any]], Dict[str, Any], Iterable[Dict[str, Any]]]
) -> List[Dict[str, Any]]:
    if isinstance(logs_input, dict):
        if "logs" in logs_input or "resourceLogs" in logs_input:
            logs = extract_logs(logs_input)
        else:
            logs = [v for v in logs_input.values() if isinstance(v, dict)]
    elif isinstance(logs_input, list):
        logs = extract_logs(logs_input)
    else:
        logs = [item for item in logs_input if isinstance(item, dict)]

    return sorted(
        logs,
        key=lambda item: int(
            item.get("clientTime", item.get("startTime", item.get("endTime", 0))) or 0
        ),
    )


def _get_timestamp_ms(log: Dict[str, Any]) -> int:
    for key in ("clientTime", "startTime", "endTime"):
        val = log.get(key)
        if isinstance(val, (int, float)):
            return int(val)
    return 0


def detect_rage_clicks(
    logs_input: Union[List[Dict[str, Any]], Dict[str, Any]],
    *,
    window_ms: int = 1000,
    threshold: int = 3,
    radius_px: float = 30.0,
) -> List[Dict[str, Any]]:
    """
    Detects rage-click incidents from UserALE logs.
    Supports both explicit `type == "rage_click"` custom logs emitted by UserALE 2.5+
    and retroactive detection on raw `click` event streams.
    """
    logs = _normalize_logs(logs_input)
    incidents: List[Dict[str, Any]] = []
    explicit_windows: List[Dict[str, Any]] = []

    # 1. Collect explicit rage_click logs emitted by UserALE 2.5+
    for log in logs:
        if log.get("type") == "rage_click":
            ts = _get_timestamp_ms(log)
            details = log.get("details") if isinstance(log.get("details"), dict) else {}
            click_count = int(details.get("clickCount", threshold))
            target_rect = details.get("targetRect") or log.get("targetRect")
            incident = {
                "target": log.get("target") or "#document",
                "pageUrl": log.get("pageUrl", ""),
                "sessionId": log.get("sessionId") or log.get("sessionID"),
                "timestamp": ts,
                "clickCount": click_count,
                "targetRect": target_rect,
                "traceId": log.get("traceId"),
                "source": "explicit",
            }
            incidents.append(incident)
            explicit_windows.append(incident)

    # 2. Retroactively scan raw click streams for bursts not already covered by explicit logs
    recent_clicks: List[Dict[str, Any]] = []
    for log in logs:
        if log.get("logType") != "raw" or log.get("type") != "click":
            continue
        target = log.get("target")
        if not target or target == "Unknown":
            continue

        ts = _get_timestamp_ms(log)
        loc = log.get("location") if isinstance(log.get("location"), dict) else {}
        x = loc.get("x")
        y = loc.get("y")

        cutoff = ts - window_ms
        recent_clicks = [c for c in recent_clicks if c["timestamp"] >= cutoff]
        sample = {
            "target": target,
            "timestamp": ts,
            "x": float(x) if isinstance(x, (int, float)) else None,
            "y": float(y) if isinstance(y, (int, float)) else None,
            "log": log,
        }
        recent_clicks.append(sample)

        matching = []
        for c in recent_clicks:
            if c["target"] != target:
                continue
            if (
                c["x"] is not None
                and c["y"] is not None
                and sample["x"] is not None
                and sample["y"] is not None
            ):
                if math.hypot(c["x"] - sample["x"], c["y"] - sample["y"]) <= radius_px:
                    matching.append(c)
            else:
                matching.append(c)

        if len(matching) >= threshold:
            already_explicit = any(
                ew["target"] == target and abs(ew["timestamp"] - ts) <= window_ms
                for ew in explicit_windows
            )
            if not already_explicit:
                incidents.append(
                    {
                        "target": target,
                        "pageUrl": log.get("pageUrl", ""),
                        "sessionId": log.get("sessionId") or log.get("sessionID"),
                        "timestamp": ts,
                        "clickCount": len(matching),
                        "targetRect": log.get("targetRect"),
                        "traceId": log.get("traceId"),
                        "source": "inferred",
                    }
                )
            recent_clicks = [c for c in recent_clicks if c["target"] != target]

    return sorted(incidents, key=lambda item: item["timestamp"])


def detect_dead_clicks(
    logs_input: Union[List[Dict[str, Any]], Dict[str, Any]],
    *,
    response_window_ms: int = 1000,
) -> List[Dict[str, Any]]:
    """
    Identifies 'dead clicks': raw click interactions that are NOT followed within
    `response_window_ms` by a DOM mutation (`logType == 'mutation'`), form/input change
    (`input`, `change`, `submit`), or page navigation (`pageUrl` change or `load`).
    """
    logs = _normalize_logs(logs_input)
    dead_clicks: List[Dict[str, Any]] = []

    for i, log in enumerate(logs):
        if log.get("logType") != "raw" or log.get("type") != "click":
            continue

        click_ts = _get_timestamp_ms(log)
        click_url = log.get("pageUrl", "")
        has_effect = False

        for j in range(i + 1, len(logs)):
            nxt = logs[j]
            nxt_ts = _get_timestamp_ms(nxt)
            if nxt_ts - click_ts > response_window_ms:
                break

            nxt_log_type = nxt.get("logType")
            nxt_event_type = nxt.get("type")
            nxt_url = nxt.get("pageUrl", "")

            if (
                nxt_log_type == "mutation"
                or nxt_event_type in ("mutation", "input", "change", "submit", "load")
                or (nxt_url and click_url and nxt_url != click_url)
            ):
                has_effect = True
                break

        if not has_effect:
            dead_clicks.append(
                {
                    "target": log.get("target") or "#document",
                    "pageUrl": click_url,
                    "sessionId": log.get("sessionId") or log.get("sessionID"),
                    "timestamp": click_ts,
                    "location": log.get("location"),
                    "targetRect": log.get("targetRect"),
                    "traceId": log.get("traceId"),
                }
            )

    return dead_clicks


def detect_dom_thrash(
    logs_input: Union[List[Dict[str, Any]], Dict[str, Any]],
    *,
    churn_threshold: int = 20,
) -> Dict[str, Any]:
    """
    Analyzes UserALE `mutation` logs to identify high-churn DOM mutation bursts
    and aggregate structural churn per target selector.
    """
    logs = _normalize_logs(logs_input)
    bursts: List[Dict[str, Any]] = []
    target_churn: Dict[str, int] = {}
    total_added = 0
    total_removed = 0
    total_attributes = 0

    for log in logs:
        if log.get("logType") != "mutation" and log.get("type") != "mutation":
            continue
        details = log.get("details") if isinstance(log.get("details"), dict) else {}
        added = int(details.get("addedCount", 0) or 0)
        removed = int(details.get("removedCount", 0) or 0)
        attrs = int(details.get("attributeCount", 0) or 0)
        churn = added + removed + attrs

        total_added += added
        total_removed += removed
        total_attributes += attrs

        primary_target = log.get("target") or "#document"
        target_churn[primary_target] = target_churn.get(primary_target, 0) + churn

        if churn >= churn_threshold:
            bursts.append(
                {
                    "target": primary_target,
                    "targets": details.get("targets", [primary_target]),
                    "timestamp": _get_timestamp_ms(log),
                    "addedCount": added,
                    "removedCount": removed,
                    "attributeCount": attrs,
                    "totalChurn": churn,
                    "pageUrl": log.get("pageUrl", ""),
                    "sessionId": log.get("sessionId") or log.get("sessionID"),
                }
            )

    return {
        "totalAdded": total_added,
        "totalRemoved": total_removed,
        "totalAttributes": total_attributes,
        "totalChurn": total_added + total_removed + total_attributes,
        "burstCount": len(bursts),
        "bursts": bursts,
        "targetChurn": dict(
            sorted(target_churn.items(), key=lambda kv: kv[1], reverse=True)
        ),
    }


def frustration_score(
    logs_input: Union[List[Dict[str, Any]], Dict[str, Any]]
) -> Dict[str, Any]:
    """
    Computes a composite UX frustration score (0.0 to 100.0) and breakdown
    combining rage clicks, dead clicks, DOM thrash bursts, and error triggers.
    """
    logs = _normalize_logs(logs_input)
    rage_incidents = detect_rage_clicks(logs)
    dead_incidents = detect_dead_clicks(logs)
    thrash_summary = detect_dom_thrash(logs)

    error_count = sum(
        1
        for log in logs
        if log.get("type") in ("error", "unhandledrejection")
        or (
            log.get("logType") == "replay"
            and log.get("trigger") in ("error", "unhandledrejection")
        )
    )

    raw_score = (
        len(rage_incidents) * 25.0
        + len(dead_incidents) * 5.0
        + thrash_summary["burstCount"] * 10.0
        + error_count * 30.0
    )
    score = round(min(100.0, float(raw_score)), 1)

    if score >= 60.0:
        severity = "high"
    elif score >= 25.0:
        severity = "medium"
    elif score > 0.0:
        severity = "low"
    else:
        severity = "none"

    return {
        "frustrationScore": score,
        "severity": severity,
        "rageClickCount": len(rage_incidents),
        "deadClickCount": len(dead_incidents),
        "domThrashBurstCount": thrash_summary["burstCount"],
        "errorCount": error_count,
        "rageClicks": rage_incidents,
        "deadClicks": dead_incidents,
    }

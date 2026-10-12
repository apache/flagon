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

from typing import Any, Dict, List, Union

from distill.analytics.frustration import _get_timestamp_ms, _normalize_logs


def correlate_by_trace(
    logs_input: Union[List[Dict[str, Any]], Dict[str, Any]]
) -> Dict[str, Dict[str, Any]]:
    """
    Groups UserALE interactions, DOM mutations, rage clicks, and session replay
    envelopes by OpenTelemetry `traceId`, linking frontend user behavior to
    distributed backend traces.
    """
    logs = _normalize_logs(logs_input)
    traces: Dict[str, Dict[str, Any]] = {}

    for log in logs:
        trace_id = log.get("traceId")
        if not isinstance(trace_id, str) or not trace_id:
            continue

        ts = _get_timestamp_ms(log)
        entry = traces.setdefault(
            trace_id,
            {
                "traceId": trace_id,
                "spanIds": [],
                "sessionIds": [],
                "pageUrls": [],
                "targets": [],
                "eventTypes": [],
                "rageClickCount": 0,
                "mutationCount": 0,
                "replayCount": 0,
                "startTime": ts,
                "endTime": ts,
                "logs": [],
            },
        )

        if ts > 0:
            entry["startTime"] = (
                min(entry["startTime"], ts) if entry["startTime"] > 0 else ts
            )
            entry["endTime"] = max(entry["endTime"], ts)

        span_id = log.get("spanId")
        if isinstance(span_id, str) and span_id and span_id not in entry["spanIds"]:
            entry["spanIds"].append(span_id)

        sess_id = log.get("sessionId") or log.get("sessionID")
        if isinstance(sess_id, str) and sess_id and sess_id not in entry["sessionIds"]:
            entry["sessionIds"].append(sess_id)

        page_url = log.get("pageUrl")
        if isinstance(page_url, str) and page_url and page_url not in entry["pageUrls"]:
            entry["pageUrls"].append(page_url)

        target = log.get("target")
        if isinstance(target, str) and target and target not in entry["targets"]:
            entry["targets"].append(target)

        etype = log.get("type") or log.get("logType")
        if isinstance(etype, str) and etype and etype not in entry["eventTypes"]:
            entry["eventTypes"].append(etype)

        if log.get("type") == "rage_click":
            entry["rageClickCount"] += 1
        if log.get("logType") == "mutation" or log.get("type") == "mutation":
            entry["mutationCount"] += 1
        if log.get("logType") == "replay" or log.get("type") == "session_replay":
            entry["replayCount"] += 1

        entry["logs"].append(log)

    return traces


def extract_replay_envelopes(
    logs_input: Union[List[Dict[str, Any]], Dict[str, Any]]
) -> List[Dict[str, Any]]:
    """
    Extracts all Layer 2 `rrweb`-compatible session replay envelopes (`logType == 'replay'`)
    from a log stream, normalizing frames whether stored at top-level `frames` or inside `details.frames`.
    """
    logs = _normalize_logs(logs_input)
    envelopes: List[Dict[str, Any]] = []

    for log in logs:
        if log.get("logType") != "replay" and log.get("type") != "session_replay":
            continue

        details = log.get("details") if isinstance(log.get("details"), dict) else {}
        frames = log.get("frames")
        if not isinstance(frames, list):
            frames = details.get("frames", [])
        if not isinstance(frames, list):
            frames = []

        envelopes.append(
            {
                "trigger": log.get("trigger") or details.get("trigger", "manual"),
                "sessionId": log.get("sessionId") or log.get("sessionID"),
                "pageUrl": log.get("pageUrl", ""),
                "startTime": log.get("startTime", _get_timestamp_ms(log)),
                "endTime": log.get("endTime", _get_timestamp_ms(log)),
                "frameCount": int(log.get("frameCount", len(frames))),
                "frames": frames,
                "traceId": log.get("traceId"),
                "spanId": log.get("spanId"),
            }
        )

    return envelopes

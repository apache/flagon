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
import copy
import json
import os
import re
from typing import Any, Dict, Iterable, List, Optional, Tuple, Union

import pandas as pd

import distill
from distill.schemas.userale import extract_logs


def _extract_log_list(
    source: Union[str, os.PathLike, List[Dict[str, Any]], Dict[str, Any]]
) -> List[Dict[str, Any]]:
    if isinstance(source, (str, os.PathLike)):
        with open(source) as text_file:
            text = text_file.read()
        text = re.sub(r"\n\t,\n", "\n", text)
        raw = json.loads(text)
        return extract_logs(raw)
    if isinstance(source, dict):
        if "logs" in source or "resourceLogs" in source:
            return extract_logs(source)
        # Already a UID -> log dict
        return [copy.deepcopy(v) for v in source.values() if isinstance(v, dict)]
    if isinstance(source, Iterable):
        return [copy.deepcopy(item) for item in source if isinstance(item, dict)]
    return []


# Setup the sorted dictionary
def setup(file, date_type="datetime", filter_func=None):
    """
    :param file: Location to the json file, or a list/dict of logs
    :param date_type: 'datetime' or 'integer'
    :param filter_func: Optional predicate function to filter logs
    :return: A sorted dictionary (based on clientTime/startTime)
    """
    data = _extract_log_list(file)
    data = [
        x
        for x in data
        if x and ("clientTime" in x or "startTime" in x or "endTime" in x)
    ]
    data = list(filter(filter_func, data)) if filter_func else data

    # Convert clientTime to specified type
    for log in data:
        if "clientTime" not in log:
            log["clientTime"] = log.get("startTime", log.get("endTime", 0))
        client_time = log["clientTime"]
        if date_type == "integer" and not isinstance(client_time, int):
            log["clientTime"] = int(distill.epoch_to_datetime(client_time))
        elif date_type == "datetime" and not isinstance(client_time, pd.Timestamp):
            log["clientTime"] = pd.to_datetime(client_time, unit="ms", origin="unix")

    # Index data on UUID without overwriting logs that share the same millisecond
    indexed: Dict[str, Dict[str, Any]] = {}
    for idx, log in enumerate(data):
        uid = distill.getUUID(log)
        if uid in indexed:
            uid = f"{uid}_{idx}"
        indexed[uid] = log

    # Sort data based off clientTime, return dict
    return dict(sorted(indexed.items(), key=lambda kv: kv[1]["clientTime"]))


# Session Click-Rate
def click_rate(file) -> Tuple[float, float, int]:
    """
    :param file: Location to the json file, or a list/dict of logs
    :return: Click-rate (clicks/sec), total session time, and total number of clicks.
    """

    def filter_func(log):
        return bool(log and log.get("logType") == "raw")

    sorted_dict = setup(file, "datetime", filter_func=filter_func)
    if not sorted_dict:
        return (0.0, 0.0, 0)

    times = []
    clicks = 0
    for value in sorted_dict.values():
        times.append(value["clientTime"])
        if value.get("type") == "click":
            clicks += 1

    if not times:
        return (0.0, 0.0, 0)

    total_time = float((times[-1] - times[0]).total_seconds())
    if total_time <= 0:
        return (float(clicks), 0.0, clicks)

    clickrate = round((clicks / total_time), 2)
    return (clickrate, total_time, clicks)


def session_summary(
    logs_input: Union[str, os.PathLike, List[Dict[str, Any]], Dict[str, Any]]
) -> Dict[str, Any]:
    """
    Computes a comprehensive statistical summary for a UserALE session or log collection,
    including counts by logType, click rate, rage clicks, mutations, unique targets/pages,
    page load time, and OpenTelemetry trace IDs.
    """
    logs = _extract_log_list(logs_input)
    if not logs:
        return {
            "total_logs": 0,
            "raw_logs": 0,
            "interval_logs": 0,
            "custom_logs": 0,
            "mutation_logs": 0,
            "replay_logs": 0,
            "click_count": 0,
            "rage_click_count": 0,
            "duration_seconds": 0.0,
            "click_rate": 0.0,
            "unique_targets": 0,
            "unique_pages": 0,
            "page_load_time_ms": None,
            "trace_ids": [],
        }

    timestamps: List[int] = []
    raw_count = 0
    interval_count = 0
    custom_count = 0
    mutation_count = 0
    replay_count = 0
    click_count = 0
    rage_click_count = 0
    targets = set()
    pages = set()
    trace_ids = set()
    page_load_ms: Optional[float] = None

    for log in logs:
        ltype = log.get("logType", "raw")
        etype = log.get("type")
        if ltype == "raw":
            raw_count += 1
            if etype == "click":
                click_count += 1
        elif ltype == "interval":
            interval_count += 1
        elif ltype == "mutation" or etype == "mutation":
            mutation_count += 1
        elif ltype == "replay" or etype == "session_replay":
            replay_count += 1
        else:
            custom_count += 1

        if etype == "rage_click":
            rage_click_count += 1

        details = log.get("details")
        if etype == "load" and isinstance(details, dict) and "pageLoadTime" in details:
            try:
                page_load_ms = float(details["pageLoadTime"])
            except (TypeError, ValueError):
                pass

        for t_key in ("clientTime", "startTime", "endTime"):
            t_val = log.get(t_key)
            if isinstance(t_val, (int, float)) and t_val > 0:
                timestamps.append(int(t_val))

        target = log.get("target")
        if isinstance(target, str) and target:
            targets.add(target)

        page_url = log.get("pageUrl")
        if isinstance(page_url, str) and page_url:
            pages.add(page_url)

        trace_id = log.get("traceId")
        if isinstance(trace_id, str) and trace_id:
            trace_ids.add(trace_id)

    duration_s = (
        round((max(timestamps) - min(timestamps)) / 1000.0, 3)
        if len(timestamps) >= 2
        else 0.0
    )
    rate = (
        round(click_count / duration_s, 2)
        if duration_s > 0
        else float(click_count)
    )

    return {
        "total_logs": len(logs),
        "raw_logs": raw_count,
        "interval_logs": interval_count,
        "custom_logs": custom_count,
        "mutation_logs": mutation_count,
        "replay_logs": replay_count,
        "click_count": click_count,
        "rage_click_count": rage_click_count,
        "duration_seconds": duration_s,
        "click_rate": rate,
        "unique_targets": len(targets),
        "unique_pages": len(pages),
        "page_load_time_ms": page_load_ms,
        "trace_ids": sorted(trace_ids),
    }

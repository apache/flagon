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
import re
from datetime import datetime
from urllib.parse import urlparse


def extract_timestamp_ms(item):
    """
    Extracts an epoch-millisecond timestamp from a UserALE log dict,
    supporting raw (`clientTime`) and interval (`startTime`/`endTime`) logs
    as well as integer/float/datetime/pandas.Timestamp values.
    """
    if not isinstance(item, dict):
        return 0
    for key in ("clientTime", "startTime", "endTime"):
        if key not in item:
            continue
        val = item[key]
        if val is None or isinstance(val, bool):
            continue
        if isinstance(val, (int, float)):
            return int(val) if math.isfinite(val) else 0
        if (
            hasattr(val, "value")
            and isinstance(getattr(val, "value", None), int)
            and hasattr(val, "tz")
        ):
            return int(val.value // 1_000_000)
        if isinstance(val, datetime):
            return int(val.timestamp() * 1000)
    return 0


##############################
# SUPPORTING FUNCTIONS FOR PARSING SESSION #
###############################
def group_by_user(log):
    """
    A helper function to create separate logs associated with unique users
    where a unique user is resolved from browserSessionId, userId, or sessionId.
    :param log: Userale logs as a list of log dicts or a uid -> log dict
    :return: A dictionary that represent logs belonging to unique users
    """
    grouped_data = {}
    items = log.values() if isinstance(log, dict) else log
    for d in items:
        if not isinstance(d, dict):
            continue
        session_id = (
            d.get("browserSessionId")
            or d.get("userId")
            or d.get("sessionId")
            or d.get("sessionID")
            or ""
        )
        combined_key = str(session_id)
        if combined_key not in grouped_data:
            grouped_data[combined_key] = []
        grouped_data[combined_key].append(d)
    return grouped_data


def chunk_by_idle_time(log, inactive_interval_s=60):
    """
    Divides logs into sessions separated by inactivity exceeding
    `inactive_interval_s` seconds. Each session is keyed by its own
    starting timestamp (disambiguated cleanly if duplicates occur).

    :param log: Userale logs as a list of log dicts
    :param inactive_interval_s: Inactivity threshold in seconds
    :return: A dictionary mapping session keys to lists of logs
    """
    if not log:
        return {}

    separated_sets = {}
    current_set = []
    difference_in_ms = inactive_interval_s * 1000

    first_ts = extract_timestamp_ms(log[0])
    previous_timestamp = first_ts
    chunk_start_timestamp = first_ts
    seq = 0

    def _emit_chunk(start_ts, items):
        nonlocal seq
        base_key = "time" + str(start_ts)
        key = base_key
        while key in separated_sets:
            seq += 1
            key = f"{base_key}_{seq}"
        separated_sets[key] = items

    for item in log:
        current_timestamp = extract_timestamp_ms(item)
        if current_timestamp - previous_timestamp > difference_in_ms:
            if current_set:
                _emit_chunk(chunk_start_timestamp, current_set)
                current_set = []
            chunk_start_timestamp = current_timestamp

        current_set.append(item)
        previous_timestamp = current_timestamp

    if current_set:
        _emit_chunk(chunk_start_timestamp, current_set)
    return separated_sets


def chunk_by_tabId(log):
    """
    Separate logs by their tab/httpSessionId.
    :param log: Userale logs as a list of log dicts or a uid -> log dict
    :return: A dictionary that represent sets separated by unique httpSessionId/tabId
    """
    grouped_data = {}
    items = log.values() if isinstance(log, dict) else log
    for item in items:
        if not isinstance(item, dict):
            continue
        # Tab identifiers may be stored in httpSessionId, tabId, or details
        tab_val = item.get("httpSessionId") or item.get("tabId")
        if tab_val is None and isinstance(item.get("details"), dict):
            tab_val = item["details"].get("tabId")
        if tab_val is not None:
            tab_key = "tab" + str(tab_val)
        else:
            tab_key = "unknown"
        if tab_key not in grouped_data:
            grouped_data[tab_key] = []
        grouped_data[tab_key].append(item)
    return grouped_data


def match_url(url, pattern):
    """
    Matches `url` against wildcard `pattern` (where `*` matches zero or more
    characters) in strictly linear O(|url| + |pattern|) time without ReDoS.
    """
    if not isinstance(url, str) or not isinstance(pattern, str):
        return False

    collapsed = re.sub(r"\*+", "*", pattern)
    parts = collapsed.split("*")
    if len(parts) == 1:
        return url == collapsed

    prefix = parts[0]
    if not url.startswith(prefix):
        return False
    pos = len(prefix)

    for mid in parts[1:-1]:
        if not mid:
            continue
        idx = url.find(mid, pos)
        if idx == -1:
            return False
        pos = idx + len(mid)

    suffix = parts[-1]
    if suffix and (len(url) - pos < len(suffix) or not url.endswith(suffix)):
        return False
    return True


def flatten_dict(orig_dict, sep="_"):
    """
    Given a possibly nested dictionary containing logs, make a flat
    dictionary where each key-value pair represent one user session
    """
    new_dict = {}
    for first_key in orig_dict:
        if isinstance(orig_dict[first_key], dict):
            for second_key in orig_dict[first_key]:
                if isinstance(orig_dict[first_key][second_key], dict):
                    for time_key in orig_dict[first_key][second_key]:
                        combined_key = first_key + sep + second_key + sep + time_key
                        new_dict[combined_key] = orig_dict[first_key][second_key][
                            time_key
                        ]
                else:
                    combined_key = first_key + sep + second_key
                    new_dict[combined_key] = orig_dict[first_key][second_key]
        else:
            new_dict[first_key] = orig_dict[first_key]

    return new_dict


def chunk_by_domain(log, pattern="."):
    """
    Separate logs by the site domain extracted from `pageUrl`.
    :param log: List of UserALE log dictionaries
    :param pattern: Wildcard pattern to match domain against, or "." for all
    :return: A dictionary mapping domain keys to lists of logs
    """
    grouped_data = {}
    for entry in log:
        page_url = entry.get("pageUrl") if isinstance(entry, dict) else None
        if isinstance(page_url, str) and page_url:
            netloc = urlparse(page_url).netloc
            domain = "domain" + netloc if netloc else "unknown"
            if pattern != ".":
                if match_url(domain, pattern):
                    domain_key = "domain" + pattern
                else:
                    continue
            else:
                domain_key = domain
        else:
            domain_key = "unknown"

        if domain_key not in grouped_data:
            grouped_data[domain_key] = []
        grouped_data[domain_key].append(entry)
    return grouped_data

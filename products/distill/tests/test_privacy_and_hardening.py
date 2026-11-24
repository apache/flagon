#
# Licensed to the Apache Software Foundation (ASF) under one
# or more contributor license agreements.  See the NOTICE file distributed with
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

import csv
import time
from datetime import datetime, timezone

import pandas as pd
import pytest

import distill
from distill.analytics.graph.graph import display_segments, funnel, get_color_graph
from distill.core.log import Log, LogId
from distill.schemas.userale import UserAleRawSchema, normalize_userale_dict
from distill.segmentation.segment import (
    Segment,
    export_segments,
    generate_collapsing_window_segments,
    generate_fixed_time_segments,
)
from distill.segmentation.segments import Segments
from distill.sessions.utils import chunk_by_domain, chunk_by_idle_time, match_url


def test_log_id_roundtrip_client_time_zero_and_post_2038():
    zero_id = LogId("log_abcd1234", 0)
    assert zero_id.get_timestamp() == 0
    assert zero_id.get_datetime() == datetime(1970, 1, 1, tzinfo=timezone.utc)
    parsed_zero = LogId.parse(str(zero_id))
    assert parsed_zero == zero_id

    post_2038_s = 2_500_000_000.5
    future_id = LogId("log_abcd1234", post_2038_s)
    assert future_id.get_timestamp() == 2_500_000_000
    assert future_id.get_timestamp_ms() == 2_500_000_000_500
    assert LogId.parse(str(future_id)) == future_id
    assert zero_id < future_id

    # Same dict and JSON serialization produce deterministic identical LogId
    payload = {
        "target": "",
        "path": [],
        "pageUrl": "",
        "logType": "raw",
        "type": "click",
        "userAction": True,
        "clientTime": 1700000000000,
    }
    log_a = Log(payload)
    log_b = Log(log_a.to_json())
    assert str(log_a.id) == str(log_b.id)


def test_normalize_privacy_minimized_and_reserved_keys():
    proto_minimized = {
        "logType": "LOG_TYPE_RAW",
        "raw": {
            "target": "",
            "path": [],
            "eventType": "click",
            "userAction": True,
            "metadata": {
                "clientTime": "1700000000000",
                "userId": "real-user",
                "sessionId": "real-session",
                "pageUrl": "",
            },
            "customFields": {
                "userId": "spoofed-user",
                "sessionId": "spoofed-session",
                "clientTime": 999,
                "customTag": "safe-value",
            },
        },
    }
    flat_proto = normalize_userale_dict(proto_minimized)
    assert flat_proto["target"] == ""
    assert flat_proto["scrnRes"] is None
    assert flat_proto["location"] is None
    assert flat_proto["userId"] == "real-user"
    assert flat_proto["sessionId"] == "real-session"
    assert flat_proto["clientTime"] == 1700000000000
    assert flat_proto["customTag"] == "safe-value"

    otlp_minimized = {
        "timeUnixNano": "1700000000000000000",
        "attributes": [
            {"key": "flagon.log_type", "value": {"stringValue": "raw"}},
            {"key": "flagon.event_type", "value": {"stringValue": "click"}},
            {"key": "flagon.target", "value": {"stringValue": ""}},
        ],
    }
    flat_otlp = normalize_userale_dict(otlp_minimized)
    assert flat_otlp["target"] == ""
    assert flat_otlp["scrnRes"] is None
    assert flat_otlp["location"] is None

    # Schema validation accepts pageUrl=None and minimized fields
    validated = UserAleRawSchema.model_validate(
        {
            "target": "",
            "path": [],
            "pageUrl": None,
            "logType": "raw",
            "userAction": False,
            "clientTime": 0,
        }
    )
    assert validated.page_url is None
    assert validated.target == ""


def test_frustration_skips_minimized_empty_target_and_null_location_and_pd_timestamp():
    base_ts = pd.Timestamp("2024-01-01T00:00:00")
    minimized_clicks = [
        {
            "clientTime": base_ts,
            "logType": "raw",
            "type": "click",
            "target": "",
            "location": None,
        },
        {
            "clientTime": pd.Timestamp("2024-01-01T00:00:00.100"),
            "logType": "raw",
            "type": "click",
            "target": "#document",
            "location": None,
        },
        {
            "clientTime": pd.Timestamp("2024-01-01T00:00:00.200"),
            "logType": "raw",
            "type": "click",
            "target": "button#ok",
            "location": None,
        },
        {
            "clientTime": pd.Timestamp("2024-01-01T00:00:00.300"),
            "logType": "raw",
            "type": "click",
            "target": "button#ok",
            "location": None,
        },
        {
            "clientTime": pd.Timestamp("2024-01-01T00:00:00.400"),
            "logType": "raw",
            "type": "click",
            "target": "button#ok",
            "location": None,
        },
    ]
    assert distill.detect_rage_clicks(minimized_clicks) == []


def test_session_chunking_and_linear_match_url():
    # chunk_by_idle_time preserves all chunks even when trailing chunk has 1 log
    logs = [
        {"clientTime": 1000, "type": "click"},
        {"clientTime": 1500, "type": "click"},
        {"clientTime": 100_000, "type": "click"},
    ]
    chunks = chunk_by_idle_time(logs, inactive_interval_s=10)
    assert len(chunks) == 2
    assert sum(len(v) for v in chunks.values()) == 3

    # chunk_by_domain handles pageUrl=None and "" without TypeError
    domain_logs = [
        {"clientTime": 1000, "pageUrl": None},
        {"clientTime": 2000, "pageUrl": ""},
        {"clientTime": 3000, "pageUrl": "https://example.com/a"},
    ]
    domains = chunk_by_domain(domain_logs, ".")
    assert len(domains["unknown"]) == 2
    assert len(domains["domainexample.com"]) == 1

    # match_url resists adversarial wildcard patterns in linear time
    adversarial_pattern = "a" + "*a" * 30
    adversarial_url = "a" * 30 + "b"
    start = time.monotonic()
    assert match_url(adversarial_url, adversarial_pattern) is False
    assert (time.monotonic() - start) < 0.05


def test_graph_spatial_segmentation_process_and_export_hardening(tmp_path):
    # Graph with minimized path=[] / target="" and empty/epoch-ms segments
    log_dict = {
        "l1": {"clientTime": 1000, "target": "", "path": []},
        "l2": {"clientTime": 2000, "target": None, "path": None},
    }
    graph, colors = get_color_graph(
        log_dict, {"Other": "blue"}, lambda *_: "Other"
    )
    assert len(graph.nodes) >= 1
    assert all(c in ("blue", "gray") for c in colors)

    segs = Segments(
        [
            Segment("empty", (1000, 1000), 0, []),
            Segment("s1", (1000, 2000), 2, ["l1", "l2"]),
        ]
    )
    fig = display_segments(segs, log_dict, lambda *_: "Other", {"Other": "Other"})
    assert fig is not None

    # Funnel respects cutoff on dense graphs
    dense_edges = [(str(i), str(j)) for i in range(6) for j in range(6) if i != j]
    funnel_fig = funnel(dense_edges, ["0", "5"], infer=True, cutoff=4)
    assert funnel_fig is not None

    # Normalized heatmap drops clicks lacking valid scrnRes
    clicks = [
        {
            "clientTime": 1000,
            "type": "click",
            "location": {"x": 500, "y": 500},
            "scrnRes": None,
        },
        {
            "clientTime": 2000,
            "type": "click",
            "location": {"x": 500, "y": 250},
            "scrnRes": {"width": 1000, "height": 500},
        },
    ]
    hmap = distill.plot_click_heatmap(clicks, normalize_viewport=True)
    trace = hmap.to_dict()["data"][0]
    assert list(trace["x"]) == [0.5]
    assert list(trace["y"]) == [0.5]

    # Scroll vs wheel separation
    scroll_logs = [
        {"type": "scroll", "pageUrl": "https://a.test", "details": {"x": 0, "y": 100}},
        {"type": "wheel", "pageUrl": "https://a.test", "details": {"deltaY": 900}},
    ]
    scroll_summary = distill.scroll_depth_summary(scroll_logs)
    assert scroll_summary["https://a.test"]["maxScrollY"] == 100.0
    assert scroll_summary["https://a.test"]["scrollEventCount"] == 1
    assert scroll_summary["https://a.test"]["wheelEventCount"] == 1
    assert scroll_summary["https://a.test"]["totalWheelDeltaY"] == 900.0

    # Segmentation: collapsing 1-log match, unhashable dict values, time<=0, CSV formula
    seg_logs = {
        "a": {"clientTime": 1000, "meta": {"k": "miss"}},
        "b": {"clientTime": 2000, "meta": {"k": "hit"}},
    }
    collapsing = generate_collapsing_window_segments(
        seg_logs, "meta", [{"k": "hit"}]
    )
    assert len(collapsing) == 1
    assert collapsing.get_segment_list()[0].uids == ["b"]

    with pytest.raises(ValueError):
        generate_fixed_time_segments(seg_logs, 0)

    csv_path = tmp_path / "segments.csv"
    evil_seg = Segment("=CMD('calc')", (1000, 2000), 1, ["a"])
    evil_seg.generate_field_name = "+SUM(1,1)"
    export_segments(str(csv_path), Segments([evil_seg]))
    with open(csv_path, newline="") as fh:
        rows = list(csv.reader(fh))
    assert rows[1][0] == "'=CMD('calc')"
    assert rows[1][4] == "'+SUM(1,1)"

    # Process: find_meta_values with unhashable dicts/lists; pairwise < 2 items
    unhashable_logs = {
        "a": {"details": {"x": 1}, "path": []},
        "b": {"details": {"x": 1}, "path": []},
    }
    assert distill.find_meta_values("details", unhashable_logs) == [{"x": 1}]
    assert distill.pairwiseSeq([1], split=True) == ((), ())
    assert distill.pairwiseStag([1], split=True) == ((), ())


def test_star_import_clean():
    namespace = {}
    exec("from distill import *", namespace)
    assert "Log" in namespace

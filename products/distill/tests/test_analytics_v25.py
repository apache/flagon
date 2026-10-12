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

import json

import distill
from distill.analytics.graph.graph import createDiGraph, funnel
from distill.schemas.userale import UserAleRawSchema, normalize_userale_dict
from distill.segmentation.segment import generate_segments
from distill.segmentation.segments import Segments
from distill.sessions.session import Session
from distill.sessions.sessions import Sessions
from distill.sessions.utils import chunk_by_tabId, group_by_user
from distill.utils.crud import getUUID


def test_get_uuid_supports_camel_case_and_intervals():
    log1 = {
        "sessionId": "sess_1",
        "clientTime": 1700000000000,
        "type": "click",
        "logType": "raw",
    }
    log2 = {
        "sessionId": "sess_1",
        "startTime": 1700000000500,
        "endTime": 1700000001000,
        "type": "mouseover",
        "logType": "interval",
    }
    uuid1 = getUUID(log1)
    uuid2 = getUUID(log2)
    assert isinstance(uuid1, str) and len(uuid1) > 0
    assert isinstance(uuid2, str) and len(uuid2) > 0
    assert uuid1 != uuid2


def test_stats_setup_and_click_rate_and_session_summary():
    # Two logs at the exact same clientTime millisecond should both be preserved
    logs = [
        {
            "sessionId": "s1",
            "clientTime": 1700000000000,
            "type": "click",
            "logType": "raw",
            "target": "button#submit",
            "pageUrl": "https://example.com/a",
        },
        {
            "sessionId": "s1",
            "clientTime": 1700000000000,
            "type": "mouseover",
            "logType": "raw",
            "target": "button#submit",
            "pageUrl": "https://example.com/a",
        },
        {
            "sessionId": "s1",
            "clientTime": 1700000002000,
            "type": "error",
            "logType": "raw",
            "target": "window",
            "pageUrl": "https://example.com/b",
        },
    ]

    # click_rate with empty logs should return (0.0, 0.0, 0) without ZeroDivisionError
    assert distill.click_rate([]) == (0.0, 0.0, 0)
    # 1 click over 2.0 seconds -> (0.5, 2.0, 1)
    rate, total_time, clicks = distill.click_rate(logs)
    assert rate == 0.5
    assert total_time == 2.0
    assert clicks == 1

    summary = distill.session_summary(logs)
    assert summary["total_logs"] == 3
    assert summary["raw_logs"] == 3
    assert summary["duration_seconds"] == 2.0
    assert summary["click_count"] == 1
    assert summary["unique_targets"] == 2
    assert summary["unique_pages"] == 2


def test_session_and_segmentation_bug_fixes():
    # Empty Session and Segments default arguments should not share state or crash
    s_empty = Session()
    assert s_empty.get_session_name() == ""

    seg_a = Segments()
    seg_b = Segments()
    assert seg_a.get_segment_list() == []
    assert seg_b.get_segment_list() == []

    # chunk_by_tabId without httpSessionId and group_by_user with sessionId fallback
    logs = {
        "u1": {
            "sessionId": "sess_a",
            "tabId": "tab_1",
            "clientTime": 1700000000000,
            "type": "click",
            "target": None,
        },
        "u2": {
            "sessionId": "sess_a",
            "tabId": "tab_1",
            "clientTime": 1700000001000,
            "type": "click",
            "target": "button#ok",
        },
    }
    tab_chunks = chunk_by_tabId(logs)
    assert any("tab_1" in key for key in tab_chunks)

    user_groups = group_by_user(logs)
    assert "sess_a" in user_groups

    sessions = Sessions(logs=logs)
    assert len(sessions.get_session_names()) >= 1

    # generate_segments should safely skip None field values without TypeError
    segs = generate_segments(logs, "target", ["button"], 0, 1)
    assert len(segs) == 1


def test_graph_immutability_empty_funnel_and_transition_matrix():
    nodes = ["a", "b", "c"]
    edges = [("a", "b"), ("a", "b"), ("b", "c")]
    original_edges = list(edges)
    createDiGraph(nodes, edges, node_labels={"a": "A"})
    # Caller's edges list must not be mutated
    assert edges == original_edges

    # funnel with empty targets or unreached target should return a Figure rather than crash
    fig_empty = funnel([("a", "b")], [])
    assert fig_empty is not None
    fig_unreached = funnel([("a", "b")], ["c"])
    assert fig_unreached is not None

    # transition_matrix probabilities
    logs = [
        {"clientTime": 1000, "target": "input#email", "type": "click"},
        {"clientTime": 2000, "target": "input#email", "type": "input"},
        {"clientTime": 3000, "target": "button#login", "type": "click"},
        {"clientTime": 4000, "target": "div#dashboard", "type": "click"},
    ]
    prob_matrix = distill.transition_matrix(
        logs, drop_recursions=True, as_dataframe=False
    )
    assert prob_matrix["input#email"]["button#login"] == 1.0
    assert prob_matrix["button#login"]["div#dashboard"] == 1.0

    df_matrix = distill.transition_matrix(
        logs, drop_recursions=False, as_dataframe=True
    )
    assert df_matrix.loc["input#email", "input#email"] == 0.5
    assert df_matrix.loc["input#email", "button#login"] == 0.5



def test_frustration_analytics():
    logs = [
        # 3 rapid clicks on the same non-interactive div within 400ms (rage click + dead clicks)
        {
            "clientTime": 1000,
            "type": "click",
            "logType": "raw",
            "target": "div.broken-card",
            "path": ["div.broken-card", "body", "html"],
            "pageUrl": "https://example.com/shop",
            "location": {"x": 120, "y": 240},
        },
        {
            "clientTime": 1150,
            "type": "click",
            "logType": "raw",
            "target": "div.broken-card",
            "path": ["div.broken-card", "body", "html"],
            "pageUrl": "https://example.com/shop",
            "location": {"x": 122, "y": 241},
        },
        {
            "clientTime": 1300,
            "type": "click",
            "logType": "raw",
            "target": "div.broken-card",
            "path": ["div.broken-card", "body", "html"],
            "pageUrl": "https://example.com/shop",
            "location": {"x": 119, "y": 239},
        },
        # A click on a button followed by a DOM mutation (NOT a dead click)
        {
            "clientTime": 5000,
            "type": "click",
            "logType": "raw",
            "target": "button#add-to-cart",
            "path": ["button#add-to-cart", "body", "html"],
            "pageUrl": "https://example.com/shop",
            "location": {"x": 300, "y": 400},
        },
        # High-rate DOM mutations (DOM thrash burst)
        {
            "clientTime": 5100,
            "type": "mutation",
            "logType": "mutation",
            "target": "div#cart-drawer",
            "pageUrl": "https://example.com/shop",
            "details": {"addedCount": 20, "removedCount": 15, "attributeCount": 5},
        },
    ]

    rage = distill.detect_rage_clicks(logs, threshold=3, window_ms=1000)
    assert len(rage) == 1
    assert rage[0]["target"] == "div.broken-card"
    assert rage[0]["clickCount"] == 3

    dead = distill.detect_dead_clicks(logs, response_window_ms=1000)
    assert len(dead) == 3
    assert all(d["target"] == "div.broken-card" for d in dead)

    thrash = distill.detect_dom_thrash(logs, churn_threshold=20)
    assert thrash["burstCount"] == 1
    assert thrash["totalAdded"] == 20
    assert thrash["totalRemoved"] == 15
    assert thrash["totalAttributes"] == 5
    assert thrash["totalChurn"] == 40

    score = distill.frustration_score(logs)
    assert score["frustrationScore"] > 0.0
    assert score["rageClickCount"] == 1
    assert score["deadClickCount"] == 3
    assert score["domThrashBurstCount"] == 1


def test_spatial_analytics():
    logs = [
        {
            "clientTime": 1000,
            "type": "click",
            "logType": "raw",
            "target": "button#cta",
            "pageUrl": "https://example.com/landing",
            "location": {"x": 500, "y": 250},
            "scrnRes": {"width": 1000, "height": 500},
            "targetRect": {"x": 450, "y": 225, "width": 100, "height": 50},
        },
        {
            "clientTime": 2000,
            "type": "scroll",
            "logType": "raw",
            "target": "#document",
            "pageUrl": "https://example.com/landing",
            "details": {"x": 0, "y": 500},
            "scrnRes": {"width": 1000, "height": 500},
        },
    ]

    points = distill.click_heatmap_data(logs, normalize_viewport=True)
    assert len(points) == 1
    assert abs(points[0]["normX"] - 0.5) < 1e-6
    assert abs(points[0]["normY"] - 0.5) < 1e-6
    assert abs(points[0]["relX"] - 0.5) < 1e-6
    assert abs(points[0]["relY"] - 0.5) < 1e-6
    assert points[0]["targetRect"]["width"] == 100

    fig = distill.plot_click_heatmap(logs, normalize_viewport=True)
    assert fig is not None

    scroll = distill.scroll_depth_summary(logs)
    assert "https://example.com/landing" in scroll
    assert scroll["https://example.com/landing"]["maxScrollY"] == 500.0
    assert scroll["https://example.com/landing"]["scrollEventCount"] == 1
    assert scroll["https://example.com/landing"]["maxViewportMultiple"] == 2.0


def test_otel_trace_correlation_and_replay_extraction():
    logs = [
        {
            "clientTime": 1000,
            "type": "click",
            "logType": "raw",
            "target": "button#pay",
            "pageUrl": "https://example.com/pay",
            "sessionId": "s_otel",
            "traceId": "4bf92f3577b34da6a3ce929d0e0e4736",
            "spanId": "00f067aa0ba902b7",
        },
        {
            "clientTime": 1250,
            "type": "rage_click",
            "logType": "custom",
            "target": "button#pay",
            "pageUrl": "https://example.com/pay",
            "sessionId": "s_otel",
            "traceId": "4bf92f3577b34da6a3ce929d0e0e4736",
            "spanId": "11f067aa0ba902b8",
        },
        {
            "clientTime": 1260,
            "type": "session_replay",
            "logType": "replay",
            "pageUrl": "https://example.com/pay",
            "sessionId": "s_otel",
            "trigger": "error",
            "frames": [{"type": 2, "timestamp": 1000}],
            "traceId": "4bf92f3577b34da6a3ce929d0e0e4736",
            "spanId": "11f067aa0ba902b8",
        },
    ]

    traces = distill.correlate_by_trace(logs)
    assert "4bf92f3577b34da6a3ce929d0e0e4736" in traces
    trace_entry = traces["4bf92f3577b34da6a3ce929d0e0e4736"]
    assert len(trace_entry["logs"]) == 3
    assert trace_entry["rageClickCount"] == 1
    assert trace_entry["replayCount"] == 1
    assert len(trace_entry["spanIds"]) == 2

    replays = distill.extract_replay_envelopes(logs)
    assert len(replays) == 1
    assert replays[0]["trigger"] == "error"
    assert replays[0]["frameCount"] == 1



def test_userale_schema_target_rect_normalization():
    raw_otlp = {
        "timeUnixNano": "1700000000000000000",
        "attributes": [
            {"key": "flagon.target", "value": {"stringValue": "button#save"}},
            {"key": "flagon.log_type", "value": {"stringValue": "raw"}},
            {"key": "flagon.event_type", "value": {"stringValue": "click"}},
            {
                "key": "flagon.target_rect",
                "value": {
                    "kvlistValue": {
                        "values": [
                            {"key": "x", "value": {"intValue": "10"}},
                            {"key": "y", "value": {"intValue": "20"}},
                            {"key": "width", "value": {"intValue": "80"}},
                            {"key": "height", "value": {"intValue": "32"}},
                        ]
                    }
                },
            },
        ],
        "body": {},
    }
    normalized = normalize_userale_dict(raw_otlp)
    assert normalized["target"] == "button#save"
    assert normalized["targetRect"] == {"x": 10, "y": 20, "width": 80, "height": 32}
    log_model = UserAleRawSchema.model_validate(normalized)
    assert log_model.target == "button#save"


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

import plotly.graph_objects as go

from distill.analytics.frustration import _normalize_logs


def click_heatmap_data(
    logs_input: Union[List[Dict[str, Any]], Dict[str, Any]],
    *,
    normalize_viewport: bool = True,
) -> List[Dict[str, Any]]:
    """
    Extracts spatial click coordinates, viewport-normalized coordinates ([0..1]),
    and target-element-relative click offsets (when `targetRect` is present).
    """
    logs = _normalize_logs(logs_input)
    points: List[Dict[str, Any]] = []

    for log in logs:
        if log.get("type") not in ("click", "dblclick", "rage_click"):
            continue

        loc = log.get("location") if isinstance(log.get("location"), dict) else {}
        x = loc.get("x")
        y = loc.get("y")
        if not isinstance(x, (int, float)) or not isinstance(y, (int, float)):
            continue

        scrn = log.get("scrnRes") if isinstance(log.get("scrnRes"), dict) else {}
        vp_w = scrn.get("width")
        vp_h = scrn.get("height")

        norm_x = (
            round(float(x) / float(vp_w), 4)
            if normalize_viewport and isinstance(vp_w, (int, float)) and vp_w > 0
            else None
        )
        norm_y = (
            round(float(y) / float(vp_h), 4)
            if normalize_viewport and isinstance(vp_h, (int, float)) and vp_h > 0
            else None
        )

        details = log.get("details") if isinstance(log.get("details"), dict) else {}
        rect = log.get("targetRect") or details.get("targetRect")
        rel_x = None
        rel_y = None
        if isinstance(rect, dict):
            rx = rect.get("x")
            ry = rect.get("y")
            rw = rect.get("width")
            rh = rect.get("height")
            if (
                isinstance(rx, (int, float))
                and isinstance(ry, (int, float))
                and isinstance(rw, (int, float))
                and isinstance(rh, (int, float))
                and rw > 0
                and rh > 0
            ):
                rel_x = round((float(x) - float(rx)) / float(rw), 4)
                rel_y = round((float(y) - float(ry)) / float(rh), 4)

        points.append(
            {
                "target": log.get("target") or "#document",
                "pageUrl": log.get("pageUrl", ""),
                "type": log.get("type"),
                "x": float(x),
                "y": float(y),
                "normX": norm_x,
                "normY": norm_y,
                "relX": rel_x,
                "relY": rel_y,
                "targetRect": rect if isinstance(rect, dict) else None,
            }
        )

    return points


def plot_click_heatmap(
    logs_input: Union[List[Dict[str, Any]], Dict[str, Any]],
    *,
    nbinsx: int = 20,
    nbinsy: int = 20,
    normalize_viewport: bool = False,
) -> go.Figure:
    """
    Creates an interactive Plotly 2D Histogram heatmap of click coordinates.
    """
    points = click_heatmap_data(logs_input, normalize_viewport=normalize_viewport)
    xs = [
        p["normX"] if normalize_viewport and p["normX"] is not None else p["x"]
        for p in points
    ]
    ys = [
        p["normY"] if normalize_viewport and p["normY"] is not None else p["y"]
        for p in points
    ]

    fig = go.Figure(
        data=[
            go.Histogram2d(
                x=xs,
                y=ys,
                nbinsx=nbinsx,
                nbinsy=nbinsy,
                colorscale="Hot",
            )
        ]
    )
    fig.update_yaxes(autorange="reversed")
    return fig


def scroll_depth_summary(
    logs_input: Union[List[Dict[str, Any]], Dict[str, Any]]
) -> Dict[str, Dict[str, Any]]:
    """
    Aggregates scroll and wheel telemetry per pageUrl to compute maximum
    vertical/horizontal scroll reach and viewport multiples scrolled.
    """
    logs = _normalize_logs(logs_input)
    by_page: Dict[str, Dict[str, Any]] = {}

    for log in logs:
        if log.get("type") not in ("scroll", "wheel"):
            continue
        page_url = log.get("pageUrl") or "unknown"
        details = log.get("details") if isinstance(log.get("details"), dict) else {}
        sx = details.get("x")
        sy = details.get("y")
        if not isinstance(sx, (int, float)) and not isinstance(sy, (int, float)):
            continue

        scrn = log.get("scrnRes") if isinstance(log.get("scrnRes"), dict) else {}
        vp_h = scrn.get("height")

        entry = by_page.setdefault(
            page_url,
            {
                "maxScrollX": 0.0,
                "maxScrollY": 0.0,
                "scrollEventCount": 0,
                "maxViewportMultiple": 0.0,
            },
        )
        entry["scrollEventCount"] += 1
        if isinstance(sx, (int, float)):
            entry["maxScrollX"] = max(entry["maxScrollX"], abs(float(sx)))
        if isinstance(sy, (int, float)):
            entry["maxScrollY"] = max(entry["maxScrollY"], abs(float(sy)))
            if isinstance(vp_h, (int, float)) and vp_h > 0:
                multiple = round((entry["maxScrollY"] + float(vp_h)) / float(vp_h), 2)
                entry["maxViewportMultiple"] = max(
                    entry["maxViewportMultiple"], multiple
                )

    return by_page

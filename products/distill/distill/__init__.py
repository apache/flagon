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

from distill.analytics.frustration import (
    detect_dead_clicks,
    detect_dom_thrash,
    detect_rage_clicks,
    frustration_score,
)
from distill.analytics.graph.graph import (
    createDiGraph,
    funnel,
    sankey,
    transition_matrix,
)
from distill.analytics.otel import correlate_by_trace, extract_replay_envelopes
from distill.analytics.spatial import (
    click_heatmap_data,
    plot_click_heatmap,
    scroll_depth_summary,
)
from distill.analytics.stat.stats import click_rate, session_summary, setup
from distill.core.feature_definition import FeatureDefinition
from distill.core.log import Log
from distill.process.search import find_meta_values
from distill.process.transform import label_features, pairwiseSeq, pairwiseStag
from distill.schemas.userale import extract_logs, normalize_userale_dict
from distill.segmentation.segment import (
    Segment,
    Segment_Type,
    create_segment,
    detect_deadspace,
    difference,
    export_segments,
    generate_collapsing_window_segments,
    generate_fixed_time_segments,
    generate_segments,
    intersection,
    union,
    write_segment,
)
from distill.segmentation.segmentation_error import SegmentationError
from distill.segmentation.segments import Segments
from distill.sessions.session import Session
from distill.sessions.sessions import Sessions
from distill.utils.crud import epoch_to_datetime, getUUID

__all__ = [
    "Log",
    "FeatureDefinition",
    "label_features",
    "extract_logs",
    "normalize_userale_dict",
    "Segment",
    "Segment_Type",
    "Segments",
    "SegmentationError",
    "Sessions",
    "Session",
    "graph",
    "createDiGraph",
    "sankey",
    "funnel",
    "transition_matrix",
    "setup",
    "click_rate",
    "session_summary",
    "detect_rage_clicks",
    "detect_dead_clicks",
    "detect_dom_thrash",
    "frustration_score",
    "click_heatmap_data",
    "plot_click_heatmap",
    "scroll_depth_summary",
    "correlate_by_trace",
    "extract_replay_envelopes",
    "find_meta_values",
    "pairwiseStag",
    "pairwiseSeq",
    "search",
    "transform",
    "union",
    "intersection",
    "difference",
    "create_segment",
    "write_segment",
    "generate_segments",
    "detect_deadspace",
    "generate_fixed_time_segments",
    "generate_collapsing_window_segments",
    "export_segments",
    "getUUID",
    "epoch_to_datetime",
]

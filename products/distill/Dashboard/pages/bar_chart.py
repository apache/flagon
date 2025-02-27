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

import dash
import pandas as pd
import plotly.express as px
from dash import dcc, html

# Code from:
# https://github.com/plotly/dash-labs/tree/main/docs/demos/multi_page_example1
dash.register_page(__name__)

df = pd.read_csv("example_segments.csv")

fig_bar = px.histogram(
    df,
    x="Segment Type",
    y="Number of Logs",
    color="Segment Type",
    barmode="group",
    histfunc="avg",
    height=400,
)

layout = html.Div(
    [
        html.H5("Bar Chart", className="text-center"),
        dcc.Graph(
            id="indicators-ptf", figure=fig_bar.update_layout(template="plotly_dark")
        ),
    ]
)

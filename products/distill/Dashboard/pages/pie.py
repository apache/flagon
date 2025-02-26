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

# Pie Chart


import dash
import pandas as pd
import plotly.express as px
from dash import dcc, html

dash.register_page(__name__)


df = pd.read_csv("example_segments.csv")

fig_pie = px.pie(df, values="Number of Logs", names="Segment Type")

layout = html.Div(
    [
        html.H5("Pie Chart", className="text-center"),
        dcc.Graph(
            id="pie-top15",
            figure=fig_pie.update_layout(template="plotly_dark"),
            style={"height": 380},
        ),
        html.Hr(),
    ]
)

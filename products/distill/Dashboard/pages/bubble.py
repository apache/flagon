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
import dash_bootstrap_components as dbc
import pandas as pd
import plotly.express as px
from dash import Dash, dcc, html

dash.register_page(__name__)
df = pd.read_csv("example_segments.csv")

fig_bubble = px.scatter(
    df.head(100),
    x="Start Time",
    y="End Time",
    size="Number of Logs",
    color="Segment Type",
    hover_name="Generate Matched Values",
)


app = Dash(__name__, external_stylesheets=[dbc.themes.SPACELAB])


layout = html.Div(
    [
        html.P("bubble Chart"),
        dcc.Tab(
            label="bubble",
            children=[
                dcc.Graph(
                    id="chrt-portfolio-main", figure=fig_bubble, style={"height": 550}
                ),
                html.Hr(),
            ],
        ),
    ]
)

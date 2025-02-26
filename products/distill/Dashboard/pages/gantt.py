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

# Gantt Charts

import dash
import dash_bootstrap_components as dbc
import pandas as pd
import plotly.express as px
from dash import Dash, Input, Output, callback, dcc, html

dash.register_page(__name__)


df = pd.read_csv("example_segments.csv")


# Overlapping segments data
fixed_time = df[df["Segment Type"].str.contains("Segment_Type.FIXED_TIME")]
generate = df[df["Segment Type"].str.contains("Segment_Type.GENERATE")]
deadspace = df[df["Segment Type"].str.contains("Segment_Type.DEADSPACE")]

deadspace = deadspace.head()
generate = generate.head()
fixed_time = fixed_time.head()
All = [fixed_time, generate, deadspace]
result = pd.concat(All)

# Time Between Segments Conversion
df["Start Time"] = pd.to_datetime(df["Start Time"])
df["End Time"] = pd.to_datetime(df["End Time"])
# Duration of segments
lst = []
for i in range(len(df["End Time"])):
    lst.append((df["End Time"][i] - df["Start Time"][i]).total_seconds())

# print(lst)

df["Duration"] = lst

# Time Between Segments in a Gantt Chart
fig_gantt = px.timeline(
    df, x_start="Start Time", x_end="End Time", y="Segment Type", color="Duration"
)
fig_gantt.update_yaxes(autorange="reversed")


fig = px.timeline(
    result,
    x_start="Start Time",
    x_end="End Time",
    y="Segment Type",
    color="Segment Type",
)
fig.update_yaxes(autorange="reversed")
# Layout of Gantt Chart Page
app = Dash(__name__, external_stylesheets=[dbc.themes.SPACELAB])


layout = html.Div(
    [
        html.P("Gantt Chart"),
        dcc.Tab(
            label="Segment Types Overlapping",
            children=[
                dcc.Graph(
                    id="chrt-portfolio-main",
                    figure=fig.update_layout(template="plotly_dark"),
                    style={"height": 550},
                ),
                html.Hr(),
                html.H5("Filtering By Segment Type", className="text-center"),
                dcc.Tab(
                    label="Filtering By Segment Type",
                    children=[
                        dcc.Dropdown(
                            id="Segment_Types",
                            options=[
                                {
                                    "label": "Fixed Times",
                                    "value": "Segment_Type.FIXED_TIME",
                                },
                                {"label": "Generate", "value": "Segment_Type.GENERATE"},
                                {
                                    "label": "Deadspace",
                                    "value": "Segment_Type.DEADSPACE",
                                },
                            ],
                            multi=False,
                            value="Segment_Type.FIXED_TIME",
                        ),
                        html.Div(id="output_container", children=[]),
                        html.Br(),
                        dcc.Graph(id="segment", figure={}),
                    ],
                ),
            ],
        ),
    ]
)


@callback(
    [
        Output(component_id="output_container", component_property="children"),
        Output(component_id="segment", component_property="figure"),
    ],
    [Input(component_id="Segment_Types", component_property="value")],
)
def update_graph(option_segment):
    print(option_segment)
    print(type(option_segment))

    container = "Segment Types is:{}".format(option_segment)
    dff = df.copy()
    dff = dff[dff["Segment Type"] == option_segment]
    # Plotly Express
    fig = px.timeline(
        dff.head(50),
        x_start="Start Time",
        x_end="End Time",
        y="Segment Name",
        color="Number of Logs",
    )
    fig.update_yaxes(autorange="reversed")
    fig.update_layout(template="plotly_dark")
    # fig.show()

    return container, fig

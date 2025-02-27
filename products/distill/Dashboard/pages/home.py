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
from dash import Dash, Input, Output, dcc, html

# from pages import index

df = pd.read_csv("example_segments.csv")
# app = Dash(__name__, external_stylesheets=[dbc.themes.FLATLY])
dash.register_page(__name__)

# Side Bar
SIDEBAR_STYLE = {
    "position": "fixed",
    "top": 0,
    "left": 0,
    "bottom": 0,
    "width": "12rem",
    "padding": "2rem 1rem",
    "background-color": "lightgrey",
    "color": "black",
}
CONTENT_STYLE = {
    "margin-left": "15rem",
    "margin-right": "2rem",
    "padding": "2rem1rem",
    "color": "black",
}


# Overlapping segments data
fixed_time = df[df["Segment Type"].str.contains("Segment_Type.FIXED_TIME")]
generate = df[df["Segment Type"].str.contains("Segment_Type.GENERATE")]
deadspace = df[df["Segment Type"].str.contains("Segment_Type.DEADSPACE")]

deadspace = deadspace.head()
generate = generate.head()
fixed_time = fixed_time.head()
All = [fixed_time, generate, deadspace]
result = pd.concat(All)

"""Overlapping Segments Graph
This visualization displays segments types that overlap over start and end times """

fig = px.timeline(
    result,
    x_start="Start Time",
    x_end="End Time",
    y="Segment Type",
    color="Segment Type",
)
fig.update_yaxes(autorange="reversed")


# Line Graph
df["timeline"] = df["Start Time"] + df["End Time"]
df["timeline"] = pd.to_datetime(df["timeline"]).dt.time
fig_line = px.line(df, x="timeline", y="Number of Logs", title="Segments")
fig_line.update_traces(mode="markers+lines")
fig_line.update_xaxes(rangeslider_visible=True)


fig_line.update_layout(
    title="Number of Logs by Time",
    xaxis_title="Timeline",
    yaxis_title="Number of logs",
    font=dict(size=15),
    template="plotly_dark",
    # "plotly", "plotly_white", "plotly_dark",
    # "ggplot2", "seaborn", "simple_white", "none"
)

# Bubble Chart
fig_bubble = px.scatter(
    df.head(100),
    x="Start Time",
    y="End Time",
    size="Number of Logs",
    color="Segment Type",
    hover_name="Generate Matched Values",
)

# Pie Chart
fig_pie = px.pie(df, values="Number of Logs", names="Segment Type")
# fig_pie.show()

# Bar Chart
fig_bar = px.histogram(
    df,
    x="Segment Type",
    y="Number of Logs",
    color="Segment Type",
    barmode="group",
    histfunc="avg",
    height=400,
)
# Area Chart
fig_area = px.area(
    df, x="Start Time", y="End Time", color="Segment Type", line_group="Number of Logs"
)


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
fig.update_yaxes(autorange="reversed")

# Time Between Segments in a Histogram
fig_hist = px.histogram(
    df,
    x="Segment Type",
    y="Number of Logs",
    color="Duration",
    barmode="group",
    histfunc="avg",
    height=400,
)


child = dbc.Container(
    [
        dbc.Row(
            dbc.Col(html.H1("Segments Plotly Dashboard", className="text-center"))
        ),  # header
        dbc.Row(
            [
                dbc.Col(
                    [
                        html.H5("Overlapping Segments", className="text-center"),
                        dcc.Tab(
                            label="Segment Types Overlapping",
                            children=[
                                dcc.Graph(
                                    id="chrt-portfolio-main",
                                    figure=fig.update_layout(template="plotly_dark"),
                                    style={"height": 550},
                                ),
                                html.Hr(),
                            ],
                        ),
                    ],
                    width={"size": 14, "offset": 0, "order": 1},
                ),
                dbc.Col(
                    [  # second column on second row
                        html.H5("Bar Chart", className="text-center"),
                        dcc.Graph(
                            id="indicators-ptf",
                            figure=fig_bar.update_layout(template="plotly_dark"),
                            style={"height": 550},
                        ),
                        html.Hr(),
                    ],
                    width={"size": 4, "offset": 0, "order": 2},
                ),  # width second column on second row
                dbc.Col(
                    [  # third column on second row
                        html.H5("Pie Chart", className="text-center"),
                        dcc.Graph(
                            id="pie-top15",
                            figure=fig_pie.update_layout(template="plotly_dark"),
                            style={"height": 380},
                        ),
                        html.Hr(),
                    ],
                    width={"size": 5, "offset": 0, "order": 2},
                ),
            ]
        ),
        dbc.Row(
            [  # start of third row
                dbc.Col(
                    [  # first column on third row
                        html.H5("Area Chart of Segment Types", className="text-center"),
                        dcc.Graph(
                            id="chrt-portfolio-secondary",
                            figure=fig_area.update_layout(template="plotly_dark"),
                            style={"height": 380},
                        ),
                    ],
                    width={"size": 5, "offset": 0, "order": 2},
                ),
            ]
        ),
        dbc.Row(
            [  # start of third row
                dbc.Col(
                    [  # first column on third row
                        html.H5("Number of logs by Time", className="text-center"),
                        dcc.Graph(
                            id="chrt-portfolio-secondary",
                            figure=fig_line,
                            style={"height": 380},
                        ),
                    ],
                    width={"size": 14, "offset": 0, "order": 1},
                ),
            ]
        ),
        dbc.Row(
            [  # start of third row
                dbc.Col(
                    [  # first column on third row
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
                                        {
                                            "label": "Generate",
                                            "value": "Segment_Type.GENERATE",
                                        },
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
                    width={"size": 14, "offset": 0, "order": 1},
                ),
            ]
        ),
    ]
)


content = html.Div(id="page-content", children=child, style=CONTENT_STYLE)
app = Dash(__name__, external_stylesheets=[dbc.themes.SPACELAB])

layout = html.Div(
    [
        # dcc.Location(id='url'),
        # sidebar,
        content
    ]
)
# layout = app.layout


@app.callback(
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

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

import base64
import datetime
import io

import dash
import dash_core_components as dcc
import pandas as pd
import plotly.express as px

# mport dash_html_components as html
from dash import dash_table, html
from dash.dependencies import Input, Output, State

dash.register_page(__name__)

external_stylesheets = ["https://codepen.io/chriddyp/pen/bWLwgP.css"]

app = dash.Dash(
    __name__,
    external_stylesheets=external_stylesheets,
    suppress_callback_exceptions=True,
)

# this code section taken from Dash docs:
# https://dash.plotly.com/dash-core-components/upload
layout = html.Div(
    [
        dcc.Upload(
            id="upload-data",
            children=html.Div(
                [
                    "Drag and Drop or Select files",
                ]
            ),
            style={
                "width": "100%",
                "height": "60px",
                "lineHeight": "60px",
                "borderWidth": "1px",
                "border-left": "30px",
                "borderStyle": "dashed",
                "borderRadius": "5px",
                "textAlign": "center",
                "margin": "10px",
            },
            # Allow multiple files to be uploaded
            multiple=True,
        ),
        html.Div(id="output-div"),
        html.Div(id="output-datatable"),
    ]
)


MAX_UPLOAD_BYTES = 50 * 1024 * 1024


# def menu(app):
def parse_contents(contents, filename, date):
    if not isinstance(contents, str) or "," not in contents:
        return html.Div(["Invalid file payload."])

    _, content_string = contents.split(",", 1)
    if len(content_string) > MAX_UPLOAD_BYTES * 4 // 3 + 4:
        return html.Div(["Uploaded file exceeds maximum allowed size."])

    decoded = base64.b64decode(content_string)
    if len(decoded) > MAX_UPLOAD_BYTES:
        return html.Div(["Uploaded file exceeds maximum allowed size."])

    df = None
    lower_name = (filename or "").lower()
    try:
        if lower_name.endswith(".csv"):
            df = pd.read_csv(io.StringIO(decoded.decode("utf-8")))
        elif lower_name.endswith((".xls", ".xlsx")):
            df = pd.read_excel(io.BytesIO(decoded))
        else:
            return html.Div(["Unsupported file type. Please upload CSV or Excel."])
    except Exception:
        return html.Div(["There was an error processing this file."])

    if df is None:
        return html.Div(["There was an error processing this file."])

    modified_display = (
        str(datetime.datetime.fromtimestamp(date)) if date is not None else "Unknown"
    )
    return html.Div(
        [
            html.H5(filename),
            html.H6(modified_display),
            html.P("Inset X axis data"),
            dcc.Dropdown(
                id="xaxis-data", options=[{"label": x, "value": x} for x in df.columns]
            ),
            html.P("Inset Y axis data"),
            dcc.Dropdown(
                id="yaxis-data", options=[{"label": x, "value": x} for x in df.columns]
            ),
            html.Button(id="submit-button", children="Create Graph"),
            html.Hr(),
            dash_table.DataTable(
                data=df.to_dict("records"),
                columns=[{"name": i, "id": i} for i in df.columns],
                page_size=15,
            ),
            dcc.Store(id="stored-data", data=df.to_dict("records")),
            html.Hr(),  # horizontal line
            # For debugging, display the raw contents provided by the web browser
            html.Div("Raw Content"),
            html.Pre(
                contents[0:200] + "...",
                style={"whiteSpace": "pre-wrap", "wordBreak": "break-all"},
            ),
        ]
    )


@app.callback(
    Output("output-datatable", "children"),
    Input("upload-data", "contents"),
    State("upload-data", "filename"),
    State("upload-data", "last_modified"),
)
def update_output(list_of_contents, list_of_names, list_of_dates):
    if list_of_contents is not None:
        children = [
            parse_contents(c, n, d)
            for c, n, d in zip(list_of_contents, list_of_names, list_of_dates)
        ]
        return children


@app.callback(
    Output("output-div", "children"),
    Input("submit-button", "n_clicks"),
    State("stored-data", "data"),
    State("xaxis-data", "value"),
    State("yaxis-data", "value"),
)
def make_graphs(n, data, x_data, y_data):
    if n is None:
        return dash.no_update
    else:
        bar_fig = px.bar(data, x=x_data, y=y_data)
        # print(data)
        return dcc.Graph(figure=bar_fig)

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

# @TODO add header with description of file

# Testing Utilities

import json

import pandas as pd

import distill


def setup(file, date_type):
    with open(file) as json_file:
        raw_data = json.load(json_file)

    data = {}
    for log in raw_data:
        data[distill.getUUID(log)] = log

    # Convert clientTime to specified type
    for uid in data:
        log = data[uid]
        client_time = log["clientTime"]
        if date_type == "integer":
            log["clientTime"] = distill.epoch_to_datetime(client_time)
        elif date_type == "datetime":
            log["clientTime"] = pd.to_datetime(client_time, unit="ms", origin="unix")
        elif date_type == "string":
            log["clientTime"] = str(client_time)

    # Sort
    sorted_data = sorted(data.items(), key=lambda kv: kv[1]["clientTime"])
    sorted_dict = dict(sorted_data)

    return (sorted_data, sorted_dict)


def to_datetime(date):
    return pd.to_datetime(date, unit="ms", origin="unix")

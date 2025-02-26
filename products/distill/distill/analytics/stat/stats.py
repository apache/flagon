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
import re

import pandas as pd

import distill


# Setup the sorted dictionary
def setup(file, date_type, filter_func=None):
    """
    :param file: Location to the json file
    :param date_type: datetime or integer
    :return: A sorted dictionary (based on clientTime)
    """

    with open(file) as text_file:
        text = text_file.read()

    # Filter and parse JSON file
    text = re.sub(r"\n\t,\n", "\n", text)
    data = json.loads(text)
    data = list(filter(lambda x: x and "clientTime" in x, data))
    data = list(filter(filter_func, data)) if filter_func else data

    # Convert clientTime to specified type
    for log in data:
        client_time = log["clientTime"]
        if date_type == "integer":
            log["clientTime"] = distill.epoch_to_datetime(client_time)
        elif date_type == "datetime":
            log["clientTime"] = pd.to_datetime(client_time, unit="ms", origin="unix")

    # Index data on UUID
    data = {distill.getUUID(log): log for log in data}

    # Sort data based off clientTime, return dict
    return dict(sorted(data.items(), key=lambda kv: kv[1]["clientTime"]))


# Session Click-Rate
def click_rate(file):
    """
    :param file: Location to the json file
    :return: Click-rate (clicks/sec), total session time, and total number of clicks.
    """

    def filter_func(log):
        return log and log["logType"] == "raw"

    sorted_dict = setup(file, "datetime")
    times = []
    clicks = 0
    for key, value in sorted_dict.items():
        times.append((value["clientTime"]))
        if value["type"] == "click":
            clicks = clicks + 1

    totalTime = (times[len(times) - 1] - times[0]).total_seconds()
    clickrate = round((clicks / totalTime), 2)
    return (clickrate, totalTime, clicks)

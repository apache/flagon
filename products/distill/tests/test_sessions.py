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

import json
import os

# Util Tests
from distill.sessions.sessions import Sessions
from tests.data_config import DATA_DIR


def test_chunk_to_user_sessions_by_default():
    # Load in file and convert to raw data
    file = os.path.join(DATA_DIR, "sample_data_multiusers.json")
    with open(file) as json_file:
        raw_data = json.load(json_file)

    result = Sessions(logs=raw_data)

    # Get the session names from the parsed session
    session_names = result.get_session_names()
    unique_user_names = set()

    for name in session_names:
        # The first part of the session names represent user identifier
        user_name = name.split("_")[0]
        unique_user_names.add(user_name)

    # Assert that there are two distinct users
    assert len(unique_user_names) == 2


def test_chunk_to_user_sessions_by_tab():
    # Load in file and convert to raw data
    file = os.path.join(DATA_DIR, "sample_data_multiusers.json")
    with open(file) as json_file:
        raw_data = json.load(json_file)

    result_tab = Sessions(raw_data, group_by_type="tab")

    # Get the session names from the parsed session
    session_names = result_tab.get_session_names()
    unique_tab = set()

    for name in session_names:
        # The second part of the session names represent user identifier
        name_parts = name.split("_")
        if name_parts[0] == "9486d2f32a8f9d4ef0dae14430c3b918":
            unique_tab.add(name_parts[1])

    # Assert that there 3 distinct tabs for user: 9486d2f32a8f9d4ef0dae14430c3b918
    assert len(unique_tab) == 3


def test_chunk_to_user_sessions_by_domain():
    # Load in file and convert to raw data
    file = os.path.join(DATA_DIR, "sample_data_multiusers.json")
    with open(file) as json_file:
        raw_data = json.load(json_file)

    # Assert that there is logs with pageURL
    # include www.google.com for user: 06b0db1ab30e8e92819ba3d4091b83bc
    # But none for user: 9486d2f32a8f9d4ef0dae14430c3b918
    result_url = Sessions(raw_data, group_by_type="domain", url_re="*.google.*")

    # Get the session names from the parsed session
    session_names = result_url.get_session_names()
    domain_names_user1 = set()
    domain_names_user2 = set()

    for name in session_names:
        # The second part of the session names represent user identifier
        name_parts = name.split("_")
        if name_parts[0] == "9486d2f32a8f9d4ef0dae14430c3b918":
            domain_names_user1.add(name_parts[1])
        elif name_parts[0] == "06b0db1ab30e8e92819ba3d4091b83bc":
            domain_names_user2.add(name_parts[1])

    assert "domain*.google.*" not in domain_names_user1
    assert "domain*.google.*" in domain_names_user2

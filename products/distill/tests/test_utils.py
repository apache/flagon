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
import distill
from tests.data_config import DATA_DIR


def test_UUID_with_type():
    # Load in file and convert to raw data
    file = os.path.join(DATA_DIR, "sample_data.json")

    with open(file) as json_file:
        raw_data = json.load(json_file)

    data = {}

    # Assert the same log will produce the same UID
    id1 = distill.getUUID(raw_data[0])
    id2 = distill.getUUID(raw_data[0])
    assert id1 == id2

    for log in raw_data:
        data[distill.getUUID(log)] = log

    # Assert UID uniqueness
    assert len(data) == len(raw_data)
    assert len(data) == 19


def test_UUID_without_type():
    # Load in file and convert to raw data
    file = os.path.join(DATA_DIR, "sample_data_without_type.json")

    with open(file) as json_file:
        raw_data = json.load(json_file)

    data = {}

    # Assert the same log will produce the same UID
    id1 = distill.getUUID(raw_data[0])
    id2 = distill.getUUID(raw_data[0])
    assert id1 == id2

    for log in raw_data:
        data[distill.getUUID(log)] = log

    # Assert UID uniqueness
    assert len(data) == len(raw_data)
    assert len(data) == 19

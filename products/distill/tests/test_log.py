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
import os
from datetime import datetime

from pydantic import ValidationError

from distill.core.log import Log
from tests.data_config import DATA_DIR


def test_log_constructor():
    exception_thrown = False
    try:
        _ = Log(data='{"garbage data": "bad"}')
    except ValidationError:
        exception_thrown = True
    assert exception_thrown == True

    data = load_log()
    data_object = json.loads(data)

    test_log = Log(data=data)
    assert test_log is not None

    test_log2 = Log(data=data_object)
    assert test_log2 is not None

    pageUrl = test_log.data.page_url
    assert pageUrl == "https://github.com/apache/flagon/tree/master/docker"

    id = test_log.id
    assert id.get_timestamp() == 1719530111079 // 1000
    assert id.prefix.startswith("log_")

    data = load_interval_log()
    test_interval_log = Log(data=data)
    assert test_interval_log is not None
    id = test_interval_log.id
    assert id.get_timestamp() == 1708447014463 // 1000


def test_log_serialize():
    data = load_log()
    test_log = Log(data=data)

    # correct_str = json.dumps(
    # json.loads(data), separators=(",", ":"), ensure_ascii=False
    # )
    # Hardcoding this for now because creating a polymorphic model does not
    # preserve order in pydantic. Our data is still correct but not in the
    # original order. There doesn't seem to be an easy way to fix this right now
    correct_str = '{"target":"#document","path":["Window"],"pageUrl":"https://github.com/apache/flagon/tree/master/docker","pageTitle":"flagon/docker at master · apache/flagon · GitHub","pageReferrer":"https://gov.teams.microsoft.us/","browser":{"browser":"chrome","version":"116.0.0"},"type":"load","logType":"raw","userAction":true,"userId":"nobody","toolVersion":null,"toolName":"test_app","useraleVersion":"2.3.0","sessionId":"session_1719530074303","httpSessionId":"72798a8ad776417183b1aa14e03c3132","browserSessionId":"06b0db1ab30e8e92819ba3d4091b83bc","clientTime":1719530111079,"microTime":0,"location":{"x":null,"y":null},"scrnRes":{"width":1349,"height":954},"details":{"window":true}}'
    serialized_data = test_log.to_json()
    assert serialized_data == correct_str


def test_log_deserialize():
    data = load_log()
    test_log = Log(data=data)

    correct_object = json.loads(data)
    deserialized_data = test_log.to_dict()
    assert deserialized_data == correct_object


def test_log_normalize_timestamp():
    data = load_log()
    test_log = Log(data=data)

    # note provided UserAle schema has clientTime in milliseconds but need it in
    # seconds to be able to parse
    correct_ms = 1719530111079
    correct_dt = datetime.fromtimestamp(correct_ms / 1000)

    assert test_log.data.client_time == correct_dt
    assert test_log.to_dict()["clientTime"] == correct_ms

def test_log_comparison():
    data = load_log()
    test_log = Log(data=data)

    test_log_equal = Log(data=data)

    data_other = json.loads(load_log())
    data_other["clientTime"] += 10000
    data_other = json.dumps(data_other)
    test_other = Log(data=data_other)

    assert test_log == test_log_equal
    assert test_log < test_other < datetime.now()
    
def load_log() -> str:
    with open(os.path.join(DATA_DIR, "log_test_data.json")) as f:
        data = f.readline()
    return data


def load_interval_log() -> str:
    with open(os.path.join(DATA_DIR, "log_interval_data.json")) as f:
        data = f.readline()
    return data

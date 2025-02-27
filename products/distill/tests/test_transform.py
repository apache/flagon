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

import os

import distill
from tests import testing_utils
from tests.data_config import DATA_DIR
import pytest
import json
from distill.core.feature_definition import FeatureDefinition
from typing import Any, Dict, List, Callable
from distill.process.transform import label_features



def test_pairwiseStag_1():
    test_list = [1, 2, 3, 4]
    result = distill.pairwiseStag(test_list)
    assert result == [(1, 2), (3, 4)]


def test_pairwiseStag_2():
    test_list = [1, 2, 3, 4]
    result = distill.pairwiseStag(test_list, split=True)
    assert result == ((1, 3), (2, 4))


def test_pairwiseSeq_1():
    test_list = [1, 2, 3, 4]
    result = distill.pairwiseSeq(test_list)
    assert result == [(1, 2), (2, 3), (3, 4)]


def test_pairwiseSeq_2():
    test_list = [1, 2, 3, 4]
    result = distill.pairwiseSeq(test_list, split=True)
    assert result == ((1, 2, 3), (2, 3, 4))

def test_label_features():
    file = open(os.path.join(DATA_DIR, "sample_data.json"), "r")
    logs = json.load(file)
    def type_rule(log) -> bool:
        return "type" in log and "scroll" in log["type"]
    result = label_features(logs,[FeatureDefinition(rule=type_rule, label="scroll_type")])
    assert isinstance(result, list)
    assert "labels" in set().union(*result)
    assert 'labels', 'scroll_type' in result[1].items()


def test_feature_definition_does_not_accept_non_string_label():
    with pytest.raises(TypeError):
        file = open(os.path.join(DATA_DIR, "sample_data.json"), "r")
        logs = json.load(file)
        def input_rule(log):
            return "target" in log and "input" in log["target"]
        result = label_features(logs,[FeatureDefinition(rule=input_rule, label=10)])

def test_feature_definition_does_not_accept_non_callable_rules():
    with pytest.raises(TypeError):
        file = open(os.path.join(DATA_DIR, "sample_data.json"), "r")
        logs = json.load(file)
        result = label_features(logs,[FeatureDefinition(rule="input_rule", label="input_target")])
    



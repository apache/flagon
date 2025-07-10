# Licensed to the Apache Software Foundation (ASF) under one
# or more contributor license agreements.  See the NOTICE file
# distributed with this work for additional information
# regarding copyright ownership.  The ASF licenses this file
# to you under the Apache License, Version 2.0 (the
# "License"); you may not use this file except in compliance
# with the License.  You may obtain a copy of the License at
#
#   http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing,
# software distributed under the License is distributed on an
# "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
# KIND, either express or implied.  See the License for the
# specific language governing permissions and limitations
# under the License.

import os

import distill
from tests import testing_utils
from tests.data_config import DATA_DIR
from typing import Any, Dict, List, Callable
import json



class FeatureDefinition:
    # Implement class logic
    def __init__(self, label: str, rule: Callable[[Dict[str, Any]], bool]):
        # Immediately validate the rule, so you can error
         # out/exit early if it's invalid
        if not callable(rule):
            raise TypeError("Rule not callable")
        
        if not isinstance(label, str):
            raise TypeError("Label is not a string")

        self.label = label
        self._rule = rule

    # This is a wrapper method around the private rule attribute we
    # store on self during init.
    #
    # Q: Why make the rule private and
    # wrap the call to it in another method?
    # A: This encapsulation allows us to expose a nicer set of behavior
    # and naming conventions to both the user and ourselves as developers.
    # In `label_features` below, you see that we can then check whether
    # a log `matches` the definition which reads more like plain english
    # and is an important part of writing clean, idiomatic python code.
    def matches(self, log: Dict[str, Any]) -> bool:
        return self._rule(log)


def label_features(
    logs: List[Dict[str, Any]], definitions: List[FeatureDefinition]
) -> List[Dict[str, Any]]:
    # Iterate through all the logs
    for log in logs:
        # Check whether the log matches the definition
        # for each definition supplied in the defintions list
        for definition in definitions:
            # NOTE: This reads much like an English sentence
            # and is self-explanatory. I don't need to read the
            # implementation logic to get a sense of what's happening
            if definition.matches(log):
                # NOTE: Since we're mutating the log itself and interacting
                # with a field that may (does) not already exists, we need
                # to first check if it is present in our log and instantiate
                # it if not.
                if "labels" not in log:
                    log.update({"labels": list()})
                log["labels"].append(definition.label)
    return logs


###########################################################
# Example of how the FeatureDefintion class works
#
# The following if __name__ == "__main__" syntax
# is a way to tell python that if your run this file
# as a script from the command line, then this is the code
# that needs to be executed.
###########################################################
if __name__ == "__main__":
    file = open(os.path.join(DATA_DIR, "sample_data.json"), "r")
    logs = json.load(file)

    # Rule to test out the FeatureDefinition with
    def type_rule(log):
        return "type" in log and "scroll" in log["type"]

    # Definitions to test out the FeatureDefinition with
    type_rule_definition = FeatureDefinition(rule=type_rule, label="scroll_type")
    rule_not_callable_definintion = FeatureDefinition(rule="rule", label="scroll_type")
    string_error_definition = FeatureDefinition(rule=type_rule, label= 10)
    
    # Call label feature function to test the 3 definitions
    label_features(logs=logs, definitions=[type_rule_definition])
    label_features(logs=logs, definitions=[rule_not_callable_definintion])
    label_features(logs=logs, definitions=[string_error_definition])


 




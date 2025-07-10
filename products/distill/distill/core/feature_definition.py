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

from typing import Any, Dict, List, Callable

class FeatureDefinition:

    def __init__(self, label: str, rule: Callable[[Dict[str, Any]], bool]):
        """
        Allows users to specify a rule or set of rules and an 
        associated label and then use this to add labels to  
        logs in Distill
        
        param label: a string we want to add to the log if the rule is met
        param rule: must be a callable function which accepts a UserALE log 
            as an input, and returns a boolean of whether that rule was met or not
        """
        if not callable(rule):
            raise TypeError("Rule not callable")
        
        if not isinstance(label, str):
            raise TypeError("Label is not a string")

        self.label = label
        self._rule = rule

    def matches(self, log: Dict[str, Any]) -> bool:
            """
            A wrapper method around the private rule attribute we
            store on self during init
            """
            return self._rule(log)




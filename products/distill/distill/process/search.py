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


def find_meta_values(key, dict, *, unique: bool = True):
    """
    Uses List Comprehension to list all unique values for the given key in a dict,
    assuming nested dict of dicts with depth = 2, e.g., {k:{k:v, ...}, ...}
    :param key: a dict key to find values for
    :param dict: a nested dictionary of depth 2 (dict of dicts)
    :param unique: (optional, default == True) if False returns all
        values for the given key
    :return: a list object with values for given key
    """
    value_list = [sub[key] for sub in dict.values() if key in sub]
    if unique:
        value_set = set(value_list)
        return list(value_set)
    else:
        return value_list

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

import pandas as pd


def epoch_to_datetime(epoch_string):
    """
    Turns Unix/Epoch DateTime string into a unix-based int
    :param epoch_string: Unix/Epoch DateTime string (e.g., UserALE:clientTime)
    :return: int
    """

    new_datetime = (
        pd.to_datetime(epoch_string, unit="ms", origin="unix")
        - pd.Timestamp("1970-01-01")
    ) // pd.Timedelta("1ms")
    return new_datetime


def getUUID(log):
    """
    Creates a unique id for a userale log.
    :param log: Userale log in the form of a dictionary
    :return: A string representing a unique identifier for the log
    """

    if "type" in log:
        return (
            str(log["sessionID"])
            + str(log["clientTime"])
            + str(log["logType"])
            + str(log["type"])
        )
    else:
        return str(log["sessionID"]) + str(log["clientTime"]) + str(log["logType"])

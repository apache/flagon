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


class Session:
    """
    Distill's sessions package.

    Allows the user to parse UserALE log data to user sessions.
    """

    def __init__(self, session={}):
        """
        Initializes a Session object.  This object contains\
        metadata for the associated Session.

        :param session: a set of key value pair representing a session
        """

        self.session = session
        self.session_name = list(session.keys())[0]
        self.num_logs = len(list(session.values())[0])
        self.logs = list(session.values())[0]

    def __str__(self):
        return json.dumps(self.session)

    def get_session_name(self):
        """
        Gets the name of a given session.

        :return: The session name of the given session.
        """
        return self.session_name

    def get_num_logs(self):
        """
        Gets the number of logs within a given session.

        :return: The number of logs within the given session.
        """
        return self.num_logs

    def get_logs(self):
        """
        Gets the logs within a given session.

        :return: The logs within the given session.
        """
        return self.logs

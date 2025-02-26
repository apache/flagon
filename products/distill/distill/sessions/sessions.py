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

from enum import Enum
from typing import Dict, Optional

from distill.sessions.session import Session
from distill.sessions.utils import (
    chunk_by_domain,
    chunk_by_idle_time,
    chunk_by_tabId,
    flatten_dict,
    group_by_user,
)


class Sessions_Type(Enum):
    TAB = "tab"
    DOMAIN = "domain"
    DEFAULT = "default"


class Sessions:
    """
    A collection of Session objects.
    """

    def __init__(self, logs: Optional[Dict] = None, sessions=[], **kwargs):
        """
        Sessions initialization function.

        :param logs ({}): Optional, Userale logs in the form of dictionary, if provided,
            the logs will be parsed into sessions on initialization
        :param sessions ({}): A dictionary that describe the parsed logs to sessions
        **kwargs, Additional arguments passed to the user session parsing function,
            if logs are provided
        """
        self.sessions = sessions
        self.sessions_type = Sessions_Type.DEFAULT

        # Chunk on initialization
        if logs:
            self.create_from_logs(logs, **kwargs)

    def __iter__(self):
        """
        Allows Sessions to be iterable.
        """
        return iter(self.sessions)

    def __len__(self):
        """
        Allows Sessions to return the number of sessions it contains.
        """
        return len(self.sessions)

    def __str__(self):
        """
        Creates a readable string for Sessions.
        """
        sessions_in_str = "{"
        for session in self.sessions:
            # Remove the bracket
            sessions_in_str += str(session)[1:-1] + ","
        sessions_in_str = sessions_in_str[:-1] + "}"
        # Remove the last "," and add the closing bracket
        return sessions_in_str

    def get_sessions_type(self):
        """
        Gets the type of a groupings/parsing that were used to create the sessions.

        :return: The sessions type.
        """
        return self.sessions_type

    def get_session_list(self):
        """
        Returns a list of Session objects in Sessions.

        :return: A list of session objects.
        """
        return self.sessions

    def get_session_names(self):
        """
        Returns the names session names (key of the session dictionary).

        :return: A list of session names
        """
        session_names = []
        for session in self.sessions:
            session_names.append(session.get_session_name())
        return session_names

    def create_from_logs(
        self, logs, inactive_interval_s=60, group_by_type="None", url_re="."
    ):
        """
        Separate a raw log to sets of user sessions.

        A user session is defined by: unique session ID,
        user ID, and separated by idle time that exceeds
        the specified inactive_interval (in seconds).
        By default, the interval is 60 seconds. This set
        is further separated by the windows tab in which
        the user activities occurred.

        :param logs: Userale logs in the form of dictionary
        :param inactive_interval_s: Threshold of inactivity (no logged activity)
            in seconds
        :param url_re: Regular expression to filter the log
        :param group_by_type: either group by tab, URL, browser (None)
        :return: A dictionary that represent sets of user sessions
        """
        data_by_users = {}
        data_by_users = group_by_user(logs)

        chunk_data_by_users_sessions = {}
        for user in data_by_users:
            user_session_sets = {}
            # Sort the logs associated by each users so we can create sets accordingly
            sorted_data = sorted(
                data_by_users[user],
                key=lambda item: item.get("clientTime", item.get("endTime")),
            )
            chunked_group = {}
            # Separate by browser tab
            if group_by_type == "tab":
                chunked_group = chunk_by_tabId(sorted_data)
                for g_id in chunked_group:
                    # For each set, detect if there is an idle time between the logs
                    # that exceed X seconds
                    user_session_sets[g_id] = chunk_by_idle_time(
                        chunked_group[g_id], inactive_interval_s
                    )
                chunk_data_by_users_sessions[user] = user_session_sets
            # Separate by domain application
            elif group_by_type == "domain":
                # Do something
                chunked_group = chunk_by_domain(sorted_data, url_re)
                for g_id in chunked_group:
                    # For each set, detect if there is an idle time between the logs
                    # that exceed X seconds
                    user_session_sets[g_id] = chunk_by_idle_time(
                        chunked_group[g_id], inactive_interval_s
                    )
                chunk_data_by_users_sessions[user] = user_session_sets
            else:
                # For each set, detect if there is an idle time between the logs
                # that exceed X seconds
                chunk_data_by_users_sessions[user] = chunk_by_idle_time(
                    sorted_data, inactive_interval_s
                )

        # Flatten the structure into a collection of sessions
        flattened_results = flatten_dict(chunk_data_by_users_sessions)
        parsed_sessions = []
        for result in flattened_results:
            parsed_sessions.append(Session({result: flattened_results[result]}))

        # Update the sessions
        self.sessions = parsed_sessions

        # Set the sessions type
        if group_by_type == "tab":
            self.sessions_type = Sessions_Type.TAB
        elif group_by_type == "domain":
            self.sessions_type = Sessions_Type.DOMAIN

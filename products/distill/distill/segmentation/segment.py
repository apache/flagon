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

import copy
import csv
import datetime
from enum import Enum

from distill.segmentation.segments import Segments


class Segment_Type(Enum):
    CREATE = "create"
    GENERATE = "generate"
    DEADSPACE = "deadspace"
    FIXED_TIME = "fixed_time"
    GENERATE_COLLAPSING_WINDOWS = "generate_collapsing_windows"
    UNION = "union"
    INTERSECTION = "intersection"
    DIFFERENCE = "difference"


class Segment:
    """
    Distill's segmentation package. Allows the user to segment User Ale log data.
    """

    def __init__(self, segment_name="", start_end_val=None, num_logs=0, uids=[]):
        """
        Initializes a Segment object.  This object contains\
        metadata for the associated Segment.

        :param segment_name: Name associated with the segment,\
            defaults to an empty string
        :param start_end_val: A list of tuples (i.e [(start_time, end_time)],\
            where start_time and end_time are Date/Time Objects or integers.\
            Defaults to a None value.
        :param num_logs: Number of logs in the segment.  Defaults to 0.
        :param uids: A list of strings representing the associated uids of logs within\
            the segment. Defaults to an empty list.
        """

        self.segment_name = segment_name
        self.start_end_val = start_end_val
        self.num_logs = num_logs
        self.uids = uids
        self.generate_field_name = None
        self.generate_matched_values = None
        self.segment_type = None

    def __str__(self):
        start = self.start_end_val[0]
        end = self.start_end_val[1]
        variables = vars(self)
        final_str = "Segment:"
        for var in variables:
            if var != "uids":
                if var == "start_end_val":
                    final_str += " start" + "=" + str(start) + ","
                    final_str += " end" + "=" + str(end) + ","
                else:
                    final_str += " " + str(var) + "=" + str(variables[var]) + ","
        return final_str[:-1]

    def get_segment_name(self):
        """
        Gets the name of a given segment.

        :return: The segment name of the given segment.
        """
        return self.segment_name

    def get_start_end_val(self):
        """
        Gets the start and end values of a given segment.

        :return: The start and end values of the given segment.
        """
        return self.start_end_val

    def get_num_logs(self):
        """
        Gets the number of logs within a given segment.

        :return: The number of logs within the given segment.
        """
        return self.num_logs

    def get_segment_uids(self):
        """
        Gets the uid list of a given segment.

        :return: The uid list of the given segment.
        """
        return self.uids

    def get_segment_type(self):
        """
        Gets the segment type of a given segment.

        :return: The segment type of the given segment.
        """
        return self.segment_type

    def get_generate_field_name(self):
        """
        Gets the field name used to create a segment with generate_segment.

        :return: The field name used to create a segment with generate_segment.
        """
        return self.generate_field_name

    def get_generate_matched_values(self):
        """
        Gets the values used to create a segment with generate_segment.

        :return: The values used to create a segment with generate_segment.
        """
        return self.generate_matched_values


#######################
# SET LOGIC FUNCTIONS #
#######################


def union(segment_name, segment1, segment2):
    """
    Creates a new segment based on the union of given segments' uids.

    :param segment_name: Name associated with the new segment
    :param segment1: First segment involved in union.
    :param segment2: Second segment involved in union.

    :return: A new segment with the given segment_name, start and end values
        based on the smallest client time and
    largest client time of the given segments, and a list of the union of the
        uids of segment1 and segment2.
    """

    if not isinstance(
        segment1.start_end_val[0], type(segment2.start_end_val[0])
    ) or not isinstance(segment1.start_end_val[1], type(segment2.start_end_val[1])):
        raise TypeError(
            "Segment start and end values must be of the same type between segments."
        )

    # Union uids
    uids = copy.deepcopy(segment1.uids)
    for uid in segment2.uids:
        if uid not in uids:
            uids.append(uid)

    # Get earliest starting val and latest end val
    start_time = segment1.start_end_val[0]
    end_time = segment1.start_end_val[1]
    if segment1.start_end_val[0] > segment2.start_end_val[0]:
        start_time = segment2.start_end_val[0]
    if segment1.start_end_val[1] < segment2.start_end_val[1]:
        end_time = segment2.start_end_val[1]

    # Create segment to return
    segment = Segment(segment_name, (start_time, end_time), len(uids), uids)
    segment.segment_type = Segment_Type.UNION
    segment.generate_field_name = None
    segment.generate_matched_values = None
    return segment


def intersection(segment_name, segment1, segment2):
    """
    Creates a new segment based on the intersection of given segments' uids.

    :param segment_name: Name associated with the new segment
    :param segment1: First segment involved in intersection.
    :param segment2: Second segment involved in intersection.

    :return: A new segment with the given segment_name, start and end values
        based on the smallest client time and
    largest client time of the given segments, and a list of the intersection
        of the uids of segment1 and segment2.
    """

    if not isinstance(
        segment1.start_end_val[0], type(segment2.start_end_val[0])
    ) or not isinstance(segment1.start_end_val[1], type(segment2.start_end_val[1])):
        raise TypeError(
            "Segment start and end values must be of the same type between segments."
        )

    # intersections uids
    uids = []
    for uid in segment2.uids:
        if uid in segment1.uids:
            uids.append(uid)

    # Get the earliest start and latest end value
    start_time = segment1.start_end_val[0]
    end_time = segment1.start_end_val[1]
    if segment1.start_end_val[0] > segment2.start_end_val[0]:
        start_time = segment2.start_end_val[0]
    if segment1.start_end_val[1] < segment2.start_end_val[1]:
        end_time = segment2.start_end_val[1]

    segment = Segment(segment_name, (start_time, end_time), len(uids), uids)
    segment.segment_type = Segment_Type.INTERSECTION
    segment.generate_field_name = None
    segment.generate_matched_values = None
    return segment


def difference(segment_name, segment1, segment2):
    """
    Creates a new segment based on the logical difference of segment2 from segment1.

    :param segment_name: Name associated with the new segment
    :param segment1: Segment from which to subtract segment2's matched UIDs.
    :param segment2: Segment whose matched UIDs are to be subtracted from segment1.

    :return: A new segment with the given segment_name, start and end values based on
        segment1, and a list of the difference of the uids of segment1 and segment2.
    """

    # Find matching UIDs
    matched_uids = []
    for uid in segment2.uids:
        if uid in segment1.uids:
            matched_uids.append(uid)

    # Subtract matched UIDs from segment1
    uids = copy.deepcopy(segment1.uids)
    for uid in matched_uids:
        uids.remove(uid)

    # Return new segment
    segment = Segment(segment_name, segment1.start_end_val, len(uids), uids)
    segment.segment_type = Segment_Type.DIFFERENCE
    segment.generate_field_name = None
    segment.generate_matched_values = None
    return segment


####################
# SEGMENT CREATION #
####################


def create_segment(target_dict, segment_names, start_end_vals):
    """
    Creates a dictionary of Segment objects representing the metadata
    associated with each defined segment.

    :param target_dict: A dictionary of User Ale logs assumed to be ordered by \
        clientTime (Date/Time Objects or integers)
    :param segment_names: A list of segment_names ordered in the same way as the \
        start_end_vals
    :param start_end_vals: A list of tuples (i.e [(start_time, end_time)], where \
        start_time and end_time are Date/Time Objects or integers

    :return: A Segments object containing newly created Segment objects.
    """

    segments = []
    for i in range(len(segment_names)):
        num_logs = 0
        segment_name = segment_names[i]
        start_time = start_end_vals[i][0]
        end_time = start_end_vals[i][1]
        uids = []
        for uid in target_dict:
            log = target_dict[uid]
            if (
                isinstance(log["clientTime"], int)
                and isinstance(start_time, int)
                and isinstance(end_time, int)
            ) or (
                isinstance(log["clientTime"], datetime.datetime)
                and isinstance(start_time, datetime.datetime)
                and isinstance(end_time, datetime.datetime)
            ):
                if log["clientTime"] >= start_time and log["clientTime"] <= end_time:
                    # Perform data collection on log
                    num_logs += 1
                    uids.append(uid)
            else:
                raise TypeError(
                    "clientTime and start/end times must be represented as the same"
                    " type and must either be a datetime object or integer."
                )
        segment = Segment(segment_name, start_end_vals[i], num_logs, uids)
        segment.segment_type = Segment_Type.CREATE
        segment.generate_field_name = None
        segment.generate_matched_values = None
        segments.append(segment)
    return Segments(segments)


def write_segment(target_dict, segment_names, start_end_vals):
    """
    Creates a nested dictionary of segment names to UIDs which then map to individual
    logs (i.e result['segment_name'][uid] --> log).  This assists with easy
    iteration over defined segments.

    :param target_dict: A dictionary of User Ale logs assumed to be ordered
        by clientTime (Date/Time Objects or integers).
    :param segment_names: A list of segment_names ordered in the same way
        as the start_end_vals.
    :param start_end_vals: A list of tuples (i.e [(start_time, end_time)]),
        where start_time and end_time are Date/Time Objects or integers.

    :return: A nested dictionary of segment_names to uids to individual logs.
    """
    result = {}
    create_result = create_segment(target_dict, segment_names, start_end_vals)

    # Iterate through segments to get logs
    for segment in create_result:
        result[segment.get_segment_name()] = {}
        for uid in segment.uids:
            result[segment.get_segment_name()][uid] = target_dict[uid]

    return result


def generate_segments(
    target_dict, field_name, field_values, start_time_limit, end_time_limit, label=""
):
    """
    Generates a list of Segment objects corresponding to windows of time defined by \
        the given time limits, field name, and associated values meant to match the \
            field name indicated.

    :param target_dict: A dictionary of User Ale logs assumed to be ordered by \
        clientTime (Date/Time Objects or integers).
    :param field_name: A string indicating the field name meant to be matched by\
        the field values.
    :param field_values: A list of field values to be matched in order to start a\
        segment.
    :param start_time_limit: Amount of time (in seconds) prior to a detected event\
        that should be included in the generated segment.
    :param end_time_limit: Amount of time (in seconds) to keep the segment window\
        open after a detected event.
    :param label: An optional string argument that provides a prefix for the returned\
        dictionary keys.

    :return: A Segments object containing newly created Segment objects.
    """

    # Iterate through the target dictionary using key list
    start_end_vals = []
    segment_names = []
    prev_end_time = None
    keys = list(target_dict.keys())
    index = 0
    for i in range(len(keys)):
        if field_name in target_dict[keys[i]]:
            # Matches value in field_values list with dict values (str or list)
            if any(item in target_dict[keys[i]][field_name] for item in field_values):
                # Matches values - Create segment
                orig_start_time = target_dict[keys[i]]["clientTime"]
                if isinstance(orig_start_time, int):
                    start_time = orig_start_time - (start_time_limit * 1000)
                    end_time = orig_start_time + (end_time_limit * 1000)
                elif isinstance(orig_start_time, datetime.datetime):
                    start_time = orig_start_time - datetime.timedelta(
                        seconds=start_time_limit
                    )
                    end_time = orig_start_time + datetime.timedelta(
                        seconds=end_time_limit
                    )
                else:
                    raise TypeError(
                        "clientTime field is not represented as an integer or datetime"
                        " object"
                    )
                if prev_end_time is None or orig_start_time > prev_end_time:
                    if prev_end_time is not None and start_time < prev_end_time:
                        start_time = prev_end_time
                    start_end_tuple = (start_time, end_time)
                    start_end_vals.append(start_end_tuple)
                    segment_names.append(label + str(index))
                    prev_end_time = end_time
                    index += 1

    # Create segment dictionary with create_segment
    segments = create_segment(target_dict, segment_names, start_end_vals)
    for segment in segments:
        segment.segment_type = Segment_Type.GENERATE
        segment.generate_field_name = field_name
        segment.generate_matched_values = field_values

    return segments


def detect_deadspace(
    target_dict, deadspace_limit, start_time_limit, end_time_limit, label=""
):
    """
    Detects deadspace in a dictionary of User Ale logs.  Detected instances of \
        deadspace are captured in Segment
    objects based on the start and end time limits indicated by the function\
        parameters.

    :param target_dict: A dictionary of User Ale logs assumed to be ordered by\
        clientTime (Date/Time Objects or integers).
    :param deadspace_limit: An integer representing the amount of time (in seconds)\
        considered to be 'deadspace'.
    :param start_time_limit: Amount of time (in seconds) prior to a detected deadspace\
        event that should be included in the deadspace segment.
    :param end_time_limit: Amount of time (in seconds) to keep the segment window open\
        after a detected deadspace event.
    :param label: An optional string argument that provides a prefix for the returned\
        dictionary keys.

    :return: A Segments object containing newly created Segment objects.
    """

    # Iterate through the target dictionary using key list
    start_end_vals = []
    segment_names = []
    key_list = list(target_dict.keys())
    index = 0
    for i in range(len(key_list)):
        # Check for deadspace
        if i < len(key_list) - 1:
            curr_time = target_dict[key_list[i]]["clientTime"]
            next_time = target_dict[key_list[i + 1]]["clientTime"]
            if isinstance(curr_time, int) and isinstance(next_time, int):
                time_delta = next_time - curr_time
                if time_delta > deadspace_limit * 1000:
                    # Deadspace detected
                    start_time = curr_time - (start_time_limit * 1000)
                    end_time = next_time + (end_time_limit * 1000)
                    start_end_tuple = (start_time, end_time)
                    start_end_vals.append(start_end_tuple)
                    segment_names.append(label + str(index))
                    index += 1
            elif isinstance(curr_time, datetime.datetime) and isinstance(
                next_time, datetime.datetime
            ):
                time_delta = next_time - curr_time
                if time_delta > datetime.timedelta(seconds=deadspace_limit):
                    # Deadspace detected
                    start_time = curr_time - datetime.timedelta(
                        seconds=start_time_limit
                    )
                    end_time = next_time + datetime.timedelta(seconds=end_time_limit)
                    start_end_tuple = (start_time, end_time)
                    start_end_vals.append(start_end_tuple)
                    segment_names.append(label + str(index))
                    index += 1
            else:
                raise TypeError(
                    "clientTime field is not consistently represented as an integer or"
                    " datetime object"
                )

    # Create segment dictionary with create_segment
    segments = create_segment(target_dict, segment_names, start_end_vals)
    for segment in segments:
        segment.segment_type = Segment_Type.DEADSPACE
        segment.generate_field_name = None
        segment.generate_matched_values = None

    return segments


def generate_fixed_time_segments(target_dict, time, trim=False, label=""):
    """
    Generates segments based on fixed time intervals.

    :param target_dict: A dictionary of User Ale logs assumed to be ordered by\
        clientTime (Date/Time Objects or integers).
    :param time: The fixed time from which the Segment start and end times are\
        based (seconds).
    :param trim: An optional boolean indicating whether the logs that don't fit\
        into the fixed windows should be trimmed.
    :param label: An optional string argument that provides a prefix for the\
        returned dictionary keys.

    :return: A Segments object containing newly created Segment objects.
    """
    key_list = list(target_dict.keys())

    # Get overall start and end time
    start = target_dict[key_list[0]]["clientTime"]
    end = target_dict[key_list[len(key_list) - 1]]["clientTime"]

    start_end_vals = []
    segment_names = []
    index = 0

    if isinstance(start, int) and isinstance(end, int):
        if trim:
            # Create equal segments
            while start + (time * 1000) <= end:
                # Create a new start/end tuple
                start_end = (start, start + (time * 1000))
                start_end_vals.append(start_end)
                segment_names.append(label + str(index))
                start += time * 1000
                index += 1
        else:
            # Include all logs
            while start < end:
                # Create a new start/end tuple
                start_end = (start, start + (time * 1000))
                start_end_vals.append(start_end)
                segment_names.append(label + str(index))
                start += time * 1000
                index += 1
    elif isinstance(start, datetime.datetime) and isinstance(end, datetime.datetime):
        if trim:
            # Create equal segments
            while start + datetime.timedelta(seconds=time) <= end:
                # Create a new start/end tuple
                start_end = (start, start + datetime.timedelta(seconds=time))
                start_end_vals.append(start_end)
                segment_names.append(label + str(index))
                start += datetime.timedelta(seconds=time)
                index += 1
        else:
            # Include all logs
            while start < end:
                # Create a new start/end tuple
                start_end = (start, start + datetime.timedelta(seconds=time))
                start_end_vals.append(start_end)
                segment_names.append(label + str(index))
                start += datetime.timedelta(seconds=time)
                index += 1
    else:
        raise TypeError(
            "clientTime must be represented as either an integer or datetime object."
        )

    # Create segment dictionary with create_segment
    segments = create_segment(target_dict, segment_names, start_end_vals)
    for segment in segments:
        segment.segment_type = Segment_Type.FIXED_TIME
        segment.generate_field_name = None
        segment.generate_matched_values = None

    return segments


def generate_collapsing_window_segments(
    target_dict, field_name, field_values_of_interest, label=""
):
    """
    Generates segments based on a window to time in which the given \
        field name has a value matching one of the values indicated by \
        the field_values_of_interest list.

    :param target_dict: A dictionary of User Ale logs assumed to be ordered\
        by clientTime (Date/Time Objects or integers).
    :param field_name: A string indicating the field name meant to be\
        matched by the field values.
    :param field_values_of_interest: A list of field values to be matched\
        in order to start/end a segment.
    :param label: An optional string argument that provides a prefix for\
        the returned dictionary keys.
    """
    key_list = list(target_dict.keys())

    start_end_val_lists = []
    start_end_vals = []
    segment_names = []
    index = 0
    segment_started = False

    for i in range(len(key_list)):
        field_values = target_dict[key_list[i]].get(field_name)
        if not isinstance(field_values, (list, tuple, set)):
            field_values = [field_values]
        if (
            field_name in target_dict[key_list[i]]
            and len(set(field_values_of_interest) & set(field_values)) > 0
        ):
            if not segment_started:
                # Start a new Segment
                start_end = [target_dict[key_list[i]]["clientTime"], None]
                start_end_val_lists.append(start_end)
                segment_names.append(label + str(index))
                segment_started = True

            # End Segment if end of dictionary
            elif segment_started and i == (len(key_list) - 1):
                # End the Segment
                start_end_tuple = (
                    start_end_val_lists[index][0],
                    target_dict[key_list[i]]["clientTime"],
                )
                start_end_vals.append(start_end_tuple)
                index += 1
                segment_started = False
        else:
            if segment_started:
                # End the Segment
                start_end_tuple = (
                    start_end_val_lists[index][0],
                    target_dict[key_list[i - 1]]["clientTime"],
                )
                start_end_vals.append(start_end_tuple)
                index += 1
                segment_started = False

    if 0 < len(start_end_vals) < len(segment_names):
        start_end_vals.append(
            (
                start_end_val_lists[index][0],
                target_dict[key_list[len(key_list) - 1]]["clientTime"],
            )
        )

    # Create Segments object with create_segment
    segments = create_segment(target_dict, segment_names, start_end_vals)
    for segment in segments:
        segment.segment_type = Segment_Type.GENERATE_COLLAPSING_WINDOWS
        segment.generate_field_name = field_name
        segment.generate_matched_values = field_values_of_interest

    return segments


######################
# EXPORTING SEGMENTS #
######################


def export_segments(path, segments):
    """
    Writes segment metadata into a csv file.  Csv will be saved at the indicated path.

    :param path: Represents the path of the new file.
    :param segments: A Segments object containing Segment objects.
    """

    with open(path, "w", newline="") as file:
        writer = csv.writer(file)

        # Populate the csv row by row
        # TODO: Make sure this is the right format
        header_row = [
            "Segment Name",
            "Start Time",
            "End Time",
            "Number of Logs",
            "Generate Field Name",
            "Generate Matched Values",
            "Segment Type",
        ]
        writer.writerow(header_row)
        for segment in segments:
            row = [
                segment.segment_name,
                str(segment.start_end_val[0]),
                str(segment.start_end_val[1]),
                segment.num_logs,
                segment.generate_field_name,
                segment.generate_matched_values,
                segment.segment_type,
            ]
            writer.writerow(row)

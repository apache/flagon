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

import datetime

import distill
from distill.segmentation.segmentation_error import SegmentationError


class Segments:
    """
    A list of Segment objects.
    """

    ##############################################
    # IMPLEMENTATION OF PYTHON DEFINED FUNCTIONS #
    ##############################################

    def __init__(self, segments=[]):
        """
        Segments initialization function.

        :param segments ([]): An optional List of Segment objects to be included\
            in the Segments abstraction.
        """
        self.segments = segments

    def __iter__(self):
        """
        Allows Segments to be iterable.
        """
        return iter(self.segments)

    def __len__(self):
        """
        Allows Segments to return a length.
        """
        return len(self.segments)

    def __getitem__(self, item):
        """
        Allows Segments to be subscriptable by segment name or numeric index.
        """
        if isinstance(item, str):
            segment_names = [segment.get_segment_name() for segment in self.segments]
            if item in segment_names:
                index = segment_names.index(item)
                return self.segments[index]
        else:
            return self.segments[item]

    def __setitem__(self, key, value):
        """
        Allows subscripts to be used to set items.
        """
        if not isinstance(value, distill.Segment):
            raise TypeError("Segments objects can only hold Segment objects.")

        if isinstance(key, str):
            if not value.segment_name == key:
                raise SegmentationError(
                    "Segment name in subscript must match the segment name of the"
                    " Segment object."
                )

            segment_names = [segment.get_segment_name() for segment in self.segments]
            if key in segment_names:
                index = segment_names.index(key)
                self.segments[index] = value
            else:
                self.segments.append(value)
        elif isinstance(key, int):
            if key < len(self.segments):
                self.segments[key] = value
            else:
                raise SegmentationError(
                    "Index provided goes beyond the length of the underlying list of"
                    " Segment objects."
                )

    def __str__(self):
        """
        Creates a readable string for Segments.
        """
        result = "Segments: [\n"
        for segment in self.segments:
            result += str(segment) + "\n"
        result += "]"
        return result

    ############################
    # DATA STRUCTURE FUNCTIONS #
    ############################

    def get_segment_list(self):
        """
        Returns a list of Segment objects in Segments.

        :return: A list of segment objects.
        """
        return self.segments

    def get_segment_name_dict(self):
        """
        Returns a dictionary of segment_name to Segment objects based on the\
            key parameter.  Note that segment names must be unique.
        """
        result = {}
        for segment in self.segments:
            if segment.get_segment_name() in result:
                raise SegmentationError("Segment names must be unique")
            else:
                result[segment.get_segment_name()] = segment
        return result

    ######################
    # SEGMENTS FILTERING #
    ######################

    def get_num_logs(self, num_logs):
        """
        Returns a new Segments object only including segments with the \
            specified number of logs.
        :param num_logs: The minimum number of logs (inclusive) necessary \
            to be included in the new Segments object.
        :return: A new Segments object that contains Segment objects with \
            at least the specified number of logs.
        """
        segments = [
            segment for segment in self.segments if segment.num_logs >= num_logs
        ]
        return Segments(segments)

    def get_segments_before(self, time):
        """
        Returns a new Segments object only including segments that have end times\
            before the indicated time.

        :param time: An integer or datetime object that represents the time for\
            which Segment end times should be before.
        :return: A new Segments object that contains Segment objects that have\
            end times prior to the time indicated.
        """
        if not isinstance(time, int) and not isinstance(time, datetime.datetime):
            raise TypeError("Time must be an integer or datetime object.")

        segments = [
            segment for segment in self.segments if segment.start_end_val[1] < time
        ]
        return Segments(segments)

    def get_segments_after(self, time):
        """
        Returns a new Segments object only including segments that have start times\
            after the indicated time.

        :param time: An integer or datetime object that represents the time for which\
            Segment start times should be after.
        :return: A new Segments object that contains Segment objects that have start\
            times after the time indicated.
        """
        if not isinstance(time, int) and not isinstance(time, datetime.datetime):
            raise TypeError("Time must be an integer or datetime object.")

        segments = [
            segment for segment in self.segments if segment.start_end_val[0] > time
        ]

        return Segments(segments)

    def get_segments_of_type(self, segment_type):
        """
        Returns a new Segments object that includes Segment objects of a specified\
            type.

        :param segment_type: The type of Segment objects that should be included.
        :return: A new Segments object that contains Segment objects of the specified\
            type.
        """
        if not isinstance(segment_type, distill.Segment_Type):
            raise TypeError(
                "Given segment_type: "
                + str(segment_type)
                + " is not a valid segment type."
            )

        segments = [
            segment for segment in self.segments if segment.segment_type == segment_type
        ]
        return Segments(segments)

    #################################
    # SEGMENT ADDITION AND DELETION #
    #################################
    def append(self, item):
        """
        Adds a Segment object to the Segments object.
        :param item: The Segment object to add.
        """
        if not isinstance(item, distill.Segment):
            raise TypeError("Only Segment objects can be added to a Segments object.")

        self.segments.append(item)

    def append_segments(self, segments):
        """
        Adds all Segment objects in the given Segments object to the current\
            Segments object.
        :param segments: A Segments object to append to the calling Segments object.
        """
        if not isinstance(segments, distill.Segments):
            raise TypeError(
                "Only Segments objects can be appended with append_segments."
            )

        self.segments.extend(segments.segments)

    def delete(self, segment_name):
        """
        Deletes the Segment object with the given segment_name.
        :param segment_name: The name of the Segment to delete.
        """
        segment_names = [segment.get_segment_name() for segment in self.segments]
        if segment_name in segment_names:
            index = segment_names.index(segment_name)
            segment = self.segments[index]
            self.segments.remove(segment)
        else:
            raise SegmentationError(
                "No Segment objects with given segment name: " + segment_name
            )

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

# @TODO add header with description of file

import datetime
import os

import pandas as pd

# Segment Testing
import pytest

import distill
from tests import testing_utils
from tests.data_config import DATA_DIR

########################
# SEGMENT OBJECT TESTS #
########################


def test_segment_constructor():
    segment = distill.Segment()
    assert segment.get_segment_name() == ""
    assert segment.get_num_logs() == 0
    assert segment.get_start_end_val() is None
    assert segment.get_segment_uids() == []


def test_segment_string():
    segment = distill.Segment()
    segment.segment_name = "segment_name"
    segment.start_end_val = (1, 2)
    segment.segment_type = distill.Segment_Type.CREATE

    assert (
        str(segment)
        == "Segment: segment_name=segment_name, start=1, end=2, num_logs=0,"
        " generate_field_name=None, generate_matched_values=None,"
        " segment_type=Segment_Type.CREATE"
    )

    segment.test = "test_attribute"
    assert (
        str(segment)
        == "Segment: segment_name=segment_name, start=1, end=2, num_logs=0,"
        " generate_field_name=None, generate_matched_values=None,"
        " segment_type=Segment_Type.CREATE, test=test_attribute"
    )


def test_getters():
    data = testing_utils.setup(os.path.join(DATA_DIR, "sample_data.json"), "integer")
    sorted_data = data[0]
    sorted_dict = data[1]

    # Create Test Segment
    start_end_vals = []
    start_end_vals.append(
        (sorted_data[0][1]["clientTime"], sorted_data[1][1]["clientTime"])
    )
    segment_names = ["test_segment_1"]
    result = distill.create_segment(sorted_dict, segment_names, start_end_vals)
    seg = result.get_segment_list()[0]

    assert seg.get_segment_name() == "test_segment_1"
    assert seg.get_start_end_val() == (
        sorted_data[0][1]["clientTime"],
        sorted_data[1][1]["clientTime"],
    )
    assert seg.get_num_logs() == 2
    assert seg.get_segment_uids() == [sorted_data[0][0], sorted_data[1][0]]
    assert seg.get_segment_type() == distill.Segment_Type.CREATE
    assert seg.get_generate_field_name() is None
    assert seg.get_generate_matched_values() is None


########################
# CREATE_SEGMENT TESTS #
########################
def test_create_segment_integer():
    data = testing_utils.setup(os.path.join(DATA_DIR, "sample_data.json"), "integer")
    sorted_data = data[0]
    sorted_dict = data[1]

    # Create Test Segment Tuples
    start_end_vals = []
    start_end_vals.append(
        (sorted_data[0][1]["clientTime"], sorted_data[18][1]["clientTime"])
    )
    start_end_vals.append(
        (sorted_data[5][1]["clientTime"], sorted_data[6][1]["clientTime"])
    )
    start_end_vals.append(
        (sorted_data[3][1]["clientTime"], sorted_data[9][1]["clientTime"])
    )

    segment_names = [
        "test_segment_all",
        "test_segment_same_client_time",
        "test_segment_extra_log",
    ]

    # Call create_segment
    create_result = distill.create_segment(sorted_dict, segment_names, start_end_vals)

    result = create_result.get_segment_name_dict()

    assert result["test_segment_all"].num_logs == 19
    assert result["test_segment_all"].segment_name == "test_segment_all"
    assert result["test_segment_all"].start_end_val == (1623691890656, 1623691909728)

    assert result["test_segment_same_client_time"].num_logs == 2
    assert (
        result["test_segment_same_client_time"].segment_name
        == "test_segment_same_client_time"
    )
    assert result["test_segment_same_client_time"].start_end_val == (
        1623691904488,
        1623691904488,
    )
    assert result["test_segment_same_client_time"].uids == [
        "session_16236918905391623691904488rawclick",
        "session_16236918905391623691904488customclick",
    ]

    assert result["test_segment_extra_log"].num_logs == 8
    assert result["test_segment_extra_log"].segment_name == "test_segment_extra_log"
    assert result["test_segment_extra_log"].start_end_val == (
        1623691904212,
        1623691904923,
    )
    for segment_name in result:
        assert result[segment_name].segment_type == distill.Segment_Type.CREATE
        assert result[segment_name].get_segment_type() == distill.Segment_Type.CREATE
        assert result[segment_name].generate_field_name is None
        assert result[segment_name].get_generate_field_name() is None
        assert result[segment_name].generate_matched_values is None
        assert result[segment_name].get_generate_matched_values() is None


def test_create_segment_datetime():
    data = testing_utils.setup(os.path.join(DATA_DIR, "sample_data.json"), "datetime")
    sorted_data = data[0]
    sorted_dict = data[1]

    # Create Test Segment Tuples
    start_end_vals = []
    start_end_vals.append(
        (sorted_data[0][1]["clientTime"], sorted_data[18][1]["clientTime"])
    )
    start_end_vals.append(
        (sorted_data[5][1]["clientTime"], sorted_data[6][1]["clientTime"])
    )
    start_end_vals.append(
        (sorted_data[3][1]["clientTime"], sorted_data[9][1]["clientTime"])
    )

    segment_names = [
        "test_segment_all",
        "test_segment_same_client_time",
        "test_segment_extra_log",
    ]

    # Call create_segment
    result = distill.create_segment(
        sorted_dict, segment_names, start_end_vals
    ).get_segment_name_dict()

    assert result["test_segment_all"].num_logs == 19
    assert result["test_segment_all"].segment_name == "test_segment_all"
    assert result["test_segment_all"].start_end_val == (
        testing_utils.to_datetime(1623691890656),
        testing_utils.to_datetime(1623691909728),
    )

    assert result["test_segment_same_client_time"].num_logs == 2
    assert (
        result["test_segment_same_client_time"].segment_name
        == "test_segment_same_client_time"
    )
    assert result["test_segment_same_client_time"].start_end_val == (
        testing_utils.to_datetime(1623691904488),
        testing_utils.to_datetime(1623691904488),
    )
    assert result["test_segment_same_client_time"].uids == [
        "session_16236918905391623691904488rawclick",
        "session_16236918905391623691904488customclick",
    ]

    assert result["test_segment_extra_log"].num_logs == 8
    assert result["test_segment_extra_log"].segment_name == "test_segment_extra_log"
    assert result["test_segment_extra_log"].start_end_val == (
        testing_utils.to_datetime(1623691904212),
        testing_utils.to_datetime(1623691904923),
    )
    for segment_name in result:
        assert result[segment_name].segment_type == distill.Segment_Type.CREATE
        assert result[segment_name].get_segment_type() == distill.Segment_Type.CREATE
        assert result[segment_name].generate_field_name is None
        assert result[segment_name].get_generate_field_name() is None
        assert result[segment_name].generate_matched_values is None
        assert result[segment_name].get_generate_matched_values() is None


def test_create_segment_error_1():
    with pytest.raises(TypeError):
        data = testing_utils.setup(
            os.path.join(DATA_DIR, "sample_data.json"), "integer"
        )
        sorted_data = data[0]
        sorted_dict = data[1]

        # Create Test Segment Tuples
        start_end_vals = []
        start_end_vals.append(
            (
                testing_utils.to_datetime(sorted_data[0][1]["clientTime"]),
                testing_utils.to_datetime(sorted_data[18][1]["clientTime"]),
            )
        )
        segment_names = ["test_segment_error"]

        distill.create_segment(sorted_dict, segment_names, start_end_vals)


def test_create_segment_error_2():
    with pytest.raises(TypeError):
        data = testing_utils.setup(os.path.join(DATA_DIR, "sample_data.json"), "string")
        sorted_dict = data[1]

        # Create Test Segment Tuples
        start_end_vals = []
        start_end_vals.append(("random_string_1", "random_string_2"))
        segment_names = ["test_segment_error"]

        distill.create_segment(sorted_dict, segment_names, start_end_vals)


#######################
# WRITE_SEGMENT TESTS #
#######################
def test_write_segment_integer():
    data = testing_utils.setup(os.path.join(DATA_DIR, "sample_data.json"), "integer")
    sorted_data = data[0]
    sorted_dict = data[1]

    # Create Test Segment Tuples
    start_end_vals = []
    start_end_vals.append(
        (sorted_data[0][1]["clientTime"], sorted_data[18][1]["clientTime"])
    )
    start_end_vals.append(
        (sorted_data[5][1]["clientTime"], sorted_data[6][1]["clientTime"])
    )
    start_end_vals.append(
        (sorted_data[3][1]["clientTime"], sorted_data[9][1]["clientTime"])
    )

    segment_names = [
        "test_segment_all",
        "test_segment_same_client_time",
        "test_segment_extra_log",
    ]

    # Call write_segment
    result = distill.write_segment(sorted_dict, segment_names, start_end_vals)

    # Assert dictionary lengths
    assert len(result["test_segment_all"]) == 19
    assert len(result["test_segment_same_client_time"]) == 2
    assert len(result["test_segment_extra_log"]) == 8

    # Assert clientTime types
    for uid in result["test_segment_all"]:
        assert isinstance(result["test_segment_all"][uid]["clientTime"], int)
    for uid in result["test_segment_same_client_time"]:
        assert isinstance(
            result["test_segment_same_client_time"][uid]["clientTime"], int
        )
    for uid in result["test_segment_extra_log"]:
        assert isinstance(result["test_segment_extra_log"][uid]["clientTime"], int)


def test_write_segment_datetime():
    data = testing_utils.setup(os.path.join(DATA_DIR, "sample_data.json"), "datetime")
    sorted_data = data[0]
    sorted_dict = data[1]

    # Create Test Segment Tuples
    start_end_vals = []
    start_end_vals.append(
        (sorted_data[0][1]["clientTime"], sorted_data[18][1]["clientTime"])
    )
    start_end_vals.append(
        (sorted_data[5][1]["clientTime"], sorted_data[6][1]["clientTime"])
    )
    start_end_vals.append(
        (sorted_data[3][1]["clientTime"], sorted_data[9][1]["clientTime"])
    )

    segment_names = [
        "test_segment_all",
        "test_segment_same_client_time",
        "test_segment_extra_log",
    ]

    # Call write_segment
    result = distill.write_segment(sorted_dict, segment_names, start_end_vals)

    assert len(result["test_segment_all"]) == 19
    assert len(result["test_segment_same_client_time"]) == 2
    assert len(result["test_segment_extra_log"]) == 8

    # Assert clientTime types
    for uid in result["test_segment_all"]:
        assert isinstance(
            result["test_segment_all"][uid]["clientTime"], datetime.datetime
        )
        assert isinstance(result["test_segment_all"][uid]["clientTime"], pd.Timestamp)
    for uid in result["test_segment_same_client_time"]:
        assert isinstance(
            result["test_segment_same_client_time"][uid]["clientTime"],
            datetime.datetime,
        )
        assert isinstance(
            result["test_segment_same_client_time"][uid]["clientTime"], pd.Timestamp
        )
    for uid in result["test_segment_extra_log"]:
        assert isinstance(
            result["test_segment_extra_log"][uid]["clientTime"], datetime.datetime
        )
        assert isinstance(
            result["test_segment_extra_log"][uid]["clientTime"], pd.Timestamp
        )


def test_write_segment_error_1():
    with pytest.raises(TypeError):
        data = testing_utils.setup(
            os.path.join(DATA_DIR, "sample_data.json"), "integer"
        )
        sorted_data = data[0]
        sorted_dict = data[1]

        # Create Test Segment Tuples
        start_end_vals = []
        start_end_vals.append(
            (
                testing_utils.to_datetime(sorted_data[0][1]["clientTime"]),
                testing_utils.to_datetime(sorted_data[18][1]["clientTime"]),
            )
        )
        segment_names = ["test_segment_error"]

        # Should there be some assertions?
        distill.write_segment(sorted_dict, segment_names, start_end_vals)


def test_write_segment_error_2():
    with pytest.raises(TypeError):
        data = testing_utils.setup(os.path.join(DATA_DIR, "sample_data.json"), "string")
        sorted_data = data[0]
        sorted_dict = data[1]

        # Create Test Segment Tuples
        start_end_vals = []
        start_end_vals.append(
            (
                testing_utils.to_datetime(sorted_data[0][1]["clientTime"]),
                testing_utils.to_datetime(sorted_data[18][1]["clientTime"]),
            )
        )
        segment_names = ["test_segment_error"]

        # Should there be some assertions here?
        distill.write_segment(sorted_dict, segment_names, start_end_vals)


###########################
# GENERATE_SEGMENTS TESTS #
###########################
def test_generate_segments_integer():
    data = testing_utils.setup(
        os.path.join(DATA_DIR, "segment_generator_sample_data.json"), "integer"
    )
    sorted_dict = data[1]

    load_result = distill.generate_segments(
        sorted_dict, "type", ["load"], 1, 1, label="load"
    ).get_segment_name_dict()
    assert len(load_result) == 2
    assert load_result["load0"].start_end_val == (1623691889600, 1623691891600)
    assert load_result["load0"].num_logs == 3
    assert load_result["load1"].start_end_val == (1623691906302, 1623691908302)
    assert load_result["load1"].num_logs == 7
    for segment_name in load_result:
        assert load_result[segment_name].segment_type == distill.Segment_Type.GENERATE
        assert load_result[segment_name].generate_field_name == "type"
        assert load_result[segment_name].generate_matched_values == ["load"]

    click_result = distill.generate_segments(
        sorted_dict, "type", ["click"], 1, 1
    ).get_segment_name_dict()
    assert len(click_result) == 4
    assert click_result["0"].start_end_val == (1623691903200, 1623691905200)
    assert click_result["0"].num_logs == 2
    assert click_result["1"].start_end_val == (1623691905200, 1623691906488)
    assert click_result["1"].num_logs == 7
    assert click_result["2"].start_end_val == (1623691906488, 1623691907955)
    assert click_result["2"].num_logs == 6
    assert click_result["3"].start_end_val == (1623691907955, 1623691909100)
    assert click_result["3"].num_logs == 1
    for segment_name in click_result:
        assert click_result[segment_name].segment_type == distill.Segment_Type.GENERATE
        assert (
            click_result[segment_name].get_segment_type()
            == distill.Segment_Type.GENERATE
        )
        assert click_result[segment_name].generate_field_name == "type"
        assert click_result[segment_name].get_generate_field_name() == "type"
        assert click_result[segment_name].generate_matched_values == ["click"]
        assert click_result[segment_name].get_generate_matched_values() == ["click"]

    load_click_result = distill.generate_segments(
        sorted_dict, "type", ["load", "click"], 1, 1
    ).get_segment_name_dict()
    assert len(load_click_result) == 5
    assert load_click_result["0"].start_end_val == (1623691889600, 1623691891600)
    assert load_click_result["0"].num_logs == 3
    assert load_click_result["1"].start_end_val == (1623691903200, 1623691905200)
    assert load_click_result["1"].num_logs == 2
    assert load_click_result["2"].start_end_val == (1623691905200, 1623691906488)
    assert load_click_result["2"].num_logs == 7
    assert load_click_result["3"].start_end_val == (1623691906488, 1623691907955)
    assert load_click_result["3"].num_logs == 6
    assert load_click_result["4"].start_end_val == (1623691907955, 1623691909100)
    assert load_click_result["4"].num_logs == 1
    for segment_name in load_click_result:
        assert (
            load_click_result[segment_name].segment_type
            == distill.Segment_Type.GENERATE
        )
        assert (
            load_click_result[segment_name].get_segment_type()
            == distill.Segment_Type.GENERATE
        )
        assert load_click_result[segment_name].generate_field_name == "type"
        assert load_click_result[segment_name].get_generate_field_name() == "type"
        assert load_click_result[segment_name].generate_matched_values == [
            "load",
            "click",
        ]
        assert load_click_result[segment_name].get_generate_matched_values() == [
            "load",
            "click",
        ]


def test_generate_segments_datetime():
    data = testing_utils.setup(
        os.path.join(DATA_DIR, "segment_generator_sample_data.json"), "datetime"
    )
    sorted_dict = data[1]

    load_result = distill.generate_segments(
        sorted_dict, "type", ["load"], 1, 1
    ).get_segment_name_dict()
    assert len(load_result) == 2
    assert load_result["0"].start_end_val == (
        testing_utils.to_datetime(1623691889600),
        testing_utils.to_datetime(1623691891600),
    )
    assert load_result["0"].num_logs == 3
    assert load_result["1"].start_end_val == (
        testing_utils.to_datetime(1623691906302),
        testing_utils.to_datetime(1623691908302),
    )
    assert load_result["1"].num_logs == 7
    for segment_name in load_result:
        assert load_result[segment_name].segment_type == distill.Segment_Type.GENERATE
        assert (
            load_result[segment_name].get_segment_type()
            == distill.Segment_Type.GENERATE
        )
        assert load_result[segment_name].generate_field_name == "type"
        assert load_result[segment_name].get_generate_field_name() == "type"
        assert load_result[segment_name].generate_matched_values == ["load"]
        assert load_result[segment_name].get_generate_matched_values() == ["load"]

    click_result = distill.generate_segments(
        sorted_dict, "type", ["click"], 1, 1, "click"
    ).get_segment_name_dict()
    assert len(click_result) == 4
    assert click_result["click0"].start_end_val == (
        testing_utils.to_datetime(1623691903200),
        testing_utils.to_datetime(1623691905200),
    )
    assert click_result["click0"].num_logs == 2
    assert click_result["click1"].start_end_val == (
        testing_utils.to_datetime(1623691905200),
        testing_utils.to_datetime(1623691906488),
    )
    assert click_result["click1"].num_logs == 7
    assert click_result["click2"].start_end_val == (
        testing_utils.to_datetime(1623691906488),
        testing_utils.to_datetime(1623691907955),
    )
    assert click_result["click2"].num_logs == 6
    assert click_result["click3"].start_end_val == (
        testing_utils.to_datetime(1623691907955),
        testing_utils.to_datetime(1623691909100),
    )
    assert click_result["click3"].num_logs == 1
    for segment_name in click_result:
        assert click_result[segment_name].segment_type == distill.Segment_Type.GENERATE
        assert (
            click_result[segment_name].get_segment_type()
            == distill.Segment_Type.GENERATE
        )
        assert click_result[segment_name].generate_field_name == "type"
        assert click_result[segment_name].get_generate_field_name() == "type"
        assert click_result[segment_name].generate_matched_values == ["click"]
        assert click_result[segment_name].get_generate_matched_values() == ["click"]

    load_click_result = distill.generate_segments(
        sorted_dict, "type", ["load", "click"], 1, 1
    ).get_segment_name_dict()
    assert len(load_click_result) == 5
    assert load_click_result["0"].start_end_val == (
        testing_utils.to_datetime(1623691889600),
        testing_utils.to_datetime(1623691891600),
    )
    assert load_click_result["0"].num_logs == 3
    assert load_click_result["1"].start_end_val == (
        testing_utils.to_datetime(1623691903200),
        testing_utils.to_datetime(1623691905200),
    )
    assert load_click_result["1"].num_logs == 2
    assert load_click_result["2"].start_end_val == (
        testing_utils.to_datetime(1623691905200),
        testing_utils.to_datetime(1623691906488),
    )
    assert load_click_result["2"].num_logs == 7
    assert load_click_result["3"].start_end_val == (
        testing_utils.to_datetime(1623691906488),
        testing_utils.to_datetime(1623691907955),
    )
    assert load_click_result["3"].num_logs == 6
    assert load_click_result["4"].start_end_val == (
        testing_utils.to_datetime(1623691907955),
        testing_utils.to_datetime(1623691909100),
    )
    assert load_click_result["4"].num_logs == 1

    for segment_name in load_click_result:
        assert (
            load_click_result[segment_name].segment_type
            == distill.Segment_Type.GENERATE
        )
        assert (
            load_click_result[segment_name].get_segment_type()
            == distill.Segment_Type.GENERATE
        )
        assert load_click_result[segment_name].generate_field_name == "type"
        assert load_click_result[segment_name].get_generate_field_name() == "type"
        assert load_click_result[segment_name].generate_matched_values == [
            "load",
            "click",
        ]
        assert load_click_result[segment_name].get_generate_matched_values() == [
            "load",
            "click",
        ]


def test_generate_segments_none():
    data = testing_utils.setup(
        os.path.join(DATA_DIR, "segment_generator_sample_data.json"), "datetime"
    )
    sorted_dict = data[1]

    result1 = distill.generate_segments(sorted_dict, "type", ["random"], 1, 1)
    assert len(result1) == 0

    result2 = distill.generate_segments(sorted_dict, "random", ["random"], 1, 1)
    assert len(result2) == 0


def test_generate_segments_error():
    with pytest.raises(TypeError):
        data = testing_utils.setup(
            os.path.join(DATA_DIR, "segment_generator_sample_data.json"), "string"
        )
        sorted_dict = data[1]

        distill.generate_segments(sorted_dict, "type", ["load"], 1, 1)


#############################
# DETECT_DEADSPACE TESTS #
#############################
def test_deadspace_detection_integer():
    data = testing_utils.setup(
        os.path.join(DATA_DIR, "deadspace_detection_sample_data.json"), "integer"
    )
    sorted_dict = data[1]

    result_no_label = distill.detect_deadspace(
        sorted_dict, 5, 1, 2
    ).get_segment_name_dict()

    assert len(result_no_label) == 3
    assert result_no_label["0"].start_end_val == (1623691890459, 1623691994888)
    assert result_no_label["0"].num_logs == 7
    assert result_no_label["1"].start_end_val == (1623691991900, 1623693994900)
    assert result_no_label["1"].num_logs == 15
    assert result_no_label["2"].start_end_val == (1623693994550, 1623697997550)
    assert result_no_label["2"].num_logs == 3
    for segment_name in result_no_label:
        assert (
            result_no_label[segment_name].segment_type == distill.Segment_Type.DEADSPACE
        )
        assert (
            result_no_label[segment_name].get_segment_type()
            == distill.Segment_Type.DEADSPACE
        )
        assert result_no_label[segment_name].generate_field_name is None
        assert result_no_label[segment_name].get_generate_field_name() is None
        assert result_no_label[segment_name].generate_matched_values is None
        assert result_no_label[segment_name].get_generate_matched_values() is None

    result_with_label = distill.detect_deadspace(
        sorted_dict, 5, 1, 2, "deadspace"
    ).get_segment_name_dict()
    assert len(result_with_label) == 3
    assert result_with_label["deadspace0"].start_end_val == (
        1623691890459,
        1623691994888,
    )
    assert result_with_label["deadspace0"].num_logs == 7
    assert result_with_label["deadspace1"].start_end_val == (
        1623691991900,
        1623693994900,
    )
    assert result_with_label["deadspace1"].num_logs == 15
    assert result_with_label["deadspace2"].start_end_val == (
        1623693994550,
        1623697997550,
    )
    assert result_with_label["deadspace2"].num_logs == 3
    for segment_name in result_with_label:
        assert (
            result_with_label[segment_name].segment_type
            == distill.Segment_Type.DEADSPACE
        )
        assert (
            result_with_label[segment_name].get_segment_type()
            == distill.Segment_Type.DEADSPACE
        )
        assert result_with_label[segment_name].generate_field_name is None
        assert result_with_label[segment_name].get_generate_field_name() is None
        assert result_with_label[segment_name].generate_matched_values is None
        assert result_with_label[segment_name].get_generate_matched_values() is None


def test_deadspace_detection_datetime():
    data = testing_utils.setup(
        os.path.join(DATA_DIR, "deadspace_detection_sample_data.json"), "datetime"
    )
    sorted_dict = data[1]

    result_no_label = distill.detect_deadspace(
        sorted_dict, 5, 1, 2
    ).get_segment_name_dict()

    assert len(result_no_label) == 3
    assert result_no_label["0"].start_end_val == (
        testing_utils.to_datetime(1623691890459),
        testing_utils.to_datetime(1623691994888),
    )
    assert result_no_label["0"].num_logs == 7
    assert result_no_label["1"].start_end_val == (
        testing_utils.to_datetime(1623691991900),
        testing_utils.to_datetime(1623693994900),
    )
    assert result_no_label["1"].num_logs == 15
    assert result_no_label["2"].start_end_val == (
        testing_utils.to_datetime(1623693994550),
        testing_utils.to_datetime(1623697997550),
    )
    assert result_no_label["2"].num_logs == 3
    for segment_name in result_no_label:
        assert (
            result_no_label[segment_name].segment_type == distill.Segment_Type.DEADSPACE
        )
        assert (
            result_no_label[segment_name].get_segment_type()
            == distill.Segment_Type.DEADSPACE
        )
        assert result_no_label[segment_name].generate_field_name is None
        assert result_no_label[segment_name].get_generate_field_name() is None
        assert result_no_label[segment_name].generate_matched_values is None
        assert result_no_label[segment_name].get_generate_matched_values() is None

    result_with_label = distill.detect_deadspace(
        sorted_dict, 5, 1, 2, "deadspace"
    ).get_segment_name_dict()

    assert len(result_with_label) == 3
    assert result_with_label["deadspace0"].start_end_val == (
        testing_utils.to_datetime(1623691890459),
        testing_utils.to_datetime(1623691994888),
    )
    assert result_with_label["deadspace0"].num_logs == 7
    assert result_with_label["deadspace1"].start_end_val == (
        testing_utils.to_datetime(1623691991900),
        testing_utils.to_datetime(1623693994900),
    )
    assert result_with_label["deadspace1"].num_logs == 15
    assert result_with_label["deadspace2"].start_end_val == (
        testing_utils.to_datetime(1623693994550),
        testing_utils.to_datetime(1623697997550),
    )
    assert result_with_label["deadspace2"].num_logs == 3
    for segment_name in result_with_label:
        assert (
            result_with_label[segment_name].segment_type
            == distill.Segment_Type.DEADSPACE
        )
        assert (
            result_with_label[segment_name].get_segment_type()
            == distill.Segment_Type.DEADSPACE
        )
        assert result_with_label[segment_name].generate_field_name is None
        assert result_with_label[segment_name].get_generate_field_name() is None
        assert result_with_label[segment_name].generate_matched_values is None
        assert result_with_label[segment_name].get_generate_matched_values() is None


def test_deadspace_detection_error1():
    with pytest.raises(TypeError):
        data = testing_utils.setup(
            os.path.join(DATA_DIR, "deadspace_detection_sample_data.json"), "string"
        )
        sorted_dict = data[1]

        distill.detect_deadspace(sorted_dict, 5, 1, 2)


def test_deadspace_detection_error2():
    with pytest.raises(TypeError):
        data = testing_utils.setup(
            os.path.join(DATA_DIR, "deadspace_detection_sample_data.json"), "integer"
        )
        sorted_dict = data[1]

        sorted_dict["session_16236918905391623691891459rawscroll"]["clientTime"] = (
            testing_utils.to_datetime(
                sorted_dict["session_16236918905391623691891459rawscroll"]["clientTime"]
            )
        )

        distill.detect_deadspace(sorted_dict, 5, 1, 2)


def test_fixed_time_segments_integer():
    data = testing_utils.setup(os.path.join(DATA_DIR, "sample_data.json"), "integer")
    sorted_dict = data[1]

    result_no_label = distill.generate_fixed_time_segments(
        sorted_dict, 5
    ).get_segment_name_dict()

    # Check that start and end times are 5 seconds apart
    for segment_name in result_no_label:
        start = result_no_label[segment_name].start_end_val[0]
        end = result_no_label[segment_name].start_end_val[1]
        diff = end - start
        assert diff == 5000

    assert len(result_no_label) == 4

    assert result_no_label["0"].start_end_val == (1623691890656, 1623691895656)
    assert result_no_label["0"].num_logs == 3
    assert result_no_label["1"].start_end_val == (1623691895656, 1623691900656)
    assert result_no_label["1"].num_logs == 0
    assert result_no_label["2"].start_end_val == (1623691900656, 1623691905656)
    assert result_no_label["2"].num_logs == 9
    assert result_no_label["3"].start_end_val == (1623691905656, 1623691910656)
    assert result_no_label["3"].num_logs == 7

    result_label_trim = distill.generate_fixed_time_segments(
        sorted_dict, 5, trim=True, label="trim"
    ).get_segment_name_dict()

    # Check that start and end times are 5 seconds apart
    for segment_name in result_label_trim:
        start = result_label_trim[segment_name].start_end_val[0]
        end = result_label_trim[segment_name].start_end_val[1]
        diff = end - start
        assert diff == 5000

    assert len(result_label_trim) == 3

    assert result_label_trim["trim0"].start_end_val == (1623691890656, 1623691895656)
    assert result_label_trim["trim0"].num_logs == 3
    assert result_label_trim["trim1"].start_end_val == (1623691895656, 1623691900656)
    assert result_label_trim["trim1"].num_logs == 0
    assert result_label_trim["trim2"].start_end_val == (1623691900656, 1623691905656)
    assert result_label_trim["trim2"].num_logs == 9


def test_fixed_time_segments_datetime():
    data = testing_utils.setup(os.path.join(DATA_DIR, "sample_data.json"), "datetime")
    sorted_dict = data[1]

    result_no_label = distill.generate_fixed_time_segments(
        sorted_dict, 5
    ).get_segment_name_dict()

    # Check that start and end times are 5 seconds apart
    for segment_name in result_no_label:
        start = result_no_label[segment_name].start_end_val[0]
        end = result_no_label[segment_name].start_end_val[1]
        diff = end - start
        assert diff == datetime.timedelta(seconds=5)

    assert len(result_no_label) == 4

    assert result_no_label["0"].start_end_val == (
        testing_utils.to_datetime(1623691890656),
        testing_utils.to_datetime(1623691895656),
    )
    assert result_no_label["0"].num_logs == 3
    assert result_no_label["1"].start_end_val == (
        testing_utils.to_datetime(1623691895656),
        testing_utils.to_datetime(1623691900656),
    )
    assert result_no_label["1"].num_logs == 0
    assert result_no_label["2"].start_end_val == (
        testing_utils.to_datetime(1623691900656),
        testing_utils.to_datetime(1623691905656),
    )
    assert result_no_label["2"].num_logs == 9
    assert result_no_label["3"].start_end_val == (
        testing_utils.to_datetime(1623691905656),
        testing_utils.to_datetime(1623691910656),
    )
    assert result_no_label["3"].num_logs == 7

    result_label_trim = distill.generate_fixed_time_segments(
        sorted_dict, 5, trim=True, label="trim"
    ).get_segment_name_dict()

    # Check that start and end times are 5 seconds apart
    for segment_name in result_label_trim:
        start = result_label_trim[segment_name].start_end_val[0]
        end = result_label_trim[segment_name].start_end_val[1]
        diff = end - start
        assert diff == datetime.timedelta(seconds=5)

    assert len(result_label_trim) == 3

    assert result_label_trim["trim0"].start_end_val == (
        testing_utils.to_datetime(1623691890656),
        testing_utils.to_datetime(1623691895656),
    )
    assert result_label_trim["trim0"].num_logs == 3
    assert result_label_trim["trim1"].start_end_val == (
        testing_utils.to_datetime(1623691895656),
        testing_utils.to_datetime(1623691900656),
    )
    assert result_label_trim["trim1"].num_logs == 0
    assert result_label_trim["trim2"].start_end_val == (
        testing_utils.to_datetime(1623691900656),
        testing_utils.to_datetime(1623691905656),
    )
    assert result_label_trim["trim2"].num_logs == 9


def test_fixed_time_segments_error():
    with pytest.raises(TypeError):
        data = testing_utils.setup(
            os.path.join(DATA_DIR, "deadspace_detection_sample_data.json"), "string"
        )
        sorted_dict = data[1]

        distill.generate_fixed_time_segments(sorted_dict, 10)


def test_generate_collapsing_windows_integer():
    data = testing_utils.setup(os.path.join(DATA_DIR, "sample_data.json"), "integer")
    sorted_dict = data[1]

    result_no_label = distill.generate_collapsing_window_segments(
        sorted_dict, "path", ["button#test_button"]
    )

    segment = result_no_label[0]

    assert len(result_no_label) == 1
    assert segment.num_logs == 8
    assert segment.segment_name == "0"
    assert segment.start_end_val == (1623691904212, 1623691904923)


def test_generate_collapsing_windows_datetime():
    data = testing_utils.setup(os.path.join(DATA_DIR, "sample_data.json"), "datetime")
    sorted_dict = data[1]

    result_no_label = distill.generate_collapsing_window_segments(
        sorted_dict, "path", ["Window"]
    )

    segment1 = result_no_label[0]
    segment2 = result_no_label[1]

    assert segment1.num_logs == 16
    assert segment2.num_logs == 1
    assert segment1.segment_name == "0"
    assert segment2.segment_name == "1"
    assert segment1.start_end_val == (
        testing_utils.to_datetime(1623691891459),
        testing_utils.to_datetime(1623691907136),
    )
    assert segment2.start_end_val == (
        testing_utils.to_datetime(1623691909728),
        testing_utils.to_datetime(1623691909728),
    )

    assert len(result_no_label) == 2


def test_generate_collapsing_windows_datetime_all_logs():
    data = testing_utils.setup(os.path.join(DATA_DIR, "sample_data.json"), "datetime")
    sorted_dict = data[1]

    result_no_label = distill.generate_collapsing_window_segments(
        sorted_dict, "sessionID", ["session_1623691890539"]
    )

    segment1 = result_no_label[0]

    assert len(result_no_label) == 1
    assert segment1.num_logs == 19
    assert segment1.segment_name == "0"
    assert segment1.start_end_val == (
        testing_utils.to_datetime(1623691890656),
        testing_utils.to_datetime(1623691909728),
    )


###################
# SET LOGIC TESTS #
###################
def test_union_integer():
    data = testing_utils.setup(os.path.join(DATA_DIR, "sample_data.json"), "integer")
    sorted_data = data[0]
    sorted_dict = data[1]

    # Create Tuples
    start_end_vals = []
    start_end_vals.append(
        (sorted_data[0][1]["clientTime"], sorted_data[18][1]["clientTime"])
    )
    start_end_vals.append(
        (sorted_data[5][1]["clientTime"], sorted_data[6][1]["clientTime"])
    )
    start_end_vals.append(
        (sorted_data[6][1]["clientTime"], sorted_data[7][1]["clientTime"])
    )
    start_end_vals.append(
        (sorted_data[3][1]["clientTime"], sorted_data[9][1]["clientTime"])
    )

    segment_names = [
        "test_segment_1",
        "test_segment_2",
        "test_segment_3",
        "test_segment_4",
    ]

    result = distill.create_segment(
        sorted_dict, segment_names, start_end_vals
    ).get_segment_name_dict()

    new_segment = distill.union(
        "new_segment", result["test_segment_2"], result["test_segment_3"]
    )

    assert new_segment.segment_name == "new_segment"
    assert new_segment.num_logs == 4
    assert new_segment.uids == [
        sorted_data[5][0],
        sorted_data[6][0],
        sorted_data[7][0],
        sorted_data[8][0],
    ]
    assert new_segment.start_end_val == (
        sorted_data[5][1]["clientTime"],
        sorted_data[7][1]["clientTime"],
    )
    assert new_segment.segment_type == distill.Segment_Type.UNION
    assert new_segment.get_segment_type() == distill.Segment_Type.UNION
    assert new_segment.generate_field_name is None
    assert new_segment.get_generate_field_name() is None
    assert new_segment.generate_matched_values is None
    assert new_segment.get_generate_matched_values() is None


def test_union_datetime():
    data = testing_utils.setup(os.path.join(DATA_DIR, "sample_data.json"), "datetime")
    sorted_data = data[0]
    sorted_dict = data[1]

    # Create Tuples
    start_end_vals = []
    start_end_vals.append(
        (sorted_data[0][1]["clientTime"], sorted_data[18][1]["clientTime"])
    )
    start_end_vals.append(
        (sorted_data[5][1]["clientTime"], sorted_data[6][1]["clientTime"])
    )
    start_end_vals.append(
        (sorted_data[6][1]["clientTime"], sorted_data[7][1]["clientTime"])
    )
    start_end_vals.append(
        (sorted_data[3][1]["clientTime"], sorted_data[9][1]["clientTime"])
    )

    segment_names = [
        "test_segment_1",
        "test_segment_2",
        "test_segment_3",
        "test_segment_4",
    ]

    result = distill.create_segment(
        sorted_dict, segment_names, start_end_vals
    ).get_segment_name_dict()

    new_segment = distill.union(
        "new_segment", result["test_segment_3"], result["test_segment_1"]
    )

    assert new_segment.segment_name == "new_segment"
    assert new_segment.num_logs == 19
    assert new_segment.uids == [
        sorted_data[5][0],
        sorted_data[6][0],
        sorted_data[7][0],
        sorted_data[8][0],
        sorted_data[0][0],
        sorted_data[1][0],
        sorted_data[2][0],
        sorted_data[3][0],
        sorted_data[4][0],
        sorted_data[9][0],
        sorted_data[10][0],
        sorted_data[11][0],
        sorted_data[12][0],
        sorted_data[13][0],
        sorted_data[14][0],
        sorted_data[15][0],
        sorted_data[16][0],
        sorted_data[17][0],
        sorted_data[18][0],
    ]
    assert new_segment.start_end_val == (
        sorted_data[0][1]["clientTime"],
        sorted_data[18][1]["clientTime"],
    )
    assert new_segment.segment_type == distill.Segment_Type.UNION
    assert new_segment.get_segment_type() == distill.Segment_Type.UNION
    assert new_segment.generate_field_name is None
    assert new_segment.get_generate_field_name() is None
    assert new_segment.generate_matched_values is None
    assert new_segment.get_generate_matched_values() is None


def test_union_error():
    with pytest.raises(TypeError):
        data_integer = testing_utils.setup(
            os.path.join(DATA_DIR, "sample_data.json"), "integer"
        )
        sorted_data_integer = data_integer[0]
        sorted_dict_integer = data_integer[1]

        data_datetime = testing_utils.setup(
            os.path.join(DATA_DIR, "sample_data.json"), "datetime"
        )
        sorted_data_datetime = data_datetime[0]
        sorted_dict_datetime = data_datetime[1]

        segment_name_integer = ["test_segment_integer"]
        segment_name_datetime = ["test_segment_datetime"]

        start_end_integer = []
        start_end_integer.append(
            (
                sorted_data_integer[0][1]["clientTime"],
                sorted_data_integer[18][1]["clientTime"],
            )
        )
        start_end_datetime = []
        start_end_datetime.append(
            (
                sorted_data_datetime[3][1]["clientTime"],
                sorted_data_datetime[9][1]["clientTime"],
            )
        )

        int_segment = distill.create_segment(
            sorted_dict_integer, segment_name_integer, start_end_integer
        ).get_segment_name_dict()
        datetime_segment = distill.create_segment(
            sorted_dict_datetime, segment_name_datetime, start_end_datetime
        ).get_segment_name_dict()

        distill.union(
            "new_segment",
            int_segment["test_segment_integer"],
            datetime_segment["test_segment_datetime"],
        )


def test_intersection_integer():
    data = testing_utils.setup(os.path.join(DATA_DIR, "sample_data.json"), "integer")
    sorted_data = data[0]
    sorted_dict = data[1]

    # Create Tuples
    start_end_vals = []
    start_end_vals.append(
        (sorted_data[0][1]["clientTime"], sorted_data[18][1]["clientTime"])
    )
    start_end_vals.append(
        (sorted_data[5][1]["clientTime"], sorted_data[6][1]["clientTime"])
    )
    start_end_vals.append(
        (sorted_data[6][1]["clientTime"], sorted_data[7][1]["clientTime"])
    )
    start_end_vals.append(
        (sorted_data[3][1]["clientTime"], sorted_data[9][1]["clientTime"])
    )

    segment_names = [
        "test_segment_1",
        "test_segment_2",
        "test_segment_3",
        "test_segment_4",
    ]

    result = distill.create_segment(
        sorted_dict, segment_names, start_end_vals
    ).get_segment_name_dict()

    new_segment = distill.intersection(
        "new_segment", result["test_segment_2"], result["test_segment_3"]
    )

    assert new_segment.segment_name == "new_segment"
    assert new_segment.num_logs == 2
    assert new_segment.uids == [sorted_data[5][0], sorted_data[6][0]]
    assert new_segment.start_end_val == (
        sorted_data[5][1]["clientTime"],
        sorted_data[7][1]["clientTime"],
    )
    assert new_segment.segment_type == distill.Segment_Type.INTERSECTION
    assert new_segment.get_segment_type() == distill.Segment_Type.INTERSECTION
    assert new_segment.generate_field_name is None
    assert new_segment.get_generate_field_name() is None
    assert new_segment.generate_matched_values is None
    assert new_segment.get_generate_matched_values() is None


def test_intersection_datetime():
    data = testing_utils.setup(os.path.join(DATA_DIR, "sample_data.json"), "datetime")
    sorted_data = data[0]
    sorted_dict = data[1]

    # Create Tuples
    start_end_vals = []
    start_end_vals.append(
        (sorted_data[0][1]["clientTime"], sorted_data[18][1]["clientTime"])
    )
    start_end_vals.append(
        (sorted_data[5][1]["clientTime"], sorted_data[6][1]["clientTime"])
    )
    start_end_vals.append(
        (sorted_data[6][1]["clientTime"], sorted_data[7][1]["clientTime"])
    )
    start_end_vals.append(
        (sorted_data[3][1]["clientTime"], sorted_data[9][1]["clientTime"])
    )

    segment_names = [
        "test_segment_1",
        "test_segment_2",
        "test_segment_3",
        "test_segment_4",
    ]

    result = distill.create_segment(
        sorted_dict, segment_names, start_end_vals
    ).get_segment_name_dict()

    new_segment = distill.intersection(
        "new_segment", result["test_segment_3"], result["test_segment_1"]
    )

    assert new_segment.segment_name == "new_segment"
    assert new_segment.num_logs == 4
    assert new_segment.uids == [
        sorted_data[5][0],
        sorted_data[6][0],
        sorted_data[7][0],
        sorted_data[8][0],
    ]
    assert new_segment.start_end_val == (
        sorted_data[0][1]["clientTime"],
        sorted_data[18][1]["clientTime"],
    )
    assert new_segment.segment_type == distill.Segment_Type.INTERSECTION
    assert new_segment.get_segment_type() == distill.Segment_Type.INTERSECTION
    assert new_segment.generate_field_name is None
    assert new_segment.get_generate_field_name() is None
    assert new_segment.generate_matched_values is None
    assert new_segment.get_generate_matched_values() is None


def test_intersection_error():
    with pytest.raises(TypeError):
        data_integer = testing_utils.setup(
            os.path.join(DATA_DIR, "sample_data.json"), "integer"
        )
        sorted_data_integer = data_integer[0]
        sorted_dict_integer = data_integer[1]

        data_datetime = testing_utils.setup(
            os.path.join(DATA_DIR, "sample_data.json"), "datetime"
        )
        sorted_data_datetime = data_datetime[0]
        sorted_dict_datetime = data_datetime[1]

        segment_name_integer = ["test_segment_integer"]
        segment_name_datetime = ["test_segment_datetime"]

        start_end_integer = []
        start_end_integer.append(
            (
                sorted_data_integer[0][1]["clientTime"],
                sorted_data_integer[18][1]["clientTime"],
            )
        )
        start_end_datetime = []
        start_end_datetime.append(
            (
                sorted_data_datetime[3][1]["clientTime"],
                sorted_data_datetime[9][1]["clientTime"],
            )
        )

        int_segment = distill.create_segment(
            sorted_dict_integer, segment_name_integer, start_end_integer
        ).get_segment_name_dict()
        datetime_segment = distill.create_segment(
            sorted_dict_datetime, segment_name_datetime, start_end_datetime
        ).get_segment_name_dict()

        distill.intersection(
            "new_segment",
            int_segment["test_segment_integer"],
            datetime_segment["test_segment_datetime"],
        )


def test_difference_integer():
    data = testing_utils.setup(os.path.join(DATA_DIR, "sample_data.json"), "integer")
    sorted_data = data[0]
    sorted_dict = data[1]

    # Create Tuples
    start_end_vals = []
    start_end_vals.append(
        (sorted_data[0][1]["clientTime"], sorted_data[18][1]["clientTime"])
    )
    start_end_vals.append(
        (sorted_data[5][1]["clientTime"], sorted_data[6][1]["clientTime"])
    )
    start_end_vals.append(
        (sorted_data[6][1]["clientTime"], sorted_data[7][1]["clientTime"])
    )
    start_end_vals.append(
        (sorted_data[3][1]["clientTime"], sorted_data[9][1]["clientTime"])
    )

    segment_names = [
        "test_segment_1",
        "test_segment_2",
        "test_segment_3",
        "test_segment_4",
    ]

    result = distill.create_segment(
        sorted_dict, segment_names, start_end_vals
    ).get_segment_name_dict()

    new_segment = distill.difference(
        "new_segment", result["test_segment_1"], result["test_segment_4"]
    )

    assert new_segment.segment_name == "new_segment"
    assert new_segment.num_logs == 11
    assert new_segment.uids == [
        sorted_data[0][0],
        sorted_data[1][0],
        sorted_data[2][0],
        sorted_data[11][0],
        sorted_data[12][0],
        sorted_data[13][0],
        sorted_data[14][0],
        sorted_data[15][0],
        sorted_data[16][0],
        sorted_data[17][0],
        sorted_data[18][0],
    ]
    assert new_segment.start_end_val == result["test_segment_1"].start_end_val
    assert new_segment.segment_type == distill.Segment_Type.DIFFERENCE
    assert new_segment.get_segment_type() == distill.Segment_Type.DIFFERENCE
    assert new_segment.generate_field_name is None
    assert new_segment.get_generate_field_name() is None
    assert new_segment.generate_matched_values is None
    assert new_segment.get_generate_matched_values() is None


def test_difference_datetime():
    data = testing_utils.setup(os.path.join(DATA_DIR, "sample_data.json"), "datetime")
    sorted_data = data[0]
    sorted_dict = data[1]

    # Create Tuples
    start_end_vals = []
    start_end_vals.append(
        (sorted_data[0][1]["clientTime"], sorted_data[18][1]["clientTime"])
    )
    start_end_vals.append(
        (sorted_data[5][1]["clientTime"], sorted_data[6][1]["clientTime"])
    )
    start_end_vals.append(
        (sorted_data[6][1]["clientTime"], sorted_data[7][1]["clientTime"])
    )
    start_end_vals.append(
        (sorted_data[3][1]["clientTime"], sorted_data[9][1]["clientTime"])
    )

    segment_names = [
        "test_segment_1",
        "test_segment_2",
        "test_segment_3",
        "test_segment_4",
    ]

    result = distill.create_segment(
        sorted_dict, segment_names, start_end_vals
    ).get_segment_name_dict()

    new_segment = distill.difference(
        "new_segment", result["test_segment_1"], result["test_segment_4"]
    )

    assert new_segment.segment_name == "new_segment"
    assert new_segment.num_logs == 11
    assert new_segment.uids == [
        sorted_data[0][0],
        sorted_data[1][0],
        sorted_data[2][0],
        sorted_data[11][0],
        sorted_data[12][0],
        sorted_data[13][0],
        sorted_data[14][0],
        sorted_data[15][0],
        sorted_data[16][0],
        sorted_data[17][0],
        sorted_data[18][0],
    ]
    assert new_segment.start_end_val == result["test_segment_1"].start_end_val
    assert new_segment.segment_type == distill.Segment_Type.DIFFERENCE
    assert new_segment.get_segment_type() == distill.Segment_Type.DIFFERENCE
    assert new_segment.generate_field_name is None
    assert new_segment.get_generate_field_name() is None
    assert new_segment.generate_matched_values is None
    assert new_segment.get_generate_matched_values() is None


############################
# EXPORTING SEGMENTS TESTS #
############################
def test_export_segments():
    data = testing_utils.setup(
        os.path.join(DATA_DIR, "deadspace_detection_sample_data.json"), "integer"
    )
    sorted_dict = data[1]

    result = distill.detect_deadspace(sorted_dict, 5, 1, 2)
    distill.export_segments("./test.csv", result)

    # Read from file
    with open("./test.csv", "r") as file:
        lines = file.readlines()

    assert len(lines) == 4
    assert (
        lines[0] == "Segment Name,Start Time,End Time,Number of Logs,Generate Field"
        " Name,Generate Matched Values,Segment Type\n"
    )
    assert lines[1] == "0,1623691890459,1623691994888,7,,,Segment_Type.DEADSPACE\n"
    assert lines[2] == "1,1623691991900,1623693994900,15,,,Segment_Type.DEADSPACE\n"
    assert lines[3] == "2,1623693994550,1623697997550,3,,,Segment_Type.DEADSPACE\n"

    os.remove("./test.csv")

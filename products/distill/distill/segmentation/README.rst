.. ..

	<!---
    Licensed to the Apache Software Foundation (ASF) under one or more
	contributor license agreements.  See the NOTICE file distributed with
	this work for additional information regarding copyright ownership.
	The ASF licenses this file to You under the Apache License, Version 2.0
	(the "License"); you may not use this file except in compliance with
	the License.  You may obtain a copy of the License at

	  http://www.apache.org/licenses/LICENSE-2.0

	Unless required by applicable law or agreed to in writing, software
	distributed under the License is distributed on an "AS IS" BASIS,
	WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
	See the License for the specific language governing permissions and
	limitations under the License.
	--->

============
Segmentation
============

The ``Segment`` Object
------------------
``Segment`` objects represent the metadata associated with a segment of UserALE logs.  Each object has a variety of fields, including:

* ``segment_name``: The given name of a ``Segment``
* ``start_end_val``: The start and end ``clientTime``'s of a ``Segment``
* ``num_logs``: The number of logs in a ``Segment``
* ``uids``: A list of the UIDs of the logs within the ``Segment``
* ``segment_type``: An enumerated type (``Segment_Type``) that denotes how the ``Segment`` was created
* ``generate_field_name``: The field name used for value-matching if a ``Segment`` was created through the ``generate_segments`` or ``generate_collapsing_window_segments`` functions
* ``generate_matched_values``: The values used for value-matching if a ``Segment`` was created through the ``generate_segments`` or ``generate_collapsing_window_segments`` functions

These fields can be accessed through `get` functions.  For example, if a collection of ``Segment`` objects are created using the ``generate_segments`` function:

.. code:: python

    generated_segments = distill.generate_segments(sorted_dict, 'type', ['clicks'], 1, 1)

then the number of logs in each of these ``Segment`` objects could be printed to the console by running:

.. code:: python

    for segment_name in generated_segments:
        print(generated_segments[segment_name].get_num_logs())

Note that these functions are called via the ``Segment`` object itself, following the pattern ``segment.get_...()``

The ``Segments`` Object
-------------------
When creating ``Segment`` objects, the segment creation functions described in the following section return ``Segments`` objects.  These objects contain a list of ``Segment`` objects and help us to access, filter, and represent these objects in a variety of different ways described below:

Using Subscripts
****************
Individual ``Segment`` objects can be accessed using subscripts.  These subscripts can either be a numerical index indicating the location of the ``Segment`` object in the underlying list or the segment name of a ``Segment`` object.

.. code:: python

    segments    # A Segments object
    segment0 = segments[0]  # Accessing the first Segment object via numeric index
    segment1 = segments["1"]  # Accessing the Segment object whose segment name is "1"

Subscripts can also be used to change an underlying ``Segment`` object at the indicated index or with the indicated name.  However, when assigning a ``Segment`` object through the segment name, the segment name of the new ``Segment`` must match the indexed segment name indicated.

``Segments`` Iteration
**********************
``Segments`` iteration can be done as follows:

.. code:: python

    segments    # A Segments object
    for segment in segments:
        print(segment)

The above code will print each ``Segment`` object in the ``Segments`` object.

List Comprehensions
*******************
``Segments`` objects can also be used when performing list comprehensions.

.. code:: python

    segments    # A Segments object
    segment_names = [segment.segment_name for segment in segments]     # Returns a list of segment names

The list comprehension example above can be used to get a list of all of the segment names that exist in the ``Segments`` object.

Filtering ``Segments``
**********************
The ``Segments`` object is particularly useful when attempting to curate a collection of ``Segment`` objects.  The ``Segments`` class currently contains three functions that filter the underlying list of ``Segment`` objects: ``get_num_logs``, ``get_segments_before``, and ``get_segments_of_type``.

``get_num_logs``
^^^^^^^^^^^^^^^^
The ``get_num_logs`` function returns a new ``Segments`` object that only contains the ``Segment`` objects that have at least the number of logs specified.  An example is shown below:

**Input:**

.. code:: python

    print("Original Segments Object:")
    print(segments)

    segments = segments.get_num_logs(5)

    print("\nFiltered Segments Object:")
    print(segments)

**Console Output:**

.. code:: console

    Original Segments Object:
    Segments: [
    Segment: segment_name=0, start=1, end=2, num_logs=3, generate_field_name=None, generate_matched_values=None, segment_type=Segment_Type.FIXED_TIME
    Segment: segment_name=1, start=2, end=3, num_logs=0, generate_field_name=None, generate_matched_values=None, segment_type=Segment_Type.CREATE
    Segment: segment_name=2, start=3, end=4, num_logs=9, generate_field_name=None, generate_matched_values=None, segment_type=Segment_Type.FIXED_TIME
    Segment: segment_name=3, start=4, end=5, num_logs=7, generate_field_name=None, generate_matched_values=None, segment_type=Segment_Type.DEADSPACE
    ]

    Filtered Segments Object:
    Segments: [
    Segment: segment_name=2, start=3, end=4, num_logs=9, generate_field_name=None, generate_matched_values=None, segment_type=Segment_Type.FIXED_TIME
    Segment: segment_name=3, start=4, end=5, num_logs=7, generate_field_name=None, generate_matched_values=None, segment_type=Segment_Type.DEADSPACE
    ]

The above code removes ``Segment`` objects "0" and "1" since they contain less than 5 logs.

``get_segments_before``
^^^^^^^^^^^^^^^^^^^^^^^
The ``get_segments_before`` function returns a new ``Segments`` object that contains all the ``Segment`` objects that have end times before the user given time.  An example usage of this function is shown below:

**Input:**

.. code:: python

    print("Original Segments Object:")
    print(segments)

    segments = segments.get_segments_before(4)

    print("\nFiltered Segments Object:")
    print(segments)

**Console Output:**

.. code:: console

    Original Segments Object:
    Segments: [
    Segment: segment_name=0, start=1, end=2, num_logs=3, generate_field_name=None, generate_matched_values=None, segment_type=Segment_Type.FIXED_TIME
    Segment: segment_name=1, start=2, end=3, num_logs=0, generate_field_name=None, generate_matched_values=None, segment_type=Segment_Type.CREATE
    Segment: segment_name=2, start=3, end=4, num_logs=9, generate_field_name=None, generate_matched_values=None, segment_type=Segment_Type.FIXED_TIME
    Segment: segment_name=3, start=4, end=5, num_logs=7, generate_field_name=None, generate_matched_values=None, segment_type=Segment_Type.DEADSPACE
    ]

    Filtered Segments Object:
    Segments: [
    Segment: segment_name=0, start=1, end=2, num_logs=3, generate_field_name=None, generate_matched_values=None, segment_type=Segment_Type.FIXED_TIME
    Segment: segment_name=1, start=2, end=3, num_logs=0, generate_field_name=None, generate_matched_values=None, segment_type=Segment_Type.CREATE
    ]

The above output shows that the ``get_segments_before`` function filtered out any ``Segment`` object that had an end time after or including 4.

``get_segments_of_type``
^^^^^^^^^^^^^^^^^^^^^^^^
The ``get_segments_of_type`` function filters out ``Segment`` objects that do not have the indicated type of segment creation method.  An example usage of this function is shown below:

**Input:**

.. code:: python

    print("Original Segments Object:")
    print(segments)

    segments = segments.get_segments_of_type(distill.Segment_Type.FIXED_TIME)

    print("\nFiltered Segments Object:")
    print(segments)

**Console Output:**

.. code:: console

    Original Segments Object:
    Segments: [
    Segment: segment_name=0, start=1, end=2, num_logs=3, generate_field_name=None, generate_matched_values=None, segment_type=Segment_Type.FIXED_TIME
    Segment: segment_name=1, start=2, end=3, num_logs=0, generate_field_name=None, generate_matched_values=None, segment_type=Segment_Type.CREATE
    Segment: segment_name=2, start=3, end=4, num_logs=9, generate_field_name=None, generate_matched_values=None, segment_type=Segment_Type.FIXED_TIME
    Segment: segment_name=3, start=4, end=5, num_logs=7, generate_field_name=None, generate_matched_values=None, segment_type=Segment_Type.DEADSPACE
    ]

    Filtered Segments Object:
    Segments: [
    Segment: segment_name=0, start=1, end=2, num_logs=3, generate_field_name=None, generate_matched_values=None, segment_type=Segment_Type.FIXED_TIME
    Segment: segment_name=2, start=3, end=4, num_logs=9, generate_field_name=None, generate_matched_values=None, segment_type=Segment_Type.FIXED_TIME
    ]

The example above shows how this function can be used to create a ``Segments`` object that only contains ``Segment`` objects that were created through the fixed time generation function (this function is explained further in the following section).

Appending and Deleting ``Segment`` Objects
******************************************
``Segment`` objects can be appended or deleted from ``Segments`` objects using three functions: ``append``, ``append_segments``, and ``delete``.

``append``
^^^^^^^^^^
The ``append`` function takes a ``Segment`` object as a parameter and appends it to the calling ``Segments`` object.  An example usage of this function is shown below:

**Input:**

.. code:: python

    print("Original Segments Object:")
    print(segments)

    print("\nSegment object to add:")
    print(segment)

    segments.append(segment)

    print("\nModified Segments Object:")
    print(segments)

**Console Output:**

.. code:: console

    Original Segments Object:
    Segments: [
    Segment: segment_name=0, start=1, end=2, num_logs=3, generate_field_name=None, generate_matched_values=None, segment_type=Segment_Type.FIXED_TIME
    ]

    Segment object to add:
    Segment: segment_name=1, start=2, end=3, num_logs=0, generate_field_name=None, generate_matched_values=None, segment_type=Segment_Type.CREATE

    Modified Segments Object:
    Segments: [
    Segment: segment_name=0, start=1, end=2, num_logs=3, generate_field_name=None, generate_matched_values=None, segment_type=Segment_Type.FIXED_TIME
    Segment: segment_name=1, start=2, end=3, num_logs=0, generate_field_name=None, generate_matched_values=None, segment_type=Segment_Type.CREATE
    ]

The above example shows how a ``Segment`` object can be appended to a ``Segments`` object.  Note that this function modifies the underlying ``Segments`` object rather than returning a new ``Segments`` object.

``append_segments``
^^^^^^^^^^^^^^^^^^^
The ``append_segments`` function appends an entire ``Segments`` object to the calling ``Segments`` object.  This results in an updated ``Segments`` object that contains all of the ``Segment`` objects that were in the two ``Segments`` objects.  An example usage of this function is shown below:

**Input:**

.. code:: python

    print("Original Segments Object:")
    print(segments1)

    print("\nSegments object to append:")
    print(segments2)

    segments1.append_segments(segments2)

    print("\nModified Segments Object:")
    print(segments1)

**Console Output:**

.. code:: console

    Original Segments Object:
    Segments: [
    Segment: segment_name=0, start=1, end=2, num_logs=3, generate_field_name=None, generate_matched_values=None, segment_type=Segment_Type.FIXED_TIME
    ]

    Segments object to append:
    Segments: [
    Segment: segment_name=1, start=2, end=3, num_logs=0, generate_field_name=None, generate_matched_values=None, segment_type=Segment_Type.CREATE
    Segment: segment_name=2, start=3, end=4, num_logs=9, generate_field_name=None, generate_matched_values=None, segment_type=Segment_Type.FIXED_TIME
    ]

    Modified Segments Object:
    Segments: [
    Segment: segment_name=0, start=1, end=2, num_logs=3, generate_field_name=None, generate_matched_values=None, segment_type=Segment_Type.FIXED_TIME
    Segment: segment_name=1, start=2, end=3, num_logs=0, generate_field_name=None, generate_matched_values=None, segment_type=Segment_Type.CREATE
    Segment: segment_name=2, start=3, end=4, num_logs=9, generate_field_name=None, generate_matched_values=None, segment_type=Segment_Type.FIXED_TIME
    ]

The above code appends the ``Segment`` objects within segments2 to the segments1 object.

``delete``
^^^^^^^^^^
The ``delete`` function takes in a segment name and removes the ``Segment`` object with that name from the calling ``Segments`` object.  Below is an example usage of this function:

**Input:**

.. code:: python

    print("Original Segments Object:")
    print(segments)

    segments.delete("0")

    print("\nModified Segments Object:")
    print(segments)

**Console Output:**

.. code:: console

    Original Segments Object:
    Segments: [
    Segment: segment_name=0, start=1, end=2, num_logs=3, generate_field_name=None, generate_matched_values=None, segment_type=Segment_Type.FIXED_TIME
    Segment: segment_name=1, start=2, end=3, num_logs=0, generate_field_name=None, generate_matched_values=None, segment_type=Segment_Type.CREATE
    Segment: segment_name=2, start=3, end=4, num_logs=9, generate_field_name=None, generate_matched_values=None, segment_type=Segment_Type.FIXED_TIME
    Segment: segment_name=3, start=4, end=5, num_logs=7, generate_field_name=None, generate_matched_values=None, segment_type=Segment_Type.DEADSPACE
    ]

    Modified Segments Object:
    Segments: [
    Segment: segment_name=1, start=2, end=3, num_logs=0, generate_field_name=None, generate_matched_values=None, segment_type=Segment_Type.CREATE
    Segment: segment_name=2, start=3, end=4, num_logs=9, generate_field_name=None, generate_matched_values=None, segment_type=Segment_Type.FIXED_TIME
    Segment: segment_name=3, start=4, end=5, num_logs=7, generate_field_name=None, generate_matched_values=None, segment_type=Segment_Type.DEADSPACE
    ]

The above code removes the ``Segment`` object from the calling ``Segments`` object that is denoted by the segment name "0".

Returning Different Data Structures
***********************************
An additional feature of the ``Segments`` object is the ability to return different data structures that represent the ``Segment`` objects within the ``Segments`` object.  Currently there are two different data structure representations that can be returned by the ``Segments`` object: a list of ``Segment`` objects and a dictionary of segment names to ``Segment`` objects.  Below are examples of each function.

``get_segment_list``
^^^^^^^^^^^^^^^^^^^^
This function returns a list of the ``Segment`` objects within the calling ``Segments`` object.

**Example:**

.. code:: python

    segments    # A Segments object

    segments_list = segments.get_segment_list()     # A list of the Segment objects within segments

``get_segment_name_dict``
^^^^^^^^^^^^^^^^^^^^^^^^^
The ``get_segment_name_dict`` function returns a dictionary whose keys are the segment names of the ``Segment`` objects which refer to the ``Segment`` objects themselves.

**Example:**

.. code:: python

    segments    # A Segments object

    segments_dict = segments.get_segment_name_dict()     # A dictionary of the Segment objects within segments

Segment Creation
----------------
The creation of segments can be done through the use of five functions: ``create_segment``, ``generate_segments``, ``detect_deadspace``, ``generate_fixed_time_segments``, and ``generate_collapsing_window_segments``.

Create Segment
**************
The most literal way to create ``Segment`` objects is through the use of the ``create_segment`` function.  This function takes in three parameters in order to create ``Segment`` objects: a target dictionary of UserALE logs, a list of segment names, and a list of tuples that represent the start ``clientTime`` and end ``clientTime`` of the segment.  Given this information, segments can be created as follows:

.. code:: python

    # Sorted dictionary of UserALE logs
    sorted_dict

    # List of segment names
    segment_names = ["segment1", "segment2"]

    # Time tuples
    start_end_vals = [(start_time_1, end_time_1), (start_time_2, end_time_2)]

    # Create Segments
    segments = distill.create_segment(sorted_dict, segment_names, start_end_vals)

The above code will output a ``Segments`` object that contains each ``Segment`` object.  For instance, we can access the first segment by doing the following:

.. code:: python

    segment1 = segments["segment1"]


Generate Segments
*****************
Segment generation is a more automatic way to create ``Segment`` objects and is based off of the matching of a particular UserALE log field with a list of possible values.  The function ``generate_segments`` will then generate ``segment`` objects based on windows of time starting before and after the matched field, indicated in seconds as a function parameter.  The below code illustrates the basic use of this function:

.. code:: python

    # Sorted dictionary of UserALE logs
    sorted_dict

    # Generate segments based on user clicks
    segments = distill.generate_segments(sorted_dict, 'type', ['click'], 1, 2)

The above code will return a ``Segments`` object that contains ``Segment`` objects that represent windows of time 1 second prior to a 'click' type and 2 seconds after a 'click' type.  If we wanted to generate ``Segment`` objects that matched both 'click' and 'load' types, then we could use the following code:

.. code:: python

    # Sorted dictionary of UserALE logs
    sorted_dict

    # Generate segments based on user clicks and loads
    segments = distill.generate_segments(sorted_dict, 'type', ['click', 'load'], 1, 2)

Note that ``generate_segments`` does not overlap segments.  In the event that two matching events happen back-to-back within the logs and the second log is already in the ``Segment`` generated by the first, the second log will not have its own ``Segment`` created.  This non-overlapping behavior also may create ``Segment`` objects that are shorter in time than expected.  For instance, if a ``Segment`` is created with an end time that is after the start time of a new ``Segment``, the new ``Segment`` object's start time will default to the end time of the previous ``Segment``.

Detect Deadspace
****************
Another way to create ``Segment`` objects is to do so based on deadspace in the UserALE logs.  Deadspace is simply time in which the user is idle.  The ``detect_deadspace`` function creates ``Segment`` objects based on deadspace in the logs given a threshold for what is considered to be 'deadspace'.  An example of this is shown below:

.. code:: python

    # Sorted dictionary of UserALE logs
    sorted_dict

    # Create segments based on detected deadspace
    segments = distill.detect_deadspace(sorted_dict, 20, 1, 2)

The above code will output a ``Segments`` object holding ``Segment`` objects that represent deadspace.  In this case, we have defined 'deadspace' to be any idle time of 20 seconds.  Each time deadspace is detected, the logs that occurred 1 second before and 2 seconds after that idle time are recorded in the ``Segment``.

Generating Fixed Time Segments
******************************
The ``generate_fixed_time_segments`` function generates ``Segment`` objects based on fixed time intervals.  An example usage of this function is shown below:

.. code:: python

        segments = distill.generate_fixed_time_segments(sorted_dict, 5, label="generated")

The above code will create a ``Segments`` object that contains ``Segment`` objects created based off of 5 second intervals.

Note that by default this function will not trim additional logs that do not fit into a fixed time window if the time between the start of the first log and end of the last log are not divisible by the indicated interval.  To avoid this, ``generate_fixed_time_segments`` also has an optional argument entitled ``trim``.  If true, ``trim`` will trim the logs that do not fit into an additional fixed time window.

Collapsing Window Segments
**************************
The ``generate_collapsing_windows_segments`` function generates ``Segment`` objects based on a window to time in which the given field name has a value matching one of the values indicated by the ``field_values_of_interest`` list parameter.  An example usage of this function is shown below:

.. code:: python

    segments = distill.generate_collapsing_window_segments(sorted_dict, "path", ["Window"])

The above function creates a ``Segments`` object that contains ``Segment`` objects that begin when the path field has the string "Window" and ends when the path field no longer contains "Window."

Combining ``Segment`` Objects with Set Logic
---------------------------------
``Segment`` objects can be combined using set logic.

Union
*****
A union can be performed using the ``union`` function.  An example usage of this function is shown below:

.. code:: python

    # Segment 1
    segment1.get_uids()     #[uid1, uid2, uid3]

    # Segment 2
    segment2.get_uids()     #[uid3, uid4, uid5]

    # Perform Union
    new_segment = distill.union("new_segment", segment1, segment2)
    new_segment.get_uids()  #[uid1, uid2, uid3, uid4, uid5]

The above code will return a new ``Segment`` object with the given segment_name, start and end values based on the smallest client time and largest client time of the given ``Segment`` objects, and a list of the union of the uids of segment1 and segment2.

Intersection
************
An intersection can be performed using the ``intersection`` function.  An example usage of this function is shown below:

.. code:: python

    # Segment 1
    segment1.get_uids()   #[uid1, uid3, uid6]

    # Segment 2
    segment2.get_uids()     #[uid3, uid6, uid9]

    new_segment = distill.intersection("new_segment", segment1, segment2)
    new_segment.get_uids()  #[uid3, uid6]

The above code will return a new ``Segment`` object (similarly to union) with uids that represent the intersection of the uids of segment1 and segment2.

Difference
**********
The ``difference`` function creates a new ``Segment`` object based on the logical difference of two ``Segment`` objects.

.. code:: python

    # Segment 1
    segment1.get_uids()   #[uid1, uid2, uid3]

    # Segment 2
    segment2.get_uids()     #[uid2, uid4, uid5]

    new_segment1 = distill.difference("new_segment_1", segment1, segment2)
    new_segment1.get_uids()  #[uid1, uid3]

    new_segment2 = distill.difference("new_segment_2", segment2, segment1)
    new_segment2.get_uids()  #[uid4, uid5]

The above code will return a new ``Segment`` object (similarly to union and intersection) with uids that represent the difference of the uids of segment1 and segment2.

Writing Segments
----------------
The ``write_segment`` function creates a nested dictionary of segment names to UIDs which then map to individual logs (i.e result['segment_name'][uid] --> log). This assists with easy iteration over defined ``Segment`` objects.

.. code:: python

    # Sorted dictionary of UserALE logs
    sorted_dict

    # List of segment names
    segment_names = ["segment1", "segment2"]

    # Time tuples
    start_end_vals = [(start_time_1, end_time_1), (start_time_2, end_time_2)]

    # Write Segments
    segments = distill.write_segment(sorted_dict, segment_names, start_end_vals)

The above code looks similar to the ``create_segments`` example usage, however, rather than returning a ``Segments`` object, this code will create a dictionary of segment names to UIDs to individual UserALE logs.

Exporting Segments
------------------
``Segments`` objects can be exported into csv files using the ``export_segments`` function.  This function will take the path to place the new file along with a ``Segments`` object and output a new csv with each segment on a new line.  Note that this function will not currently export user defined attributes that are not inherently within a ``Segment`` object.  This function can be used as follows:

.. code:: python

    # Sorted dictionary of UserALE logs
    sorted_dict

    # Create a Segments object through the detect_deadspace function
    segments = distill.detect_deadspace(sorted_dict, 5, 1, 2)

    # Export these segments into a csv file
    distill.export_segments("./test.csv", segments)

The above code will create a csv file in the current directory entitled `test.csv`.  An example of what this file looks
like with two ``Segment`` objects can be seen below:

.. code:: console

    Segment Name,Start Time,End Time,Number of Logs,Generate Field Name,Generate Matched Values,Segment Type
    segment1,0,1,5,type,['click'],Segment_Type.GENERATE
    segment2,2,3,6,type,['click'],Segment_Type.GENERATE

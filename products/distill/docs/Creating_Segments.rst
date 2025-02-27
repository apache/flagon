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

========================
Creating Segment Objects
========================
The creation of ``Segment`` objects can be done through the use of five functions: ``create_segment``, ``generate_segments``,
``generate_fixed_time_segments``, ``generate_collapsing_window_segments``, and ``detect_deadspace`` within Distill's
Segmentation package.  Each function creates ``Segment`` objects and returns them in the form of a ``Segments`` object.
These functions fall under the categories of basic ``Segment`` creation, automatic ``Segment`` generation, and detecting
deadspace described below.

UserALE Log Preprocessing
-------------------------
Before ``Segment`` objects can be created, the UserALE logs must be put in a format expected by the ``Segment`` creation
functions.  Each function expects logs to be structured in a dictionary sorted by ``clientTime``.  The keys of the dictionary
are universally unique identifiers (UUIDs) for each log and the value for each UUID key is the log itself.  Distill provides analysts with a
function that will generate these IDs: ``get_UUID``.  This function can be used as follows:

.. code:: python

    # A UserALE log
    log

    # Generate UUID
    uuid = distill.getUUID(log)

Throughout the rest of this documentation UUID and UID will be used interchangeably to describe these unique identifiers.
In addition, note that the functions within Distill's Segmentation package expect the UserALE log ``clientTime`` field to either be
represented as an integer or a python ``datetime`` object.  This is another preprocessing step that must be taken before
beginning to use Segmentation functions.

Basic Segment Creation
----------------------
The most literal way to create ``Segment`` objects is through the use of the ``create_segment`` function.  This function
takes in three parameters in order to create ``Segment`` objects: a sorted dictionary of UserAle logs, a list of segment
names, and a list of tuples that represent the start ``clientTime`` and end ``clientTime`` of the segment.  Given this
information, ``Segment`` objects can be created as follows:

.. code:: python

    # Sorted dictionary of UserALE logs
    sorted_dict

    # List of segment names
    segment_names = ["segment1", "segment2"]

    # Time tuples
    start_end_vals = [(start_time_1, end_time_1), (start_time_2, end_time_2)]

    # Create Segments
    segments = distill.create_segment(sorted_dict, segment_names, start_end_vals)

The above code will output a ``Segments`` object that contains each ``Segment`` object indicated.

Automatic Segment Generation
----------------------------
If an analyst does not know the start and end times of interest within the UserALE logs, ``Segment`` generation functions
provide a more automatic way to create ``Segment`` objects.  There are three functions that aid in the automatic creation
of ``Segment`` objects: ``generate_segments``, ``generate_fixed_time_segments``, and ``generate_collapsing_window_segments``.
Each of these functions provide an optional parameter entitled ``label`` that denotes a prefix to use for the naming of
each generated ``Segment`` object.

Generate Segments
*****************
The ``generate_segments`` function is an automatic way to create ``Segment`` objects and is based off of the matching of
a particular UserALE log field with a list of possible values.  The function will then generate ``Segment`` objects based
on windows of time starting before and after the matched field, indicated in seconds as a function parameter.  The below
code illustrates the basic use of this function:

.. code:: python

    # Sorted dictionary of UserALE logs
    sorted_dict

    # Generate segment objects based on user clicks
    segments = distill.generate_segments(sorted_dict, 'type', ['click'], 1, 2)

The above code will return a ``Segments`` object that contains ``Segment`` objects that represent windows of time 1 second
prior to a 'click' type and 2 seconds after a 'click' type.  If we wanted to generate ``Segment`` objects that matched both
'click' and 'load' types, then we could use the following code:

.. code:: python

    # Sorted dictionary of UserALE logs
    sorted_dict

    # Generate segment objects based on user clicks and loads
    segments = distill.generate_segments(sorted_dict, 'type', ['click', 'load'], 1, 2)

Note that ``generate_segments`` does not overlap ``Segment`` objects.  In the event that two matching events happen back-to-back
within the logs and the second log is already in the ``Segment`` generated by the first, the second log will not have its
own ``Segment`` created.  This non-overlapping behavior also may create ``Segment`` objects that are shorter in time than
expected.  For instance, if a ``Segment`` is created with an end time that is after the start time of a new ``Segment``,
the new ``Segment`` object's start time will default to the end time of the previous ``Segment``.

Generate Fixed Time Segments
****************************
The ``generate_fixed_time_segments`` function generates ``Segment`` objects based on fixed time intervals.  An example
usage of this function is shown below:

.. code:: python

    # Sorted dictionary of UserALE logs
    sorted_dict

    # Generate segment objects based on 5 second intervals
    segments = distill.generate_fixed_time_segments(sorted_dict, 5, label="generated")

The above code will create a ``Segments`` object that contains ``Segment`` objects created based off of 5 second intervals.
This example also demonstrates the usage of the optional ``label`` parameter.

Note that by default this function will not trim additional logs that do not fit into a fixed time window if the time between
the start of the first log and end of the last log are not divisible by the indicated interval.  To avoid this, ``generate_fixed_time_segments``
also has an optional argument entitled ``trim``.  If true, ``trim`` will trim the logs that do not fit into an additional
fixed time window.

Generate Collapsing Window Segments
***********************************
The ``generate_collapsing_windows_segments`` function generates ``Segment`` objects based on a window of time in which the
given field name has a value matching one of the values indicated by the ``field_values_of_interest`` list parameter.
An example usage of this function is shown below:

.. code:: python

    # Sorted dictionary of UserALE logs
    sorted_dict

    # Generate segment objects based on a collapsing window
    segments = distill.generate_collapsing_window_segments(sorted_dict, "path", ["Window"])

The above function creates a ``Segments`` object that contains ``Segment`` objects that begin when the path field has the
string "Window" and ends when the path field no longer contains "Window."

Detecting Deadspace
-------------------
The final ``Segment`` creation function involves the automatic detecting of deadspace within the sorted UserALE log dictionary.
Deadspace is time in which the user is idle.  The ``detect_deadspace`` function creates ``Segment`` objects based on deadspace
in the logs given a threshold for what is considered to be 'deadspace'.  An example of this is shown below:

.. code:: python

    # Sorted dictionary of UserALE logs
    sorted_dict

    # Create segment objects based on detected deadspace
    segments = distill.detect_deadspace(sorted_dict, 20, 1, 2)

The above code will output a ``Segments`` object holding ``Segment`` objects that represent deadspace.  In this case, we
have defined 'deadspace' to be any idle time of 20 seconds.  Each time deadspace is detected, the logs that occurred 1
second before and 2 seconds after that idle time are recorded in the ``Segment``.  Note that the optional ``label`` parameter
is also available for the ``detect_deadspace`` function.

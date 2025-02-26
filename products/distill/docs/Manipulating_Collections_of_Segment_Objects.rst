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

===========================================
Manipulating Collections of Segment Objects
===========================================
Collections of ``Segment`` objects are held in ``Segments`` objects.  ``Segments`` objects have a variety of capabilities
that allow an analyst to access, filter, and represent ``Segment`` objects in different ways.

Iteration
---------
``Segments`` iteration can be done as follows:

.. code:: python

    segments    # A Segments object
    for segment in segments:
        print(segment)

The above code will print each ``Segment`` object in the ``Segments`` object.

Access and Modification through Subscripts
------------------------------------------
Individual ``Segment`` objects can be accessed using subscripts.  These subscripts can either be a numerical index indicating
the location of the ``Segment`` object in an underlying list or the segment name of a ``Segment`` object.

.. code:: python

    segments    # A Segments object
    segment0 = segments[0]  # Accessing the first Segment object via numeric index
    segment1 = segments["1"]  # Accessing the Segment object whose segment name is "1"

Subscripts can also be used to change an underlying ``Segment`` object at the indicated index or with the indicated name.
However, when assigning a ``Segment`` object through the segment name, the segment name of the new ``Segment`` must match the indexed segment name indicated.

List Comprehensions
-------------------
``Segments`` objects can be used when performing list comprehensions.

.. code:: python

    segments    # A Segments object
    segment_names = [segment.segment_name for segment in segments]     # Returns a list of segment names

The list comprehension example above can be used to get a list of all of the segment names that exist in the ``Segments`` object.

Filtering
---------
The ``Segments`` object is particularly useful when attempting to curate a collection of ``Segment`` objects.  The
``Segments`` class currently contains three functions that filter the underlying list of ``Segment`` objects: ``get_num_logs``,
``get_segments_before``, and ``get_segments_of_type``.

Filtering by Number of Logs
***************************
The ``get_num_logs`` function returns a new ``Segments`` object that only contains the ``Segment`` objects that have at
least the number of logs specified.  An example is shown below:

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

Filtering by Time
*****************
The ``get_segments_before`` and ``get_segments_after`` functions return a new ``Segments`` object that contains all the
``Segment`` objects that either have end times before the user given time or start times after the user given time.  An
example usage of each of these functions is shown below:

**Input:**

.. code:: python

    print("Original Segments Object:")
    print(segments)

    segments_before = segments.get_segments_before(4)
    segments_after = segments.get_segments_after(3)

    print("\nFiltered Segments Object (Before):")
    print(segments_before)

    print("\nFiltered Segments Object (After):")
    print(segments_after)

**Console Output:**

.. code:: console

    Original Segments Object:
    Segments: [
    Segment: segment_name=0, start=1, end=2, num_logs=3, generate_field_name=None, generate_matched_values=None, segment_type=Segment_Type.FIXED_TIME
    Segment: segment_name=1, start=2, end=3, num_logs=0, generate_field_name=None, generate_matched_values=None, segment_type=Segment_Type.CREATE
    Segment: segment_name=2, start=3, end=4, num_logs=9, generate_field_name=None, generate_matched_values=None, segment_type=Segment_Type.FIXED_TIME
    Segment: segment_name=3, start=4, end=5, num_logs=7, generate_field_name=None, generate_matched_values=None, segment_type=Segment_Type.DEADSPACE
    ]

    Filtered Segments Object (Before):
    Segments: [
    Segment: segment_name=0, start=1, end=2, num_logs=3, generate_field_name=None, generate_matched_values=None, segment_type=Segment_Type.FIXED_TIME
    Segment: segment_name=1, start=2, end=3, num_logs=0, generate_field_name=None, generate_matched_values=None, segment_type=Segment_Type.CREATE
    ]

    Filtered Segments Object (After):
    Segments: [
    Segment: segment_name=3, start=4, end=5, num_logs=7, generate_field_name=None, generate_matched_values=None, segment_type=Segment_Type.DEADSPACE
    ]

The above output shows that the ``get_segments_before`` function filtered out any ``Segment`` that had an end time
after or including 4 and that the ``get_segments_after`` function filtered out any ``Segment`` with a start time less than
or equal to 3.

Filtering by Segment Type
*************************
The ``get_segments_of_type`` function filters out ``Segment`` objects that do not have the indicated type of segment creation
method.  An example usage of this function is shown below:

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

The example above shows how this function can be used to create a ``Segments`` object that only contains ``Segment`` objects
that were created through the fixed time generation function.

Appending and Deleting ``Segment`` Objects
------------------------------------------
``Segment`` objects can be appended or deleted from ``Segments`` objects using three functions: ``append``,
``append_segments``, and ``delete``.

Appending ``Segment`` Objects
*****************************
Appending ``Segment`` objects can be done through the ``append`` function.  This function takes a ``Segment`` object as
a parameter and appends it to the calling ``Segments`` object.  An example usage of this function is shown below:

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

The above example shows how a ``Segment`` object can be appended to a ``Segments`` object.  Note that this function modifies
the underlying ``Segments`` object rather than returning a new ``Segments`` object.

Appending ``Segments`` Objects
******************************
The ``append_segments`` function appends an entire ``Segments`` object to the calling ``Segments`` object.  This results
in an updated ``Segments`` object that contains all of the ``Segment`` objects that were in the two ``Segments`` objects.
An example usage of this function is shown below:

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

Deleting ``Segment`` Objects
****************************
The ``delete`` function takes in a segment name and removes the ``Segment`` object with that name from the calling ``Segments`` object.
Below is an example usage of this function:

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

Representation of ``Segment`` Objects with Different Data Structures
--------------------------------------------------------------------
An additional feature of the ``Segments`` object is the ability to return different data structures that represent the
``Segment`` objects within the ``Segments`` object.  Currently there are two different data structure representations that
can be returned by the ``Segments`` object: a list of ``Segment`` objects and a dictionary of segment names to ``Segment``
objects.  Below are examples of each function.

``Segment`` List
****************
The ``get_segment_list`` function returns a list of ``Segment`` objects within the calling ``Segments`` object.

**Example:**

.. code:: python

    segments    # A Segments object

    segments_list = segments.get_segment_list()     # A list of the Segment objects within segments

``Segment`` Dictionary
**********************
The ``get_segment_name_dict`` function returns a dictionary whose keys are the segment names of the ``Segment`` objects
which refer to the ``Segment`` objects themselves.

**Example:**

.. code:: python

    segments    # A Segments object

    segments_dict = segments.get_segment_name_dict()     # A dictionary of the Segment objects within segments

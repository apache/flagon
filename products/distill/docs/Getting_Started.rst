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

=================================
Getting Started with Segmentation
=================================

Why Segmentation?
-----------------
When collecting UserALE logs, it is easy to get bombarded with hundreds of logs.  Distill's Segmentation package seeks
to make the analysis of these logs easier through the creation of meaningful segments.  These segments are created and
collected through Distill's custom ``Segment`` and ``Segments`` objects.  The creation of these objects provides a
useful abstraction for analysts to compare UserALE logs and analyze patterns in the data.

What is a ``Segment``?
----------------------
``Segment`` objects group together UserALE logs via their UIDs and represent the metadata associated with a collection
of logs.  Each object has a variety of fields, including:

* ``segment_name``: The given name of a ``Segment``
* ``start_end_val``: The start and end ``clientTime``'s of a ``Segment``
* ``num_logs``: The number of logs in a ``Segment``
* ``uids``: A list of the UIDs of the logs within the ``Segment``
* ``segment_type``: An enumerated type (``Segment_Type``) that denotes how the ``Segment`` was created
* ``generate_field_name``: The field name used for value-matching if a ``Segment`` was created through the ``generate_segments`` or ``generate_collapsing_window_segments`` functions
* ``generate_matched_values``: The values used for value-matching if a ``Segment`` was created through the ``generate_segments`` or ``generate_collapsing_window_segments`` functions

The analysis of these fields help analysts to create collections of meaningful ``Segment`` objects based on their
metadata.  Since ``Segment`` objects create an association with UserALE logs through the logs` UID, there is no need to
hold UserALE logs within the ``Segment`` object themselves.  This allows for the easy creation of ``Segment`` objects
without the need to manage UserALE logs behind the scenes.

What is a ``Segments`` object?
------------------------------
``Segments`` objects are another abstraction used by Distill's Segmentation package to hold a collection of ``Segment``
objects.  This custom data structure gives the Segmentation package the ability to aid analysts even further with the
curation of meaningful collections of ``Segment`` objects.  The ``Segments`` object also allows for easy access to
``Segment`` objects, utilizing syntax similar to both python lists and dictionaries.  Through the ``Segments`` object,
the following capabilities are available and will be described further under the *Manipulating Collections of
Segment Objects* section:

* Iteration
* Access and Modification through Subscripts
* List Comprehensions
* Filtering
* Appending and Deleting ``Segment`` Objects
* Representation of ``Segment`` Objects with Different Data Structures

Importing the Segmentation package
----------------------------------
Once Distill is installed, the easiest way to import Distill's Segmentation package is to import the entire Distill project at the top of a python
file as follows:

.. code:: python

    import distill

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

=================
Utility Functions
=================
Distill provides two useful utility functions that can aid in the preprocessing of UserALE logs.  They include the
``epoch_to_datetime`` and ``get_UUID`` functions.  Below we provide an overview of both:

Epoch to Datetime
-----------------
The ``epoch_to_datetime`` function will take a string representation of unix time and convert it into an integer.  An example
usage of this function is as follows:

.. code:: python

    string_time = "1000"
    integer_time = distill.epoch_to_datetime(string_time)
    integer_time    # 1000 represented as an integer

This function is specifically useful when preprocessing UserALE logs for Segmentation as logs can sometimes be read in as strings
and Segmentation requires that they be formatted as either integers or ``datetime`` objects.

Get UUID
--------
The ``get_uuid`` function will take a UserALE log and output a universally unique identifier (UUID) for that log.  An example
usage of this function is shown below:

.. code:: python

    # A UserALE log
    log

    # Generate UUID
    uuid = distill.getUUID(log)

Similarly to the ``epoch_to_datetime`` function, the ``get_uuid`` function is particularly useful when preprocessing UserALE
logs in preparation for Segmentation.

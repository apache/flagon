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
Unit Testing with Pytest
========================
The distill package uses ``pytest`` as a means to validate our functions.  Below we describe how to run these tests:

Running Unit Tests
------------------
Install the package and development dependencies with ``uv``, then run ``pytest`` from the ``products/distill/`` directory:
::
    uv sync --all-groups
    uv run pytest

Test Coverage
-------------
``pytest-cov`` is included in the development dependencies. Coverage statistics on the distill package can be obtained with:
::
    uv run pytest --cov=distill

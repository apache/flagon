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
#

.PHONY: sync build publish_pytest test test_uv lint format

#########
# Setup #
#########

sync:
	@echo "Syncing dependencies with uv..."
	uv sync --all-groups
	@echo "Done."

build:
	@echo "Building distribution artifacts with uv..."
	uv build
	@echo "Done."

publish_pytest:
	@echo "Publishing to Test PyPI..."
	uv build
	uv publish --publish-url https://test.pypi.org/legacy/
	@echo "Done."

###########
# Testing #
###########

test:
	@echo "Running tests with uv..."
	uv run --group test pytest
	@echo "Done."

test_uv: test

##########################
# LINTING AND FORMATTING #
##########################
PYTHON_FILES=.
lint:
	@echo "Running linting with uv..."
	uv run --group lint mypy $(PYTHON_FILES)
	uv run --group lint black $(PYTHON_FILES) --check
	uv run --group lint ruff check $(PYTHON_FILES)
	@echo "Done."

format:
	@echo "Running formatting with uv..."
	uv run --group lint black $(PYTHON_FILES)
	uv run --group lint ruff check --select I --fix $(PYTHON_FILES)
	@echo "Done."


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

.PHONY: setup_precommit .cz.toml setup_commitizen commit publish_pytest test lint format

################### 
# PRECOMMIT HOOKS #
###################

setup_precommit:
	@echo "Setting up pre-commit hooks..."
	poetry run pre-commit install
	poetry run pre-commit autoupdate
	@echo "Done."

setup_commitizen:
	@echo "Installing commitizen for convential commits..."
	pip install commitizen
	cz init
	@echo "Done."

commit:
	@echo "Committing with commitizen..."
	poetry run pre-commit run --all-files
	poetry run cz commit
	@echo "Done."

publish_pytest:
	@echo "Publishing to Test PyPI..."
	poetry build
	poetry publish -r testpypi
	@echo "Done."

########### 
# Testing #
###########

test:
	@echo "Running tests..."
	poetry run pytest 
	@echo "Done."

test_all:
	@echo "Testing with python3 versions 3.8 and up..."
	@echo "This may take a while..."
	tox run-parallel

#########
# Setup #
#########
install_py_versions:
	@echo "Installing python 3.8 and up..."
ifeq ($(OS),Windows_NT)
	@echo "Windows detected..."
	@echo "Please run this in Windows Subsystem for Linux (WSL)"
else
	@echo "Unix detected"
	./install_py_versions.sh
endif

##########################
# LINTING AND FORMATTING #
##########################
PYTHON_FILES=.
lint:
	@echo "Running linting..."
	poetry run mypy $(PYTHON_FILES)
	poetry run black $(PYTHON_FILES) --check
	poetry run ruff .
	@echo "Done."

format:
	@echo "Running formatting..."
	poetry run black $(PYTHON_FILES) 
	poetry run ruff --select I --fix $(PYTHON_FILES)
	@echo "Done."

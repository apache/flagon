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


Apache Flagon Distill
=====================

.. image:: https://readthedocs.org/projects/incubator-flagon-distill/badge/?version=distill_toolkit_refactor
	:target: https://incubator-flagon-distill.readthedocs.io/en/distill_toolkit_refactor/?badge=stable
	:alt: Documentation Status

This project is a work in progress, prior to an official Apache Software Foundation release. Check back soon for important updates.

Please see our `readthedocs.org pages <https://incubator-flagon-distill.readthedocs.io/en/distill_toolkit_refactor/>`_ for documentation.

A contribution guide has been provided `here <http://flagon.incubator.apache.org/docs/contributing/>`_.

Installation
------------

To install and set up the Python project, Distill uses `Poetry <https://python-poetry.org/>`_, a dependency and package management tool. Poetry simplifies the management of project dependencies and virtual environments, ensuring consistent and reproducible builds.

Prerequisites
~~~~~~~~~~~~~

Before you begin, make sure you have the following prerequisites installed on your system:

- Python (>= 3.8)
- Poetry (>= 1.0)

You can check your Python version by running:

.. code-block:: bash

    python --version

This will return the version of Python installed on your system. If you do not have Python installed, you can download it from the `official website <https://www.python.org/downloads/>`_. However, we recommend using a Python version manager such as `pyenv`. You can refer to this guide for setting it up: `pyenv guide <https://realpython.com/intro-to-pyenv/>`_.

You can install Poetry a number of ways (see the `Poetry docs <https://python-poetry.org/docs/>`_ for all methods). We recommend installing one of the following two ways:

**Official Installer**:

*Linux, macOS, Windows (WSL)*

.. code-block:: bash

    curl -sSL https://install.python-poetry.org | python3 -

*Windows (Powershell)*

.. code-block:: bash

    (Invoke-WebRequest -Uri https://install.python-poetry.org -UseBasicParsing).Content | py -

**pipx**:

.. code-block:: bash

    pipx install poetry

The above two methods should minimize the chances of dependency conflicts with your system Python (global) installation. Some users have reported issues with Poetry using an incorrect Python environment instead of the project's local virtual environment when using regular pip method. If you run into issues, please refer to the official Poetry docs or Github for more in-depth installation instructions.


Installation Steps
~~~~~~~~~~~~~~~~~~

Follow these steps to set up and install the project:

1. Clone the repository:

    .. code-block:: bash

        git clone https://github.com/apache/flagon-distill.git


2. Navigate to the project directory:

    .. code-block:: bash

        cd flagon-distill

3. Use Poetry to install project dependencies and create a virtual environment:

    .. code-block:: bash

        poetry install
   
   This command reads the ``pyproject.toml`` file and installs all required packages into a dedicated virtual environment.


4. If you would like to run tests or make changes, install optional dependency groups.

    .. code-block:: bash
        poetry install --all-groups

5. Run the tests:
   
   You can now run the tests to make sure everything installed properly. For example:

    .. code-block:: bash
        make test
   
   Remember that you need to activate the virtual environment (step 4) each time you work on the project.

Updating Dependencies
~~~~~~~~~~~~~~~~~~~~~

To update project dependencies, you can use the following command:

.. code-block:: bash

   poetry update

This command updates the ``pyproject.toml`` file with the latest compatible versions of the packages.

Uninstalling
~~~~~~~~~~~~

To uninstall the project and its dependencies, simply deactivate the virtual environment (if activated) by typing:

.. code-block:: bash

   exit

This will exit the virtual environment. You can then safely delete the project directory.

By following these installation steps, you can easily set up and manage the Python project using Poetry. Enjoy coding!

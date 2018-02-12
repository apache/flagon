#!/bin/bash
#
# Licensed to the Apache Software Foundation (ASF) under one
# or more contributor license agreements.  See the NOTICE file
# distributed with this work for additional information
# regarding copyright ownership.  The ASF licenses this file
# to you under the Apache License, Version 2.0 (the
# "License"); you may not use this file except in compliance
# with the License.  You may obtain a copy of the License at
#
#  http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing,
# software distributed under the License is distributed on an
# "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
# KIND, either express or implied.  See the License for the
# specific language governing permissions and limitations
# under the License.
#

# set -e
# set -x

# Print out usage documentation.
help_usage() {
    echo "clone-and-configure-repos."
    echo "A simple utility to configure SENSSOFT repostories and prepare them for release."
    echo ""
    echo "Usage: $ clone-and-configure-repos.sh COMMAND"
    echo ""
    help_commands
    echo "e.g."
    echo "$ $0 useralejs"
}

# Print out commands.
help_commands() {
    echo "The commands are:"
    echo "    useralejs       Prepare for userale release"
    echo "    distill         Prepare for distill release"
    echo "    tap             Prepare for tap release"
    echo "    check           Check environment for release"
    echo ""
}

# Do the basics
# git clone -o apache-git https://git-wip-us.apache.org/repos/asf/incubator-senssoft-useralejs
# cd incubator-senssoft-useralejs

# git submodule init
# git submodule update --remote --merge --recursive

# .gitmodules sets the submodules up from GitHub. Replace the origin with Apache canonical
# git submodule foreach 'git remote add apache-git https://git-wip-us.apache.org/repos/asf/${name}'
# git submodule foreach 'git fetch apache-git'
# git submodule foreach 'git checkout master'
# git submodule foreach 'git branch --set-upstream-to apache-git/master master'
# git submodule foreach 'git reset --hard apache-git/master'
# git submodule foreach 'git remote remove origin'

# Final check we are up to date
# git pull
# git submodule update --remote --merge --recursive

# If no arguments were provided, display the usage.
if [[ "$#" == "0" ]]; then
    help_usage
    exit 1
fi

# Check for a command argument.
COMMAND=$1
if [[ -z $COMMAND ]] || \
    [[ $COMMAND != "check" && \
    $COMMAND != "useralejs" && \
    $COMMAND != "distill" && \
    $COMMAND != "tap" ]]; then \
    echo "Error: Specify a command."
    echo ""
    help_commands
    exit 1
fi

# Prepare for UserALE deployment
if [[ $COMMAND == "useralejs" ]]; then
    # Do the basics
	git clone -o apache-git https://git-wip-us.apache.org/repos/asf/incubator-senssoft-$COMMAND
	cd incubator-senssoft-$COMMAND

	# And also the location for publishing RC artifacts
	svn --non-interactive co --depth=immediates https://dist.apache.org/repos/dist/release/incubator/senssoft ~/tmp/apache-dist-release-incubator-senssoft-$COMMAND
	svn --non-interactive co --depth=immediates https://dist.apache.org/repos/dist/dev/incubator/senssoft ~/tmp/apache-dist-dev-incubator-senssoft-$COMMAND
	echo "export APACHE_DIST_SVN_DIR=$HOME/tmp/apache-dist-dev-incubator-senssoft-$COMMAND" >> ~/.bash_profile
	exit 0
fi

# Prepare for Distill deployment
if [[ $COMMAND == "distill" ]]; then
    echo "Error: Unsupported distill build."
    exit 1
fi

# Prepare for Tap deployment
if [[ $COMMAND == "tap" ]]; then
    echo "Error: Unsupported tap build."
    exit 1
fi

# Run production build process checks.
if [[ $COMMAND == "check" ]]; then
    echo "Error: Unsupported check build."
    exit 1
fi

exit 0
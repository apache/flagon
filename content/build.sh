#!/bin/bash
# Licensed to the Apache Software Foundation (ASF) under one
# or more contributor license agreements.  See the NOTICE file
# distributed with this work for additional information
# regarding copyright ownership.  The ASF licenses this file
# to you under the Apache License, Version 2.0 (the
# "License"); you may not use this file except in compliance
# with the License.  You may obtain a copy of the License at
#
#   http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing,
# software distributed under the License is distributed on an
# "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
# KIND, either express or implied.  See the License for the
# specific language governing permissions and limitations
# under the License.


set -e  # Exit immediately if any command fails

# Step 1: Install Ruby dependencies (if Ruby is present)
if command -v ruby &>/dev/null; then
  echo "Installing Ruby dependencies..."
  gem install bundler
  bundle install
else
  echo "Ruby is not installed, skipping Ruby setup."
fi

# Step 2: Install Node.js dependencies (if npm is present)
if command -v npm &>/dev/null; then
  echo "Installing Node.js dependencies..."
  npm install -g
else
  echo "npm is not installed, skipping Node.js setup."
fi

# Step 3: Build the Jekyll site
echo "Building the Jekyll site..."
bundle exec jekyll build

echo "Build completed successfully!"

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

FROM phusion/passenger-full:3.0.7
LABEL org.opencontainers.image.authors="poorejc@apache.org"

RUN bash -lc 'rvm list'
RUN bash -lc 'rvm --default use ruby-3.2.5'

# Cache bundle
COPY Gemfile* /tmp/
WORKDIR /tmp
RUN bundle install

# Install npm modules
COPY package.json /tmp/
WORKDIR /tmp
RUN npm install -g

# Add src code and build script
RUN mkdir /app
WORKDIR /app
COPY . /app

# Make the build script executable
RUN chmod +x /app/build.sh

# Run the build script
RUN /app/build.sh

WORKDIR /app/_site

EXPOSE 8000

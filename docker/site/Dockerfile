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

FROM ruby
MAINTAINER Michelle Beard <msbeard@apache.org>

# Install system wide dependencies
RUN apt-get -yqq update && apt-get -yqq install \
	curl \
	sudo

# Set the work directory
RUN mkdir -p /usr/src
WORKDIR /usr/src

# Install git
RUN sudo -E apt-get -yqq install \
  git

# Clone Apache SensSoft Site
RUN git clone -b master https://github.com/apache/incubator-senssoft.git
WORKDIR /usr/src/incubator-senssoft/site/_site

# Update data-url to send to logstash
RUN sed -i 's/data-url=\"\"/data-url="http:\/\/localhost:8100"/' index.html
RUN sed -i 's/noSend\: true/noSend\: false/' index.html

# Install system wide dependencies
RUN apt-get -yqq update && apt-get -yqq install \
	python

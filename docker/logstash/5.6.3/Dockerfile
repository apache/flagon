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

FROM docker.elastic.co/logstash/logstash:5.6.3
MAINTAINER Michelle Beard <msbeard@apache.org>

RUN mkdir /usr/share/logstash/templates
RUN rm -f /usr/share/logstash/pipeline/logstash.conf

RUN logstash-plugin remove x-pack

# Known issue: https://github.com/elastic/logstash-docker/issues/45
RUN sed -i '/xpack/d' /usr/share/logstash/config/logstash.yml

# Copy Configuration files over
COPY config/logstash-userale.conf /usr/share/logstash/pipeline/logstash-userale.conf
COPY templates/userale.json /usr/share/logstash/templates/userale.json

EXPOSE 8100
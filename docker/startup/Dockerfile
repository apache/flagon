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

FROM ubuntu:latest
MAINTAINER Michelle Beard <msbeard@apache.org>

RUN apt-get update && apt-get install -y wget curl && apt-get clean

RUN wget https://github.com/jwilder/dockerize/releases/download/v0.1.0/dockerize-linux-amd64-v0.1.0.tar.gz

RUN tar -C /usr/local/bin -xzvf dockerize-linux-amd64-v0.1.0.tar.gz

# Copy Files Over
COPY ./entrypoint.sh /opt/entrypoint.sh

# Make executable
RUN chmod +x /opt/*.sh

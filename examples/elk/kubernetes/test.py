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

from elasticsearch_dsl import connections
from elasticsearch_dsl import Search
from elasticsearch_dsl import Q
import os

flagonClient = connections.create_connection('flagonTest', hosts=['https://localhost:9200'], basic_auth=("elastic", os.environ['ES_PASSWORD']), verify_certs=False)
AleS = Search(using='flagonTest', index="userale")
qLogType = Q("match", logType="raw") | Q("match", logType="custom")

elk_search = AleS \
    .query(qLogType) \
    .extra(track_total_hits=True) #breaks return limit of 10000 hits

elk_response = elk_search.scan()
for hit in elk_response:
    print(hit)
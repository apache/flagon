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
 
from flask import Flask
from elasticsearch_dsl.connections import connections

# Initialize Flask instance
app = Flask (__name__)

# Load Configurations
app.config.from_pyfile('config.cfg')

# Unpack Elasticsearch configuration and create elasticsearch connection
host = app.config ['ES_HOST']
port = app.config ['ES_PORT']
http_auth = app.config ['HTTP_AUTH']
use_ssl = app.config ['USE_SSL']
verify_certs = app.config ['VERIFY_CERTS']
ca_certs = app.config ['CA_CERTS']
client_cert = app.config ['CLIENT_CERT']
client_key = app.config ['CLIENT_KEY']
timeout = app.config ['TIMEOUT']

# Initialize Elasticsearch instance
es = connections.create_connection (hosts = [host],
									port = port,
									http_auth = http_auth,
									use_ssl = use_ssl,
									verify_certs = verify_certs,
									ca_certs = ca_certs,
									client_cert = client_cert,
									client_key = client_key,
									timeout=timeout)
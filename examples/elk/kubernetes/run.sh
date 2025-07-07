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

kubectl create -f https://download.elastic.co/downloads/eck/2.11.0/crds.yaml
kubectl apply -f https://download.elastic.co/downloads/eck/2.11.0/operator.yaml
kubectl apply -f resources/logstash-auth.yaml
kubectl apply -f resources/elastic.yaml
kubectl apply -f resources/logstash.yaml
sleep 10
kubectl wait --for=condition=Ready pod/quickstart-es-default-0 --timeout=60s
kubectl wait --for=condition=Ready pod/quickstart-ls-0 --timeout=60s
kubectl port-forward service/quickstart-es-http 9200 >/dev/null 2>&1 &
kubectl port-forward service/quickstart-ls-http 8100 >/dev/null 2>&1 &
export ES_PASSWORD=$(kubectl get secret quickstart-es-elastic-user -o go-template='{{.data.elastic | base64decode}}')
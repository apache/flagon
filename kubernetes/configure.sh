#!/usr/bin/env bash
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

# Print out usage documentation.
help_usage() {
    echo "configure.sh"
    echo "A simple utility to deploy Apache SensSoft Kubernetes build."
    echo "Not meant to be used in production."
    echo ""
    echo "Usage: $ configure.sh COMMAND [OPT]"
    echo ""
    help_commands
    echo "e.g."
    echo "$ $0 deploy all"
}

# Print out commands.
help_commands() {
    echo "The commands are:"
    echo "    status                View status of Kubernetes deployment"
    echo "    deploy elk            Deploy ELK stack into Kubernetes cluster"
    echo "    deploy elasticsearch  Deploy Elasticsearch Kubernetes"
    echo "    deploy logstash       Deploy Logstash Kubernetes"
    echo "    deploy kibana         Deploy Kibana Kubernetes"
    echo "    purge elk             Purge all ELK Kubernetes artifacts"
    echo "    purge elasticsearch   Purge all Elasticsearch Kubernetes artifacts"
    echo "    purge logstash        Purge all Logstash Kubernetes artifacts"
    echo "    purge kibana          Purge all Kibana Kubernetes artifacts"
    echo "    check                 Check environment for release"
    echo "    shutdown              Shutdown Kubernetes cluster"
    echo "    start                 Startup minikube"
    echo "    stop                  Stop minikube"
    echo "    delete                Delete minikube"
    echo ""
}

# If no arguments were provided, display the usage.
if [[ "$#" == "0" ]]; then
    help_usage
    exit 1
fi

# Check for a command argument.
COMMAND=$1
COMMAND_OPT=$2

if [[ -z $COMMAND ]] || \
    [[ $COMMAND != "status" && \
    $COMMAND != "deploy" && \
    $COMMAND != "check" && \
    $COMMAND != "shutdown" && \
    $COMMAND != "purge" && \
    $COMMAND != "provision" && \
    $COMMAND != "stop" && \
    $COMMAND != "delete" ]]; then \
    echo "Error: Specify a command."
    echo ""
    help_commands
    exit 1
fi

# Start minikube w/ hyperkit
if [[ $COMMAND == "provision" ]]; then
    minikube start --cpus 2 --memory 5120 --vm-driver=virtualbox
    # this for loop waits until kubectl can access the api server that Minikube has created
    for i in {1..150}; do # timeout for 5 minutes
       ./kubectl get po &> /dev/null
       if [ $? -ne 1 ]; then
          break
      fi
      sleep 2
    done
	exit 0
fi

# Stop minikube w/ hyperkit
if [[ $COMMAND == "stop" ]]; then
    minikube stop
    eval $(minikube docker-env -u)
	exit 0
fi

# Start minikube w/ hyperkit
if [[ $COMMAND == "delete" ]]; then
    minikube delete
	exit 0
fi

# Fetch status of entire Kubernets SensSoft namespace
if [[ $COMMAND == "status" ]]; then
    kubectl get svc,deployment,pods -l component=elk
	exit 0
fi

function elasticsearch() {
    echo "Elasticsearch deployment"
    kubectl create -f elasticsearch/es-master-svc.yaml
    kubectl create -f elasticsearch/es-client-svc.yaml
    kubectl create -f elasticsearch/es-master.yaml
    kubectl rollout status -f elasticsearch/es-master.yaml
    kubectl create -f elasticsearch/es-client.yaml
    kubectl rollout status -f elasticsearch/es-client.yaml
    kubectl create -f elasticsearch/es-data.yaml
    kubectl rollout status -f elasticsearch/es-data.yaml
}

function logstash() {
    echo "Logstash deployment"
	kubectl create -f logstash/logstash-svc.yaml
	kubectl create -f logstash/logstash-client.yaml
	kubectl create -f logstash/logstash.yaml
	kubectl rollout status -f logstash/logstash.yaml
}

function kibana() {
    echo "Kibana deployment"
	kubectl create -f kibana/kibana-svc.yaml
	kubectl create -f kibana/kibana.yaml
	kubectl rollout status -f kibana/kibana.yaml
}

if [[ $COMMAND == "deploy" && \
    $COMMAND_OPT == "elasticsearch" ]]; then
    elasticsearch
    exit 0
fi

if [[ $COMMAND == "deploy" && \
    $COMMAND_OPT == "logstash" ]]; then
    logstash
    exit 0
fi

if [[ $COMMAND == "deploy" && \
    $COMMAND_OPT == "kibana" ]]; then
    kibana
    exit 0
fi

if [[ $COMMAND == "deploy" && \
    $COMMAND_OPT == "elk" ]]; then
    elasticsearch
    logstash
    kibana
    exit 0
fi

# Delete entire Elasticsearch Kubernetes artifacts
if [[ $COMMAND == 'purge' && \
    $COMMAND_OPT == 'elasticsearch' ]]; then
    for f in elasticsearch/*.yaml
    do
        kubectl delete -f $f
    done
fi

# Delete entire Logstash Kubernetes artifacts
if [[ $COMMAND == 'purge' && \
    $COMMAND_OPT == 'logstash' ]]; then
    for f in logstash/*.yaml
    do
        kubectl delete -f $f
    done
fi

# Delete entire Kibana Kubernetes artifacts
if [[ $COMMAND == 'purge' && \
    $COMMAND_OPT == 'kibana' ]]; then
    for f in kibana/*.yaml
    do
        kubectl delete -f $f
    done
fi

# Delete entire Kubernetes SensSoft namespace
if [[ $COMMAND == 'purge' && \
    $COMMAND_OPT == 'elk' ]]; then
	for f in elasticsearch/*.yaml
    do
        kubectl delete -f $f
    done
    for f in logstash/*.yaml
    do
        kubectl delete -f $f
    done
    for f in kibana/*.yaml
    do
        kubectl delete -f $f
    done
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
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
    echo ""
    echo "Usage: $ configure.sh COMMAND"
    echo ""
    help_commands
    echo "e.g."
    echo "$ $0 deploy"
}

# Print out commands.
help_commands() {
    echo "The commands are:"
    echo "    status            View status of Kubernetes deployment"
    echo "    deploy            Deploy SensSoft stack into Kubernetes cluster"
    echo "    elasticsearch     Deploy Elasticsearch Kubernetes stack"
    echo "    logstash          Deploy Logstash Kubernetes stack"
    echo "    kibana            Deploy Kibana Kubernetes stack"
    echo "    elk               Deploy ELK Kubernetes stack"
    echo "    check             Check environment for release"
    echo "    shutdown          Shutdown Kubernetes cluster"
    echo "    purge             Purge all Kubernetes artifacts"
    echo "    start             Startup minikube"
    echo "    stop              Stop minikube"
    echo "    delete            Delete minikube"
    echo ""
}

# If no arguments were provided, display the usage.
if [[ "$#" == "0" ]]; then
    help_usage
    exit 1
fi

# Check for a command argument.
COMMAND=$1
if [[ -z $COMMAND ]] || \
    [[ $COMMAND != "status" && \
    $COMMAND != "deploy" && \
    $COMMAND != "elasticsearch" && \
    $COMMAND != "logstash" && \
    $COMMAND != "kibana" && \
    $COMMAND != "elk" && \
    $COMMAND != "check" && \
    $COMMAND != "shutdown" && \
    $COMMAND != "purge" && \
    $COMMAND != "start" && \
    $COMMAND != "stop" && \
    $COMMAND != "delete" ]]; then \
    echo "Error: Specify a command."
    echo ""
    help_commands
    exit 1
fi

# Fetch status of entire Kubernets SensSoft namespace
if [[ $COMMAND == "status" ]]; then
    kubectl get svc,deployment,pods -l component=elasticsearch
	exit 0
fi

# Deploy entire Kubernets SensSoft namespace
if [[ $COMMAND == "status" ]]; then
    kubectl create -f es-discovery-svc.yaml
    kubectl create -f es-svc.yaml
    kubectl create -f es-master.yaml
    kubectl rollout status -f es-master.yaml
    kubectl create -f es-client.yaml
    kubectl rollout status -f es-client.yaml
    kubectl create -f es-data.yaml
    kubectl rollout status -f es-data.yaml
	exit 0
fi

# Delete entire Kubernets SensSoft namespace
if [[ $COMMAND == "purge" ]]; then
    kubectl delete -f es-data.yaml
    kubectl delete -f es-client.yaml
    kubectl delete -f es-master.yaml
    kubectl delete -f es-svc.yaml
    kubectl delete -f es-discovery-svc.yaml
	exit 0
fi

# Start minikube w/ hyperkit
if [[ $COMMAND == "start" ]]; then
    minikube start --vm-driver=hyperkit
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
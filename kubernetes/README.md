# Example Kubernetes deployment

This script and accompanying yaml files provide an example ELK stack kubernetes deployment. This is intended to be a starting point for deploying a userale logging end point. 

Prerequisites: A bash enviroment and Kubernetes running with at least 4 GB memory and 4 CPU cores.

Use the `run.sh` script to deploy the stack.

`test.py` is included as a utility to verify that logs are correctly posted to elastic locally.
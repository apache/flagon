How to Build SensSoft Docker Containers
---------------------------------------

1. Install [``Docker``](http://docker.com) on your machine. Require Docker 1.7 and above.

1. Install ``docker-compose`` in an virtual environment. 
   Full instructions can be found [``here``](https://docs.docker.com/compose/install/).
   
   ```bash
   $ python3 -m venv env
   $ source env/bin/activate
   $ pip install -r requirements.txt
   ```

1. Before launching the Docker containers, ensure your ``vm_max_map_count`` 
   kernel setting is set to at least 262144.
   Visit [``Running Elasticsearch in Production mode``](https://www.elastic.co/guide/en/elasticsearch/reference/5.5/docker.html#docker-cli-run-prod-mode) for OS specific instructions.
   
   ```bash
   # Example for Linux systems
   $ sysctl -w vm.max_map_count=262144
   ```

1. Start Elasticsearch cluster:
    
    ```bash
    $ docker-compose -f docker-compose.cluster.yaml up -d --scale elasticsearch=3 elasticsearch
    $ docker-compose -f docker-compose.cluster.yaml up -d loadbalancer
    ```
    
    The loadbalancer node exposes port 9200 on localhost and is the only node 
    that has HTTP enabled. Services such as Kibana and Logstash connect to the 
    loadbalancer node directly. Loadbalancer accepts requests from Kibana and Logstash 
    and balances them across the elasticsearch worker nodes. The elasticsearch 
    worker nodes communicate to each other and the loadbalancer via TCP on port 9300. 

    <aside class="warning">
    Starting an elasticsearch cluster is not recommended on a single server. This
    is just for demonstration purposes only. Please refer to our [Kubernetes] guide to 
    deploy an Elasticsearch cluster.
    </aside>

1. Confirm cluster state:
   ```bash
   $ curl -XGET http://localhost:9200/_cluster/health?pretty
    {
     "cluster_name" : "SensSoft",
     "status" : "green",
     "timed_out" : false,
     "number_of_nodes" : 4,
     "number_of_data_nodes" : 3,
     "active_primary_shards" : 0,
     "active_shards" : 0,
     "relocating_shards" : 0,
     "initializing_shards" : 0,
     "unassigned_shards" : 0,
     "delayed_unassigned_shards" : 0,
     "number_of_pending_tasks" : 0,
     "number_of_in_flight_fetch" : 0,
     "task_max_waiting_in_queue_millis" : 0,
     "active_shards_percent_as_number" : 100.0
   }
   ```
   Confirm that the `number_of_nodes` is 4 and `number_of_data_nodes` is 3.
 
1. Follow remaining instructions in README.md, starting at #6.

© Copyright 2016 The Charles Stark Draper Laboratory, Inc. All rights reserved.

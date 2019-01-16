How to Build SensSoft Docker Containers
=======================================
*Last Tested (on macOS Mojave) 15 JAN 2019*

Prerequisites
-------------

1. Install [``Docker``](http://docker.com) on your machine. Requires Docker 1.7 and above.

1. Install docker-compose. Full instructions can be found [``here``](https://docs.docker.com/compose/install/). 
   If you install Docker through the [``Desktop bundle``](https://www.docker.com/products/docker-desktop), docker-compose is included.
   
Single Node Deployment
----------------------

The single node deployment steps below will build a single-node logging server on a single
machine. This is suitable for demonstrations and very limited data collections. Please 
refer to our [``Kubernetes``](https://github.com/apache/incubator-senssoft/tree/master/kubernetes) guide for deployments that scale to your needs. In some cases, 
you may be able to use single node containers within scaling services (e.g., AWS EBS), but this 
requires special configuration. Please reach out to us at [our dev list](mailto:dev@senssoft.incubator.apache.org) for recommendations.

1. Create docker-machine instance. 
   **Note**: If using Docker Desktop bundle, there is a known bug in 
   the bundled version of virtualbox that will prevent a successful docker-machine creation.
   Before installation, check that virtualbox version is at least 5.2. [``Reinstall virtualbox``](https://www.virtualbox.org/wiki/Downloads), if needed.
   
   ```bash
   $ docker-machine create --virtualbox-memory 3072 --virtualbox-cpu-count 2 senssoft
   ```
    
1. Before launching the Docker containers, ensure your ``vm_max_map_count``
   kernel setting is set to at least 262144.
   Visit [``Running Elasticsearch in Production mode``](https://www.elastic.co/guide/en/elasticsearch/reference/5.5/docker.html#docker-cli-run-prod-mode) for OS specific instructions.

   ```bash
   # Example for Linux systems
   $ docker-machine ssh senssoft sudo sysctl -w vm.max_map_count=262144
   ```

1. Create externel docker network to enable system monitoring. Only enable if running 
   the Elasticsearch 6.5.4 configuration (single and cluster mode)
   
   ```bash
   $ docker network create esnet
   ```

1. Start Elasticsearch 6.2.2 (Deprecated) or 6.5.4 (Recommended) Give Elasticsearch about 1-2 minutes to start before confirming its state.
   
   ```bash
   $ docker-compose -f docker-compose.single-6.2.2.yml up -d elasticsearch
   
   or

   $ docker-compose up -d elasticsearch
   ```

1. Confirm state:
   ```bash
   # if senssoft vm is remote
   $ docker-machine ssh senssoft curl -XGET http://localhost:9200/_cluster/health?pretty
   # if senssoft virtual machine is running on your local machine, no need for ssh, instead:
   $ curl -XGET http://localhost:9200/_cluster/health?pretty
   #output should look like this:
      "cluster_name" : "SensSoft",
      "status" : "yellow",
      "timed_out" : false,
      "number_of_nodes" : 1,
      "number_of_data_nodes" : 1,
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
   ```
 
1. Launch logging server. Give Logstash about 2 minutes to start before confirming 
   its state.
  
   ```bash
   $ docker-compose up -d logstash
   # if senssoft vm is remote
   $ docker-machine ssh senssoft curl -XGET http://localhost:8100
   # if senssoft virtual machine is running on your local machine, no need for ssh, instead:
   $ curl -XGET http://localhost:8100
   #ouput should look like this:
      ok
   ```
   
1. Before Kibana can be used, we will need to generate some data. We have already 
   provided an example instrumented website to assist.
   
   ```bash
   $ docker-compose up -d site
   # for remote users, forwards port to localhost
   $ ssh docker@$(docker-machine ip senssoft) -L 8080:localhost:8080
   ```

   Visit `http://localhost:8080` and you will see Apache SensSoft's home page.
   
1. Launch Kibana. Give Kibana about 2-5 minutes to start before accessing
   `http://localhost:5601`. 
   
   ```bash
   $ docker-compose up -d kibana
   # for remote users, forwards port to localhost
   $ ssh docker@$(docker-machine ip senssoft) -L 5601:localhost:5601
   ```

1. Register an index in Kibana to see the logs:

   Goto: Management -> Index Patterns and enter `userale` in the Index pattern box.
   Choose `clientTime` in the drop down `Time Filter field name` field.
  
   ![alt text][configure_index]
   
1. Load example Dashboard and Visualizations under docker/kibana/.

   Goto: Management -> Saved Objects and select the `Import` button. Import the
   `Apache SensSoft Visualizations.json`, `Apache SensSoft Page Usage Dashboard.json`, `Apache SensSoft User Access Dashboard.json` and `Drill-Down Search.json` files from the "Saved Objects" folder in the kibana directory.

   ![alt text][management]

   Confirm index conflicts if message appears. 
   
   ![alt text][confirmation]
   
   Once that is complete, navigate to the `Dashboard` view in Kibana and click the
   `Apache SensSoft Page Usage Dashboard` object. 

   ![alt text][dashboard]
   
1. To see container health metrics, launch Metricbeat:

   ```bash
   $ docker-compose up -d metricbeat
   ```
   
   Once the container is running, metricbeat dashboards will automatically load in Kibana. Navigate to the Container `Dashboard`.
   
   ![alt text][metrics]
   
1. To stop all containers.
    ```bash
    $ docker-compose stop
    ```
    
 1. To kill the senssoft machine.
    ```bash
    $ docker-machine rm senssoft
    ```
    
If running on a single machine, on reboot or restart your senssoft machine is available, but 
in a "stopped" state. You'll need to restart the machine, then you'll need to use docker-
compose up commands above to restart containers.

 1. Restart the senssoft machine.
    ```bash
    $ docker-machine start senssoft
    $ docker-machine ls #confirm state
    #output should look like this:
    NAME     ACTIVE   DRIVER       STATE     URL                       SWARM   DOCKER     ERRORS
    senssoft   -      virtualbox   Running   tcp://192.168.99.100:2376         v18.09.0   
    ```

Multi-Node Deployment on a Single Machine
-----------------------------------------

<aside class="warning">
    Starting an elasticsearch cluster is not recommended on a single server. This
    is just for demonstration purposes only. Please refer to our [Kubernetes] guide to
    deploy an Elasticsearch cluster for an enterprise scale logging capability.
    </aside>

1. Create docker-machine instance
   ```bash
   docker-machine create --virtualbox-memory 2048 --virtualbox-cpu-count 2 senssoft
   ```

1. Before launching the Docker containers, ensure your ``vm_max_map_count``
   kernel setting is set to at least 262144.
   Visit [``Running Elasticsearch in Production mode``](https://www.elastic.co/guide/en/elasticsearch/reference/5.5/docker.html#docker-cli-run-prod-mode) for OS specific instructions.

   ```bash
   # Example for Linux systems
   $ docker-machine ssh senssoft sudo sysctl -w vm.max_map_count=262144
   ```

1. Create externel docker network to enable system monitoring. Only enable if running 
   the Elasticsearch 6.2.2 configuration (single and cluster mode)
   
   ```bash
   $ docker network create esnet
   ```

1. Start Elasticsearch cluster:

    ```bash
    $ docker-compose -f docker-compose.cluster.yml up -d --scale elasticsearch=3 elasticsearch
    $ docker-compose -f docker-compose.cluster.yml up -d loadbalancer
    ```

    The loadbalancer node exposes port 9200 on localhost and is the only node
    that has HTTP enabled. Services such as Kibana and Logstash connect to the
    loadbalancer node directly. Loadbalancer accepts requests from Kibana and Logstash
    and balances them across the elasticsearch worker nodes. The elasticsearch
    worker nodes communicate to each other and the loadbalancer via TCP on port 9300.

1. Confirm cluster state:
   ```bash
   $ docker-machine ssh senssoft curl -XGET http://localhost:9200/_cluster/health\?pretty
   # if senssoft virtual machine is running on your local machine, no need for ssh, instead:
   $ curl -XGET http://localhost:9200/_cluster/health?pretty
   #output should look like this:
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

1. Follow remaining instructions in [Single Node Deployment] starting at #6.
   
1. To stop all containers.
    ```bash
    $ docker-compose stop
    ```
    
 1. To kill the "senssoft" machine.
    ```bash
    $ docker-machine rm senssoft
    ```
    
If running on a single machine, on reboot or restart your senssoft machine is available, but 
in a "stopped" state. You'll need to restart the machine, then you'll need to use docker-
compose up commands above to restart containers.

 1. Restart the senssoft machine.
    ```bash
    $ docker-machine start senssoft
    $ docker-machine ls #confirm state
    #output should look like this:
    NAME     ACTIVE   DRIVER       STATE     URL                       SWARM   DOCKER     ERRORS
    senssoft   -      virtualbox   Running   tcp://192.168.99.100:2376         v18.09.0   
    ```

Having Issues?
--------------
1. Check out the docker-compose logs for the service(s) that are having issues.

   ```bash
   $ docker-compose ps 
   ```

1. If you find containers failing, you may have duplicate or dangling images! 
   
   This can happen if you've played around with multiple machines and builds of the containers 
   on the same machine. Visit [``this excellent how to guide for removing images, containers, 
   and volumes``](https://www.digitalocean.com/community/tutorials/how-to-remove-docker-images-containers-and-volumes). Remove any duplicate images and rebuild the containers.

1. Make sure to send us the docker-compose logs to help diagnose your issues please!

   ```bash
   $ docker-compose logs > err.dump 
   ```
   
    You can attach logs directly to tickets on our [``Apache Jira board``](https://issues.apache.org/jira/issues/?jql=project+%3D+SENSSOFT+AND+component+%3D+builds)
   
1. Still having issues? Reach out to us at at [our dev list](mailto:dev@senssoft.incubator.apache.org).

[configure_index]: ./docs/images/configure_index.png "Configure Kibana index"
[confirmation]: ./docs/images/confirmation.png "Confirm index pattern conflicts"
[dashboard]: ./docs/images/dashboard.png "Apache Senssoft Page Usage Dashboard"
[management]: ./docs/images/management.png "Kibana management console"
[metrics]: ./docs/images/DockerBeats_Dashboard.png "Metricbeat Dashboard"

Licensing
--------------

Apache SensSoft is provided under Apache License version 2.0. See LICENSE (at Master) file for more 
details. "Software as a Sensor" is Copyright © 2016 The Charles Stark Draper Laboratory, Inc. All rights reserved.

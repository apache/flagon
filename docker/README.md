Building Apache Flagon Docker Containers
===================================
*Last Tested: 04 MAR 2021 using Docker Engine v20.10.2, Compose v1.27.4, Machine v0.16.1*

## This single-node deployment is meant for demonstrations and very limited data collections with [Apache Flagon UserALE.js](https://github.com/apache/incubator-flagon-useralejs).

Configurations in this repository can be used in complimentary version of appropriately scaled Elastic clusters. 
Other [projects](https://github.com/deviantony/docker-elk) or service providers (e.g., AWS) provide excellent guidance for deploying production clusters.

Prerequisites
-------------

1. ``Docker`` can be found [here](http://docker.com). 
   Alternatively, you can build this deployment in [Docker Desktop](https://www.docker.com/products/docker-desktop) on either OSX or Windows OS.

1. ``docker-compose`` can be found [here](https://docs.docker.com/compose/install/). Requires Docker Compose 1.23 and above.
   If you install Docker through [Docker Desktop](https://www.docker.com/products/docker-desktop), docker-compose is included.
   
1. ``docker-machine`` can be found [here](https://github.com/docker/machine/releases/). 
   Note that ``docker-machine`` was removed from [Docker Desktop](https://www.docker.com/products/docker-desktop) in ver 2.1.4. If you are running later versions you will need to install [Docker/Machine](https://github.com/docker/machine/releases/) manually.
   Alternatively, you can use ``virtualbox`` or other methods of provisioning vms to run docker containers in. The instructions assume you are running ``docker-machine``. 
   
Single Node Example Container
-----------------------------

The single-node deployment steps below will build a single-node logging server on a single
machine. This is suitable for demonstrations and very limited data collections.

1. Create docker-machine instance. 
   **Note**: If using Docker Desktop bundle for OSX, there is a known bug in 
   the bundled version of virtualbox that will prevent a successful docker-machine creation.
   Before installation, check that virtualbox version is at least 5.2. [``Reinstall virtualbox``](https://www.virtualbox.org/wiki/Downloads), if needed.
   **Note**: If using Docker Desktop bundle for Windows 10, you will need to use ``Hyper-V`` instead of virtual box. Refer to [Docker's guide](https://docs.docker.com/machine/drivers/hyper-v/) on creating vms with Hyper-V.
   ```bash
   $ docker-machine create --virtualbox-memory 3072 --virtualbox-cpu-count 2 flagon
   # Windows 10 users will need to use Hyper-V: 
   > docker-machine create -d hyperv --hyperv-virtual-switch "Primary Virtual Switch" --hyperv-memory 3072 --hyperv-cpu-count 2 flagon
   ```
    
1. Before launching the Docker containers, ensure your ``vm_max_map_count``
   kernel setting is set to at least 262144.
   Visit [``Running Elasticsearch in Production mode``](https://www.elastic.co/guide/en/elasticsearch/reference/5.5/docker.html#docker-cli-run-prod-mode) for OS specific instructions.

   ```bash
   # Example for Linux systems
   $ docker-machine ssh flagon sudo sysctl -w vm.max_map_count=262144
   ```

1. Create externel docker network to enable system monitoring. Only enable if running 
   Elasticsearch >6.5.4 configuration (single and cluster mode)
   
   ```bash
   $ docker network create esnet
   ```

1. Start Elasticsearch 6.6.2 or 6.8.2 (Recommended) Give Elasticsearch about 1-2 minutes to start before confirming its state.
   
   ```bash
   #start Elasticsearch v6.6.2 (Deprecated)
   $ docker-compose -f docker-compose-6.6.2.yml up -d elasticsearch
   
   or
   
   #start Elasticsearch v6.8.2 (Recommended)
   $ docker-compose up -d elasticsearch
   ```

1. Confirm state:
   ```bash
   # if Flagon vm is remote
   $ docker-machine ssh flagon curl -XGET http://localhost:9200/_cluster/health?pretty
   # if Flagon virtual machine is running on your local machine, no need for ssh, instead:
   $ curl -XGET http://localhost:9200/_cluster/health?pretty
   #output should look like this:
      "cluster_name" : "Flagon",
      "status" : "green",
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
   # if Flagon vm is remote
   $ docker-machine ssh flagon curl -XGET http://localhost:8100
   # if Flagon virtual machine is running on your local machine, no need for ssh, instead:
   $ curl -XGET http://localhost:8100
   #ouput should look like this:
      ok
   ```
   
1. Before Kibana can be used, we will need to generate some data. We provide an example instrumented website to assist. 
   
   ```bash
   $ docker-compose up -d site
   # for remote users, forwards port to localhost
   $ ssh docker@$(docker-machine ip flagon) -L 8080:localhost:8080
   ```
   
   Visit `http://localhost:8080` and you will see Apache Flagon's home page.
   
   Note that the `userale` index uses dynamic mapping configurations for many fields. This means that if no valid data exists for 
   certain fields in the logs you collect at this step, Kibana won't know to map these fields to data types (e.g., string, text, 
   boolean, etc.). This can prevent certain dashboards and visualizations from appropriately displaying log aggregations. It is worth 
   1-2 mins collecting some UserALE.js data in whichever way best emulates your use-case: from the same website, the [``UserALE.js example utilty``](https://github.com/apache/incubator-flagon-useralejs/tree/FLAGON-192/example), or the [``UserALE.js Web Extension``](https://github.com/apache/incubator-flagon-useralejs/tree/FLAGON-192/src/UserALEWebExtension). If you run into issues with data fields or visualizations, see the `Having Issues?` section below.

1. Launch Kibana. Give Kibana about 2-5 minutes to start before accessing
   `http://localhost:5601`. 
   
   ```bash
   $ docker-compose up -d kibana
   # for remote users, forwards port to localhost
   $ ssh docker@$(docker-machine ip flagon) -L 5601:localhost:5601
   ```

1. Register an index in Kibana to see the logs:

   Goto: Management -> Index Patterns and enter `userale` in the Index pattern box.
   Choose `clientTime` in the drop down `Time Filter field name` field. Alternatively, to explore our "interval" logs, select `@timestamp`.
  
   ![alt text][configure_index]
   
1. Load example Dashboard and Visualizations under docker/kibana/.

   Goto: Management -> Saved Objects and select the `Import` button. Import the
   `Apache Flagon Visualizations.json`, `Drill-Down Search.json`, `Apache Flagon Page Usage Dashboard.json`, and `Apache Flagon User Access Dashboard.json` files from the "Saved Objects" folder in the kibana directory.

   ![alt text][management]

   Set `userale` index if Kibana detects conflicts when you load visualizations and searches. 
   
   ![alt text][viz_import]
   
   Once that is complete, navigate to the `Dashboard` view in Kibana and click the
   `Apache Flagon Page Usage Dashboard` object. 

   ![alt text][dashboard]
   
1. To see container performance metrics, launch Metricbeat:

   ```bash
   $ docker-compose up -d metricbeat
   ```
   
   Once the container is running, metricbeat dashboards will automatically load in Kibana. Navigate to the `Container Dashboard`.
   
   ![alt text][metrics]
   
   Note that metricbeat and logging with UserALE.js will strain the single-node container. We recommend that metricbeat be started only for demonstration purposes.
   
1. To stop all containers.
    ```bash
    $ docker-compose stop
    ```
    
 1. To kill the Flagon machine.
    ```bash
    $ docker-machine stop flagon
    ```
    
 1. To remove the Flagon machine.
    ```bash
    $ docker-machine rm flagon
    ```
    
If running on a single machine, on reboot or restart your Flagon machine is available, but 
in a "stopped" state. You'll need to restart the machine, then you'll need to use docker-
compose up commands above to restart containers.

 1. Restart the Flagon machine.
    ```bash
    $ docker-machine start flagon
    $ docker-machine ls #confirm state
    #output should look like this:
    NAME     ACTIVE   DRIVER       STATE     URL                       SWARM   DOCKER     ERRORS
    flagon   -      virtualbox   Running   tcp://192. ...                    v19.03.1   
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
   
1. If you find that the `logstash` or `site` containers don't respond immediately, give them a few minutes. 
   In the case of the `site` container, you might try giving it a kick if its taking more than three minutes to load in browser"

   ```bash
   #after loading container, confirming status is "up", and localhost:8080 still isn't loading, bring the container down
   $ docker-compose kill site
   
   # then bring it back up, and see if it loads
   $ docker-compose up -d site
   ```
   
1. If you find that Apache Flagon Kibana Dashboards aren't loading, or Apache UserALE.js log fields in Kibana's `Discover` view
   appear with a warning icon, it could be that you didn't collect logs with valid data for those fields prior to loading the userale 
   index in Kibana. Don't worry, your data is fine--just navigate to the Management -> Index Patterns page, and click the "refresh" button in the upper right hand of the page (Disregard the "popularity metrics" warning). This will refresh the index, making those 
   fields aggregatable, and Dashboards should render properly.

1. Make sure to send us the docker-compose logs to help diagnose your issues please!

   ```bash
   $ docker-compose logs > err.dump 
   ```
   
    You can attach logs directly to tickets on our [``Apache Jira board``](https://issues.apache.org/jira/issues/?jql=project+%3D+FLAGON+AND+component+%3D+builds)
   
1. Still having issues? Reach out to us at at [our dev list](mailto:dev@flagon.incubator.apache.org).

[configure_index]: ./docs/images/configure_index.png "Configure Kibana index"
[confirmation]: ./docs/images/confirmation.png "Confirm index pattern conflicts"
[dashboard]: ./docs/images/dashboard.png "Apache Flagon Page Usage Dashboard"
[management]: ./docs/images/management.png "Kibana management console"
[metrics]: ./docs/images/DockerBeats_Dashboard.png "Metricbeat Dashboard"
[viz_import]: ./docs/images/viz_import.png "Visualization Import Configuration"

Licensing
--------------

Apache Flagon is provided under Apache License version 2.0. See LICENSE and NOTICE (at Master) file for more 
details.

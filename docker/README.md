How to Build SensSoft Docker Containers
---------------------------------------

1. Install [``Docker``](http://docker.com) on your machine.

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
    $ docker-compose up -d --scale elasticsearch=3 elasticsearch loadbalancer
    ```
    
    The loadbalancer node exposes port 9200 on localhost and is the only node 
    that has HTTP enabled. Services such as Kibana and Logstash connect to the 
    loadbalancer node directly. Loadbalancer accepts requests from Kibana and Logstash 
    and balances them across the elasticsearch worker nodes. The elasticsearch 
    worker nodes communicate to each other and the loadbalancer via TCP on port 9300. 

    
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
 
1. Launch logging server. Give Logstash about 2 minutes to start before confirming 
   its state.
  
   ```bash
   $ docker-compose up -d logstash
   $ curl -XGET http://localhost:8100 
   ok
   ```
   
1. Before Kibana can be used, we will need to generate some data. We have already 
   provided an example instrumented website to assist.
   
   ```bash
   $ docker-compose up -d site
   ```

   Visit `http://localhost:8080` and you will see Apache SensSoft's home page.
   
1. Launch Kibana. Give Kibana about 2-5 minutes to start before accessing
   `http://localhost:5601`. 
   
   ```bash
   $ docker-compose up -d kibana
   ```

1. Register an index in Kibana to see the logs:

   Goto: Management -> Index Patterns and enter `userale` in the Index pattern box.
   Choose `clientTime` in the drop down `Time Filter field name` field.
  
   ![alt text][configure_index]
   
1. Load example Dashboard and Visualizations under docker/kibana/.

   Goto: Management -> Saved Objects and select the `Import` button. Import the
   `visualizations.json` and `dashboard.json` file.

   ![alt text][management]

   Confirm index conflicts if message appears. 
   
   ![alt text][confirmation]
   
   Once that is complete, navigate to the `Dashboard` view in Kibana and click the
   `Apache SensSoft Dashboard` object. 

   ![alt text][dashboard]

1. To stop all containers.
    ```sh
    $ docker-compose stop
    ```
 
Having Issues?
--------------
1. Check out the docker-compose logs for the service(s) that are having issues.

   ```bash
   $ docker-compose ps 
   ```
1. Make sure to send us the docker-compose logs to help diagnose your issues please!
   
   ```bash
   $ docker-compose logs > err.dump 
   ```

Todo
---- 
- [ ] TAP docker deployment instructions.
- [ ] Distill docker deployment instructions. 
- [ ] Apache SensSoft Docker + Kubernetes instructions.

[configure_index]: ./images/configure_index.png "Configure Kibana index"
[confirmation]: ./images/confirmation.png "Confirm index pattern conflicts"
[dashboard]: ./images/dashboard.png "Apache Senssoft Dashboard"
[management]: ./images/management.png "Kibana management console"
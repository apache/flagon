Apache SensSoft on top of Kubernetes
====================================

Apache SensSoft would like to thank [Pires] for his great documentation on deploying
 the ELK stack in Kubernetes. 
We have modified [Pires] instructions to fit Apache [SensSoft] requirements and guidelines.

Introduction
------------

The Software as a Sensor™ ([SensSoft]) Project offers an open-source (ALv2.0) software
tool usability testing platform. It includes a number of components that work together
to provide a platform for collecting data about user interactions with software tools, 
as well as archiving, analyzing and visualizing that data.

Apache SensSoft's logging infrastructure is powered by a family of [Elastic] tools, mainly 
[Elasticsearch] for index and retrieval, [Logstash] for shipping data to Elasticsearch,
and [Kibana] for visualizing and building custom data-viz dashboards.

This guide describes how to build and scale Elasticsearch clusters using Kubernetes.

Current Elasticsearch version is `6.2.2`.

Abstract
--------

Before we start, one needs to know that Elasticsearch best-practices recommend to separate nodes in three roles:
* `Master` nodes - intended for clustering management only, no data, no HTTP API
* `Client` nodes - intended for client/search usage, no data, no HTTP API
* `Data` nodes - intended for storing and indexing your data, no HTTP API

This is enforced throughout this document.

Given this, I'm going to demonstrate how to provision a production grade scenario 
consisting of 3 master, 2 client and 2 data nodes.

(Very) Important Notes
----------------------

* Elasticsearch pods need for an init-container to run in privileged mode, so it 
can set some VM options. For that to happen, the `kubelet` should be running with 
args `--allow-privileged`, otherwise the init-container will fail to run.

* By default, `ES_JAVA_OPTS` is set to `-Xms256m -Xmx256m`. This is a very low value
 but many users, i.e. `minikube` users, were having issues with pods getting killed 
 because hosts were out of memory. One can change this in the deployment descriptors
 available in this repository.

* As of the moment, Kubernetes pod descriptors use an `emptyDir` for storing data
in each data node container. This is meant to be for the sake of simplicity and
should be adapted according to one's storage needs.

Docker Images
-------------

This example uses [this pre-built image](https://hub.docker.com/u/senssoft/) of the custom SensSoft ELK stack.

Perquisites (Install and Setup)
-------------------------------

Ensure that you have [Docker], [kubectl], and [minikube] (optional) installed and started.

Deploy Elasticsearch Cluster
============================

Rollout Elasticsearch services and pod replicas.

```bash
kubectl create -f elasticsearch/es-master-svc.yaml
kubectl create -f elasticsearch/es-client-svc.yaml
kubectl create -f elasticsearch/es-master.yaml
kubectl rollout status -f elasticsearch/es-master.yaml
kubectl create -f elasticsearch/es-client.yaml
kubectl rollout status -f elasticsearch/es-client.yaml
kubectl create -f elasticsearch/es-data.yaml
kubectl rollout status -f elasticsearch/es-data.yaml
```

or

```bash
./configure deploy elasticsearch
```

Check one of the Elasticsearch master nodes logs:

```bash
$ kubectl get svc,deployment,pods -l component=elk
NAME                             CLUSTER-IP      EXTERNAL-IP   PORT(S)          AGE
svc/elasticsearch-discovery      10.103.242.73   <none>        9300/TCP         6m
svc/elasticsearch-loadbalancer   10.111.110.60   <nodes>       9200:30510/TCP   3m

NAME               DESIRED   CURRENT   UP-TO-DATE   AVAILABLE   AGE
deploy/es-client   2         2         2            2           3m
deploy/es-data     2         2         2            2           2m
deploy/es-master   3         3         3            3           6m

NAME                            READY     STATUS    RESTARTS   AGE
po/es-client-cbb74b6fb-tgbmp    1/1       Running   0          3m
po/es-client-cbb74b6fb-xnp5c    1/1       Running   0          3m
po/es-data-796d884bfb-fw8w5     1/1       Running   0          2m
po/es-data-796d884bfb-qs675     1/1       Running   0          2m
po/es-master-6f79799c8c-9sdtn   1/1       Running   0          6m
po/es-master-6f79799c8c-g6g9k   1/1       Running   0          6m
po/es-master-6f79799c8c-w2dcs   1/1       Running   0          6m
```

```bash
$ kubectl logs po/es-master-6f79799c8c-9sdtn
[2018-03-04T19:59:22,520][INFO ][o.e.n.Node               ] [es-master-6f79799c8c-9sdtn] initializing ...
[2018-03-04T19:59:22,886][INFO ][o.e.e.NodeEnvironment    ] [es-master-6f79799c8c-9sdtn] using [1] data paths, mounts [[/ (overlay)]], net usable_space [14gb], net total_space [16.1gb], types [overlay]
[2018-03-04T19:59:22,889][INFO ][o.e.e.NodeEnvironment    ] [es-master-6f79799c8c-9sdtn] heap size [247.5mb], compressed ordinary object pointers [true]
[2018-03-04T19:59:22,902][INFO ][o.e.n.Node               ] [es-master-6f79799c8c-9sdtn] node name [es-master-6f79799c8c-9sdtn], node ID [1720vLNASnmbPxwyElXeKQ]
[2018-03-04T19:59:22,904][INFO ][o.e.n.Node               ] [es-master-6f79799c8c-9sdtn] version[6.2.2], pid[1], build[10b1edd/2018-02-16T19:01:30.685723Z], OS[Linux/4.9.64/amd64], JVM[Oracle Corporation/OpenJDK 64-Bit Server VM/1.8.0_161/25.161-b14]
[2018-03-04T19:59:22,905][INFO ][o.e.n.Node               ] [es-master-6f79799c8c-9sdtn] JVM arguments [-Xms1g, -Xmx1g, -XX:+UseConcMarkSweepGC, -XX:CMSInitiatingOccupancyFraction=75, -XX:+UseCMSInitiatingOccupancyOnly, -XX:+AlwaysPreTouch, -Xss1m, -Djava.awt.headless=true, -Dfile.encoding=UTF-8, -Djna.nosys=true, -XX:-OmitStackTraceInFastThrow, -Dio.netty.noUnsafe=true, -Dio.netty.noKeySetOptimization=true, -Dio.netty.recycler.maxCapacityPerThread=0, -Dlog4j.shutdownHookEnabled=false, -Dlog4j2.disable.jmx=true, -Djava.io.tmpdir=/tmp/elasticsearch.F63IAHVh, -XX:+HeapDumpOnOutOfMemoryError, -XX:+PrintGCDetails, -XX:+PrintGCDateStamps, -XX:+PrintTenuringDistribution, -XX:+PrintGCApplicationStoppedTime, -Xloggc:logs/gc.log, -XX:+UseGCLogFileRotation, -XX:NumberOfGCLogFiles=32, -XX:GCLogFileSize=64m, -Des.cgroups.hierarchy.override=/, -Xms256m, -Xmx256m, -Des.path.home=/usr/share/elasticsearch, -Des.path.conf=/usr/share/elasticsearch/config]
[2018-03-04T19:59:27,519][INFO ][o.e.p.PluginsService     ] [es-master-6f79799c8c-9sdtn] loaded module [aggs-matrix-stats]
[2018-03-04T19:59:27,530][INFO ][o.e.p.PluginsService     ] [es-master-6f79799c8c-9sdtn] loaded module [analysis-common]
[2018-03-04T19:59:27,531][INFO ][o.e.p.PluginsService     ] [es-master-6f79799c8c-9sdtn] loaded module [ingest-common]
[2018-03-04T19:59:27,533][INFO ][o.e.p.PluginsService     ] [es-master-6f79799c8c-9sdtn] loaded module [lang-expression]
[2018-03-04T19:59:27,534][INFO ][o.e.p.PluginsService     ] [es-master-6f79799c8c-9sdtn] loaded module [lang-mustache]
[2018-03-04T19:59:27,534][INFO ][o.e.p.PluginsService     ] [es-master-6f79799c8c-9sdtn] loaded module [lang-painless]
[2018-03-04T19:59:27,534][INFO ][o.e.p.PluginsService     ] [es-master-6f79799c8c-9sdtn] loaded module [mapper-extras]
[2018-03-04T19:59:27,540][INFO ][o.e.p.PluginsService     ] [es-master-6f79799c8c-9sdtn] loaded module [parent-join]
[2018-03-04T19:59:27,551][INFO ][o.e.p.PluginsService     ] [es-master-6f79799c8c-9sdtn] loaded module [percolator]
[2018-03-04T19:59:27,552][INFO ][o.e.p.PluginsService     ] [es-master-6f79799c8c-9sdtn] loaded module [rank-eval]
[2018-03-04T19:59:27,552][INFO ][o.e.p.PluginsService     ] [es-master-6f79799c8c-9sdtn] loaded module [reindex]
[2018-03-04T19:59:27,553][INFO ][o.e.p.PluginsService     ] [es-master-6f79799c8c-9sdtn] loaded module [repository-url]
[2018-03-04T19:59:27,555][INFO ][o.e.p.PluginsService     ] [es-master-6f79799c8c-9sdtn] loaded module [transport-netty4]
[2018-03-04T19:59:27,561][INFO ][o.e.p.PluginsService     ] [es-master-6f79799c8c-9sdtn] loaded module [tribe]
[2018-03-04T19:59:27,565][INFO ][o.e.p.PluginsService     ] [es-master-6f79799c8c-9sdtn] loaded plugin [ingest-geoip]
[2018-03-04T19:59:27,569][INFO ][o.e.p.PluginsService     ] [es-master-6f79799c8c-9sdtn] loaded plugin [ingest-user-agent]
[2018-03-04T19:59:37,641][INFO ][o.e.d.DiscoveryModule    ] [es-master-6f79799c8c-9sdtn] using discovery type [zen]
[2018-03-04T19:59:40,865][INFO ][o.e.n.Node               ] [es-master-6f79799c8c-9sdtn] initialized
[2018-03-04T19:59:40,869][INFO ][o.e.n.Node               ] [es-master-6f79799c8c-9sdtn] starting ...
[2018-03-04T19:59:42,001][INFO ][o.e.t.TransportService   ] [es-master-6f79799c8c-9sdtn] publish_address {172.17.0.4:9300}, bound_addresses {0.0.0.0:9300}
[2018-03-04T19:59:42,079][INFO ][o.e.b.BootstrapChecks    ] [es-master-6f79799c8c-9sdtn] bound or publishing to a non-loopback address, enforcing bootstrap checks
[2018-03-04T19:59:45,225][WARN ][o.e.d.z.ZenDiscovery     ] [es-master-6f79799c8c-9sdtn] not enough master nodes discovered during pinging (found [[Candidate{node={es-master-6f79799c8c-9sdtn}{1720vLNASnmbPxwyElXeKQ}{S-_neLjjSPWj4ItZ1mv0zQ}{172.17.0.4}{172.17.0.4:9300}, clusterStateVersion=-1}]], but needed [2]), pinging again
[2018-03-04T19:59:48,273][INFO ][o.e.c.s.MasterService    ] [es-master-6f79799c8c-9sdtn] zen-disco-elected-as-master ([1] nodes joined)[{es-master-6f79799c8c-g6g9k}{9IQhhVe0Sj6reW9pPh0FsA}{FQzU-VNtRlexOnRaK9R2mQ}{172.17.0.6}{172.17.0.6:9300}], reason: new_master {es-master-6f79799c8c-9sdtn}{1720vLNASnmbPxwyElXeKQ}{S-_neLjjSPWj4ItZ1mv0zQ}{172.17.0.4}{172.17.0.4:9300}, added {{es-master-6f79799c8c-g6g9k}{9IQhhVe0Sj6reW9pPh0FsA}{FQzU-VNtRlexOnRaK9R2mQ}{172.17.0.6}{172.17.0.6:9300},}
[2018-03-04T19:59:48,329][INFO ][o.e.c.s.ClusterApplierService] [es-master-6f79799c8c-9sdtn] new_master {es-master-6f79799c8c-9sdtn}{1720vLNASnmbPxwyElXeKQ}{S-_neLjjSPWj4ItZ1mv0zQ}{172.17.0.4}{172.17.0.4:9300}, added {{es-master-6f79799c8c-g6g9k}{9IQhhVe0Sj6reW9pPh0FsA}{FQzU-VNtRlexOnRaK9R2mQ}{172.17.0.6}{172.17.0.6:9300},}, reason: apply cluster state (from master [master {es-master-6f79799c8c-9sdtn}{1720vLNASnmbPxwyElXeKQ}{S-_neLjjSPWj4ItZ1mv0zQ}{172.17.0.4}{172.17.0.4:9300} committed version [1] source [zen-disco-elected-as-master ([1] nodes joined)[{es-master-6f79799c8c-g6g9k}{9IQhhVe0Sj6reW9pPh0FsA}{FQzU-VNtRlexOnRaK9R2mQ}{172.17.0.6}{172.17.0.6:9300}]]])
[2018-03-04T19:59:48,349][INFO ][o.e.n.Node               ] [es-master-6f79799c8c-9sdtn] started
[2018-03-04T19:59:48,437][INFO ][o.e.g.GatewayService     ] [es-master-6f79799c8c-9sdtn] recovered [0] indices into cluster_state
[2018-03-04T19:59:50,789][INFO ][o.e.c.s.MasterService    ] [es-master-6f79799c8c-9sdtn] zen-disco-node-join[{es-master-6f79799c8c-w2dcs}{WAGDODrFRQOb_G9kh4MdBw}{vnfsSU2BQQKOYPB6S8tlHg}{172.17.0.5}{172.17.0.5:9300}], reason: added {{es-master-6f79799c8c-w2dcs}{WAGDODrFRQOb_G9kh4MdBw}{vnfsSU2BQQKOYPB6S8tlHg}{172.17.0.5}{172.17.0.5:9300},}
[2018-03-04T19:59:50,880][INFO ][o.e.c.s.ClusterApplierService] [es-master-6f79799c8c-9sdtn] added {{es-master-6f79799c8c-w2dcs}{WAGDODrFRQOb_G9kh4MdBw}{vnfsSU2BQQKOYPB6S8tlHg}{172.17.0.5}{172.17.0.5:9300},}, reason: apply cluster state (from master [master {es-master-6f79799c8c-9sdtn}{1720vLNASnmbPxwyElXeKQ}{S-_neLjjSPWj4ItZ1mv0zQ}{172.17.0.4}{172.17.0.4:9300} committed version [3] source [zen-disco-node-join[{es-master-6f79799c8c-w2dcs}{WAGDODrFRQOb_G9kh4MdBw}{vnfsSU2BQQKOYPB6S8tlHg}{172.17.0.5}{172.17.0.5:9300}]]])
[2018-03-04T20:01:07,315][INFO ][o.e.c.s.MasterService    ] [es-master-6f79799c8c-9sdtn] zen-disco-node-join[{es-client-cbb74b6fb-tgbmp}{EunRsql8Q9CqSWJf0FKQbQ}{32GSGju1QbaYe30kTbG_5Q}{172.17.0.8}{172.17.0.8:9300}], reason: added {{es-client-cbb74b6fb-tgbmp}{EunRsql8Q9CqSWJf0FKQbQ}{32GSGju1QbaYe30kTbG_5Q}{172.17.0.8}{172.17.0.8:9300},}
[2018-03-04T20:01:07,751][INFO ][o.e.c.s.ClusterApplierService] [es-master-6f79799c8c-9sdtn] added {{es-client-cbb74b6fb-tgbmp}{EunRsql8Q9CqSWJf0FKQbQ}{32GSGju1QbaYe30kTbG_5Q}{172.17.0.8}{172.17.0.8:9300},}, reason: apply cluster state (from master [master {es-master-6f79799c8c-9sdtn}{1720vLNASnmbPxwyElXeKQ}{S-_neLjjSPWj4ItZ1mv0zQ}{172.17.0.4}{172.17.0.4:9300} committed version [4] source [zen-disco-node-join[{es-client-cbb74b6fb-tgbmp}{EunRsql8Q9CqSWJf0FKQbQ}{32GSGju1QbaYe30kTbG_5Q}{172.17.0.8}{172.17.0.8:9300}]]])
[2018-03-04T20:01:07,822][INFO ][o.e.c.s.MasterService    ] [es-master-6f79799c8c-9sdtn] zen-disco-node-join[{es-client-cbb74b6fb-xnp5c}{SP4_qYhURHuQipeiiuC35w}{ISw5yvwPTUKMIFMvpMYXMA}{172.17.0.7}{172.17.0.7:9300}], reason: added {{es-client-cbb74b6fb-xnp5c}{SP4_qYhURHuQipeiiuC35w}{ISw5yvwPTUKMIFMvpMYXMA}{172.17.0.7}{172.17.0.7:9300},}
[2018-03-04T20:01:08,133][INFO ][o.e.c.s.ClusterApplierService] [es-master-6f79799c8c-9sdtn] added {{es-client-cbb74b6fb-xnp5c}{SP4_qYhURHuQipeiiuC35w}{ISw5yvwPTUKMIFMvpMYXMA}{172.17.0.7}{172.17.0.7:9300},}, reason: apply cluster state (from master [master {es-master-6f79799c8c-9sdtn}{1720vLNASnmbPxwyElXeKQ}{S-_neLjjSPWj4ItZ1mv0zQ}{172.17.0.4}{172.17.0.4:9300} committed version [5] source [zen-disco-node-join[{es-client-cbb74b6fb-xnp5c}{SP4_qYhURHuQipeiiuC35w}{ISw5yvwPTUKMIFMvpMYXMA}{172.17.0.7}{172.17.0.7:9300}]]])
[2018-03-04T20:02:16,606][INFO ][o.e.c.s.MasterService    ] [es-master-6f79799c8c-9sdtn] zen-disco-node-join[{es-data-796d884bfb-qs675}{ZOopEPppSrGGk1f2uB6_Pg}{M7ZPAbbxQ0mnOpRZjNtq0A}{172.17.0.10}{172.17.0.10:9300}], reason: added {{es-data-796d884bfb-qs675}{ZOopEPppSrGGk1f2uB6_Pg}{M7ZPAbbxQ0mnOpRZjNtq0A}{172.17.0.10}{172.17.0.10:9300},}
[2018-03-04T20:02:17,310][INFO ][o.e.c.s.ClusterApplierService] [es-master-6f79799c8c-9sdtn] added {{es-data-796d884bfb-qs675}{ZOopEPppSrGGk1f2uB6_Pg}{M7ZPAbbxQ0mnOpRZjNtq0A}{172.17.0.10}{172.17.0.10:9300},}, reason: apply cluster state (from master [master {es-master-6f79799c8c-9sdtn}{1720vLNASnmbPxwyElXeKQ}{S-_neLjjSPWj4ItZ1mv0zQ}{172.17.0.4}{172.17.0.4:9300} committed version [6] source [zen-disco-node-join[{es-data-796d884bfb-qs675}{ZOopEPppSrGGk1f2uB6_Pg}{M7ZPAbbxQ0mnOpRZjNtq0A}{172.17.0.10}{172.17.0.10:9300}]]])
[2018-03-04T20:02:17,494][INFO ][o.e.c.s.MasterService    ] [es-master-6f79799c8c-9sdtn] zen-disco-node-join[{es-data-796d884bfb-fw8w5}{GAMmdne1Q02pb0tujxGMTQ}{DsiN0UeYQQa9Gzeg_B3ARw}{172.17.0.9}{172.17.0.9:9300}], reason: added {{es-data-796d884bfb-fw8w5}{GAMmdne1Q02pb0tujxGMTQ}{DsiN0UeYQQa9Gzeg_B3ARw}{172.17.0.9}{172.17.0.9:9300},}
[2018-03-04T20:02:17,753][INFO ][o.e.c.s.ClusterApplierService] [es-master-6f79799c8c-9sdtn] added {{es-data-796d884bfb-fw8w5}{GAMmdne1Q02pb0tujxGMTQ}{DsiN0UeYQQa9Gzeg_B3ARw}{172.17.0.9}{172.17.0.9:9300},}, reason: apply cluster state (from master [master {es-master-6f79799c8c-9sdtn}{1720vLNASnmbPxwyElXeKQ}{S-_neLjjSPWj4ItZ1mv0zQ}{172.17.0.4}{172.17.0.4:9300} committed version [7] source [zen-disco-node-join[{es-data-796d884bfb-fw8w5}{GAMmdne1Q02pb0tujxGMTQ}{DsiN0UeYQQa9Gzeg_B3ARw}{172.17.0.9}{172.17.0.9:9300}]]])
```

As you can assert, the cluster is up and running.

Access the service
------------------

Don't forget that services in Kubernetes are only accessible from containers in 
the cluster. For different behavior one should configure the creation of an 
external load-balancer. While it's supported within this example service
descriptor, its usage is out of scope of this document, for now.

Note: if you are using one of the cloud providers which support external load
balancers, setting the type field to "LoadBalancer" will provision a load
balancer for your Service. You can uncomment the field in es-client-svc.yaml.

```bash
$ kubectl get svc elasticsearch-loadbalancer
NAME                         CLUSTER-IP      EXTERNAL-IP   PORT(S)          AGE
elasticsearch-loadbalancer   10.111.110.60   <nodes>       9200:30510/TCP   6m
```

From any host on your cluster (that's running `kube-proxy`), run:

```bash
$ kubectl exec -it es-data-796d884bfb-fw8w5  -- /bin/bash
$ curl -XGET http://10.111.110.60:9200
```

You should see something similar to the following:
```json
{
  "name" : "es-client-cbb74b6fb-tgbmp",
  "cluster_name" : "SensSoft",
  "cluster_uuid" : "J7-noNLVQP21dq8MZVnF-w",
  "version" : {
    "number" : "6.2.2",
    "build_hash" : "10b1edd",
    "build_date" : "2018-02-16T19:01:30.685723Z",
    "build_snapshot" : false,
    "lucene_version" : "7.2.1",
    "minimum_wire_compatibility_version" : "5.6.0",
    "minimum_index_compatibility_version" : "5.0.0"
  },
  "tagline" : "You Know, for Search"
}
```

Or if you want to check cluster information:

```
curl -XGET http://10.111.110.60:9200/_cluster/health?pretty
```

You should see something similar to the following:

```json
{
  "cluster_name" : "SensSoft",
  "status" : "green",
  "timed_out" : false,
  "number_of_nodes" : 7,
  "number_of_data_nodes" : 2,
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

Deploy Logstash Service
=======================

Rollout Logstash service

```bash
$ ./configure deploy logstash
```

Check status
```bash
$ kubectl get svc,deployment,pods -l role=logstash
NAME                     CLUSTER-IP      EXTERNAL-IP   PORT(S)          AGE
svc/logstash-discovery   10.103.234.11   <nodes>       8100:31010/TCP   3m

NAME              DESIRED   CURRENT   UP-TO-DATE   AVAILABLE   AGE
deploy/logstash   1         1         1            1           1m

NAME                          READY     STATUS    RESTARTS   AGE
po/logstash-9464b7fd8-dn8gv   1/1       Running   1          1m
```

Deploy Kibana Service
=====================

Rollout Kibana service

```bash
$ ./configure.sh deploy kibana
```

Check status
```bash
$ kubectl get svc,deployment,pods -l role=kibana
NAME         CLUSTER-IP      EXTERNAL-IP   PORT(S)          AGE
svc/kibana   10.103.73.161   <nodes>       5601:32422/TCP   1m

NAME            DESIRED   CURRENT   UP-TO-DATE   AVAILABLE   AGE
deploy/kibana   1         1         1            1           1m

NAME                        READY     STATUS    RESTARTS   AGE
po/kibana-b6f6b7b8f-plvkz   1/1       Running   0          1m
```

To view Kibana, either log into the VM or find your minikube VM address and
goto the assigned external port to view Kibana.

```bash
$ firefox $(minikube ip):32422
```

## Todo
1. Create new service `app` that will include pods tap, distill, site, db, etc.
2. Need a better way of checking on the state of Logstash. It needs the most time to provision.
3. Logstash is very unstable.

[Pires]: https://github.com/pires/kubernetes-elasticsearch-cluster/
[SensSoft]: http://senssoft.incubator.apache.org/
[Elastic]: https://www.elastic.co/
[Elasticsearch]: https://www.elastic.co/products/elasticsearch
[Logstash]: https://www.elastic.co/products/logstash
[Kibana]: https://www.elastic.co/products/kibana
[Cheat Sheet]: https://kubernetes.io/docs/user-guide/kubectl-cheatsheet/
[Docker]: https://www.docker.com
[kubectl]: https://kubernetes.io/docs/tasks/tools/install-kubectl/
[minikube]: https://kubernetes.io/docs/tasks/tools/install-minikube/    
# Apache SensSoft on top of Kubernetes

Apache SensSoft would like to thank [Pires] for providing excellent documentation. 
We have modified [Pires] version to fit Apache [SensSoft] requirements.

The Software as a Sensor™ ([SensSoft]) Project offers an open-source (ALv2.0) software
tool usability testing platform. It includes a number of components that work together
to provide a platform for collecting data about user interactions with software tools, 
as well as archiving, analyzing and visualizing that data.

Apache SensSoft's logging infrastructure is powered by a family of [Elastic] tools, mainly 
[Elasticsearch] for index and retrieval, [Logstash] for shipping data to Elasticsearch,
and [Kibana] for visualizing and building custom data-viz dashboards.

This guide describes how to build and scale Elasticsearch clusters using Kubernetes.

Current Elasticsearch version is `5.6.3`.

## Abstract

Before we start, one needs to know that Elasticsearch best-practices recommend to separate nodes in three roles:
* `Master` nodes - intended for clustering management only, no data, no HTTP API
* `Client` nodes - intended for client/search usage, no data, no HTTP API
* `Data` nodes - intended for storing and indexing your data, no HTTP API

This is enforced throughout this document.

Given this, I'm going to demonstrate how to provision a production grade scenario 
consisting of 3 master, 2 client and 2 data nodes.

##(Very) Important notes

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

## Docker image

This example uses [this pre-built image](https://github.com/apache/incubator-senssoft/tree/master/docker) of the custom SensSoft ELK stack.

## Perquisites (Install and Setup)

Ensure that you have [Docker], [kubectl], and [minikube] (optional) installed and started.

## Deploy Elasticsearch cluster

```bash
kubectl create -f es-master-svc.yaml
kubectl create -f es-client-svc.yaml
kubectl create -f es-master.yaml
kubectl rollout status -f es-master.yaml
kubectl create -f es-client.yaml
kubectl rollout status -f es-client.yaml
kubectl create -f es-data.yaml
kubectl rollout status -f es-data.yaml
```

or

```bash
./configure deploy
```

Check one of the Elasticsearch master nodes logs:

```bash
$ kubectl get svc,deployment,pods -l component=elasticsearch
NAME                                 CLUSTER-IP   EXTERNAL-IP   PORT(S)    AGE
svc/elasticsearch-client-discovery   10.0.0.107   <none>        9200/TCP   8m
svc/elasticsearch-master-discovery   10.0.0.134   <none>        9300/TCP   9m

NAME               DESIRED   CURRENT   UP-TO-DATE   AVAILABLE   AGE
deploy/es-client   2         2         2            2           4m
deploy/es-data     2         2         2            2           2m
deploy/es-master   3         3         3            3           7m

NAME                            READY     STATUS    RESTARTS   AGE
po/es-client-1931188858-0pxhg   1/1       Running   0          4m
po/es-client-1931188858-sk10l   1/1       Running   0          4m
po/es-data-2969197230-dx13s     1/1       Running   0          2m
po/es-data-2969197230-tcqgf     1/1       Running   0          2m
po/es-master-1140560815-4j8xb   1/1       Running   0          7m
po/es-master-1140560815-cch1r   1/1       Running   0          7m
po/es-master-1140560815-m8ghc   1/1       Running   0          7m
```

```bash
$ kubectl logs po/es-master-1140560815-4j8xb
[2018-02-21T23:40:24,539][INFO ][o.e.n.Node               ] [es-master-1140560815-4j8xb] initializing ...
[2018-02-21T23:40:24,922][INFO ][o.e.e.NodeEnvironment    ] [es-master-1140560815-4j8xb] using [1] data paths, mounts [[/ (overlay)]], net usable_space [13.7gb], net total_space [16.1gb], spins? [possibly], types [overlay]
[2018-02-21T23:40:24,923][INFO ][o.e.e.NodeEnvironment    ] [es-master-1140560815-4j8xb] heap size [247.5mb], compressed ordinary object pointers [true]
[2018-02-21T23:40:24,925][INFO ][o.e.n.Node               ] [es-master-1140560815-4j8xb] node name [es-master-1140560815-4j8xb], node ID [y3hGFzDmQM-65WWRwnuCUg]
[2018-02-21T23:40:24,930][INFO ][o.e.n.Node               ] [es-master-1140560815-4j8xb] version[5.6.3], pid[1], build[1a2f265/2017-10-06T20:33:39.012Z], OS[Linux/4.9.13/amd64], JVM[Oracle Corporation/OpenJDK 64-Bit Server VM/1.8.0_141/25.141-b16]
[2018-02-21T23:40:24,931][INFO ][o.e.n.Node               ] [es-master-1140560815-4j8xb] JVM arguments [-Xms2g, -Xmx2g, -XX:+UseConcMarkSweepGC, -XX:CMSInitiatingOccupancyFraction=75, -XX:+UseCMSInitiatingOccupancyOnly, -XX:+AlwaysPreTouch, -Xss1m, -Djava.awt.headless=true, -Dfile.encoding=UTF-8, -Djna.nosys=true, -Djdk.io.permissionsUseCanonicalPath=true, -Dio.netty.noUnsafe=true, -Dio.netty.noKeySetOptimization=true, -Dio.netty.recycler.maxCapacityPerThread=0, -Dlog4j.shutdownHookEnabled=false, -Dlog4j2.disable.jmx=true, -Dlog4j.skipJansi=true, -XX:+HeapDumpOnOutOfMemoryError, -Des.cgroups.hierarchy.override=/, -Xms256m, -Xmx256m, -Des.path.home=/usr/share/elasticsearch]
[2018-02-21T23:40:29,547][INFO ][o.e.p.PluginsService     ] [es-master-1140560815-4j8xb] loaded module [aggs-matrix-stats]
[2018-02-21T23:40:29,547][INFO ][o.e.p.PluginsService     ] [es-master-1140560815-4j8xb] loaded module [ingest-common]
[2018-02-21T23:40:29,548][INFO ][o.e.p.PluginsService     ] [es-master-1140560815-4j8xb] loaded module [lang-expression]
[2018-02-21T23:40:29,548][INFO ][o.e.p.PluginsService     ] [es-master-1140560815-4j8xb] loaded module [lang-groovy]
[2018-02-21T23:40:29,548][INFO ][o.e.p.PluginsService     ] [es-master-1140560815-4j8xb] loaded module [lang-mustache]
[2018-02-21T23:40:29,548][INFO ][o.e.p.PluginsService     ] [es-master-1140560815-4j8xb] loaded module [lang-painless]
[2018-02-21T23:40:29,549][INFO ][o.e.p.PluginsService     ] [es-master-1140560815-4j8xb] loaded module [parent-join]
[2018-02-21T23:40:29,550][INFO ][o.e.p.PluginsService     ] [es-master-1140560815-4j8xb] loaded module [percolator]
[2018-02-21T23:40:29,550][INFO ][o.e.p.PluginsService     ] [es-master-1140560815-4j8xb] loaded module [reindex]
[2018-02-21T23:40:29,551][INFO ][o.e.p.PluginsService     ] [es-master-1140560815-4j8xb] loaded module [transport-netty3]
[2018-02-21T23:40:29,551][INFO ][o.e.p.PluginsService     ] [es-master-1140560815-4j8xb] loaded module [transport-netty4]
[2018-02-21T23:40:29,554][INFO ][o.e.p.PluginsService     ] [es-master-1140560815-4j8xb] loaded plugin [ingest-geoip]
[2018-02-21T23:40:29,556][INFO ][o.e.p.PluginsService     ] [es-master-1140560815-4j8xb] loaded plugin [ingest-user-agent]
[2018-02-21T23:40:35,893][INFO ][o.e.d.DiscoveryModule    ] [es-master-1140560815-4j8xb] using discovery type [zen]
[2018-02-21T23:40:37,624][INFO ][o.e.n.Node               ] [es-master-1140560815-4j8xb] initialized
[2018-02-21T23:40:37,628][INFO ][o.e.n.Node               ] [es-master-1140560815-4j8xb] starting ...
[2018-02-21T23:40:38,715][INFO ][o.e.t.TransportService   ] [es-master-1140560815-4j8xb] publish_address {172.17.0.5:9300}, bound_addresses {[::]:9300}
[2018-02-21T23:40:38,752][INFO ][o.e.b.BootstrapChecks    ] [es-master-1140560815-4j8xb] bound or publishing to a non-loopback or non-link-local address, enforcing bootstrap checks
[2018-02-21T23:40:42,861][INFO ][o.e.c.s.ClusterService   ] [es-master-1140560815-4j8xb] detected_master {es-master-1140560815-m8ghc}{6aFy3IAjQqKnObD6TDuyKg}{tvZZmgLgSxGhjrOHseKdvw}{172.17.0.6}{172.17.0.6:9300}, added {{es-master-1140560815-m8ghc}{6aFy3IAjQqKnObD6TDuyKg}{tvZZmgLgSxGhjrOHseKdvw}{172.17.0.6}{172.17.0.6:9300},{es-master-1140560815-cch1r}{ItzfidgcTWyIPO3enbXxiQ}{-bUB95d2TxSj7sVos1Y_hA}{172.17.0.4}{172.17.0.4:9300},}, reason: zen-disco-receive(from master [master {es-master-1140560815-m8ghc}{6aFy3IAjQqKnObD6TDuyKg}{tvZZmgLgSxGhjrOHseKdvw}{172.17.0.6}{172.17.0.6:9300} committed version [1]])
[2018-02-21T23:40:42,943][INFO ][o.e.n.Node               ] [es-master-1140560815-4j8xb] started
[2018-02-21T23:41:56,922][INFO ][o.e.c.s.ClusterService   ] [es-master-1140560815-4j8xb] added {{es-client-1931188858-sk10l}{DWii7iInRQOFvNI9Uk8wgg}{E1gZ034YQYiD0S3qJ7iIgw}{172.17.0.7}{172.17.0.7:9300},}, reason: zen-disco-receive(from master [master {es-master-1140560815-m8ghc}{6aFy3IAjQqKnObD6TDuyKg}{tvZZmgLgSxGhjrOHseKdvw}{172.17.0.6}{172.17.0.6:9300} committed version [3]])
[2018-02-21T23:41:57,432][INFO ][o.e.c.s.ClusterService   ] [es-master-1140560815-4j8xb] added {{es-client-1931188858-0pxhg}{hKCgO7VQTSOydiUonCemEg}{ICdFKL_OQjqF8Vff00ymXw}{172.17.0.8}{172.17.0.8:9300},}, reason: zen-disco-receive(from master [master {es-master-1140560815-m8ghc}{6aFy3IAjQqKnObD6TDuyKg}{tvZZmgLgSxGhjrOHseKdvw}{172.17.0.6}{172.17.0.6:9300} committed version [4]])
[2018-02-21T23:43:18,817][INFO ][o.e.c.s.ClusterService   ] [es-master-1140560815-4j8xb] added {{es-data-2969197230-dx13s}{kZtdA7uETyKWtMKGQyheBQ}{gv093zE9R2GgLdDuDvpN1A}{172.17.0.9}{172.17.0.9:9300},}, reason: zen-disco-receive(from master [master {es-master-1140560815-m8ghc}{6aFy3IAjQqKnObD6TDuyKg}{tvZZmgLgSxGhjrOHseKdvw}{172.17.0.6}{172.17.0.6:9300} committed version [5]])
[2018-02-21T23:43:19,899][INFO ][o.e.c.s.ClusterService   ] [es-master-1140560815-4j8xb] added {{es-data-2969197230-tcqgf}{UmHRVW1MTNq5uA6nng8Nmg}{-DzJM2KRRwqkq7Hmm8oXjQ}{172.17.0.10}{172.17.0.10:9300},}, reason: zen-disco-receive(from master [master {es-master-1140560815-m8ghc}{6aFy3IAjQqKnObD6TDuyKg}{tvZZmgLgSxGhjrOHseKdvw}{172.17.0.6}{172.17.0.6:9300} committed version [6]])
```

As you can assert, the cluster is up and running.

## Access the service

Don't forget that services in Kubernetes are only accessible from containers in 
the cluster. For different behavior one should configure the creation of an 
external load-balancer. While it's supported within this example service
descriptor, its usage is out of scope of this document, for now.

Note: if you are using one of the cloud providers which support external load
balancers, setting the type field to "LoadBalancer" will provision a load
balancer for your Service. You can uncomment the field in es-client-svc.yaml.

```bash
$ kubectl get svc elasticsearch-client-discovery
NAME                             CLUSTER-IP   EXTERNAL-IP   PORT(S)    AGE
elasticsearch-client-discovery   10.0.0.107   <none>        9200/TCP   11m
```

From any host on your cluster (that's running `kube-proxy`), run:

```bash
$ curl -XGET http://10.0.0.107:9200
```

You should see something similar to the following:

```json
{
  "name" : "es-client-1931188858-sk10l",
  "cluster_name" : "SensSoft",
  "cluster_uuid" : "aFJwv7ngRZWlOHK6muOeLg",
  "version" : {
    "number" : "5.6.3",
    "build_hash" : "1a2f265",
    "build_date" : "2017-10-06T20:33:39.012Z",
    "build_snapshot" : false,
    "lucene_version" : "6.6.1"
  },
  "tagline" : "You Know, for Search"
}
```

Or if you want to check cluster information:

```
curl -XGET http://10.0.0.107:9200/_cluster/health?pretty
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

### Additional Notes - Internal access
```bash
kubectl exec -it es-data-2969197230-tcqgf  -- /bin/bash
```

## Todo
1. Upload configuration file instead of using environments
1. Deprecate LoadBalancer service since that requires deployment on AWS/GAE
1. Kube-proxy/port forwarding
1. Create new service `app` that will include pods tap, distill, site, db, etc.

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
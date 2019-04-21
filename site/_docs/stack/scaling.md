---
title: Scaling Considerations
component: stack
permalink: /docs/stack/scaling
priority: 0
---

### Scaling Apache Flagon: An Introduction and First Principles

**"It Depends..."**

The best way to scale [Apache Flagon](https://github.com/apache/incubator-flagon) depends entirely on your use-case: how you'll use your [Apache UserALE.js]({{ '/docs/useralejs' | prepend: site.baseurl }}) data and which [UserALE.js data streams]({{ '/docs/useralejs/dataschema' | prepend: site.baseurl }}) you'll use. This page provides a few Apache Flagon-specific considerations to think about as you decide how best to scale, and some useful methods for benchmarking to help you make that determination.

**The Apache Flagon Single-Node Elastic Container is an Ingredient, Not a Whole Solution**

The single-node Elastic (ELK) stack in the Docker container distributed by [Apache Flagon]({{ '/docs/stack' | prepend: site.baseurl }}) is not alone suitable for most production-level use-cases. It may be suitable on its own, for "grab-and-go" user-testing use cases, for example. This would entail just a few days of data collection from a specific application, from just a few users. But, alone it will fail quickly for most persistent data collection uses and enterprise-scale use-cases. Rather, this container is meant to be a building block for larger solutions: 

1. Our ELK .yml config files for our Docker container can be used as the building-blocks for your very own [multi-node cluster](https://dzone.com/articles/elasticsearch-tutorial-creating-an-elasticsearch-c) with load-balancing capabilities.
1. You can use our [Kubernetes build](https://github.com/apache/incubator-flagon/tree/master/kubernetes), which relies on our Docker assets, to scale your Apache Flagon stack to meet your needs.
1. You can use our single-node container to scale out in [AWS Elastic Beanstalk (EBS)](https://aws.amazon.com/elasticbeanstalk/).

**Apache Flagon Data Also Scales**

It's important to note that the burden of scale isn't placed wholly on your Apache Flagon stack. Flagon's behavioral logging capability, [Apache UserALE.js]({{ '/docs/useralejs' | prepend: site.baseurl }}) also scales. This means that one of the most cost-efficient ways to manage the resources behind your Apache Flagon stack, is to [configure]({{ '/docs/useralejs/API' | prepend: site.baseurl }}) or [modify]({{ '/docs/useralejs/modifying' | prepend: site.baseurl }}) UserALE.js to meet your use-case. 
### Sizing Up an Elastic Stack

When thinking about how to scale your Apache Flagon Elastic stack, it's important to note that Elasticsearch isn't a database, its a datastore, which stores documents. Elastic is built on top of [Lucene](http://lucene.apache.org/). That means that Apache Flagon "logs" aren't logs once they're indexed in Elastic, they become searchable documents. That's a huge strength (and why we chose Elastic), but it also means that assumptions about resource consumptions based purely on records and fields is misleading in Elastic. Elastic has many useful [guides]((https://www.elastic.co/blog/found-sizing-elasticsearch)) on sizing and scaling. Below, we're adding a few of our own thoughts based on Apache Flagon's own eccentricities.

* Given that documents are the atomic unit of storage in Elastic, *document generation rate* is the most important consideration to scaling. Default [Apache UserALE.js parameters]({{ '/docs/useralejs' | prepend: site.baseurl }}) produce a lot of [data]({{ '/docs/useralejs/dataschema' | prepend: site.baseurl }}), even from single users in Apache UserALE.js. In fact, we used say that "drinking from the fire-hose" didn't quite do our data-rate justice--we used to say that opening up UserALE.js was more like "drinking from the flame-thrower". We strongly suggest that you think about your needs and consider whether you need data from all our event-handlers. If you don't need mouseover events, for example, you can dramatically reduce the rate at which you generate data and the resources you'll need. Note that with our [interval logs]({{ '/docs/useralejs/dataschema' | prepend: site.baseurl }}), you can still get metrics for gross user-behavior without high-velocity data streams (e.g., mouseover, scrolls). Alternatively, you can use the [UserALE.js API]({{ '/docs/useralejs/API' | prepend: site.baseurl }}) and even [configurable HTLM5 parameters in our script tag]({{ '/docs/useralejs' | prepend: site.baseurl }}) to modify the frequency with which UserALE.js logs these kinds of user events.

![alt text][logBreakdown]

* Your Elastic resource needs will also grow with *document length*, especially the length of [strings](https://blog.appdynamics.com/product/estimating-costs-of-storing-documents-in-elasticsearch/) within your logs. One of the discriminating features of Apache UserALE.js is its precision--its ability to capture both the target of user behaviors, and the entire DOM path of that target--and rich meta data. Apache UserALE.js fields like `path` and `pageUrl` can get quite long for certain kinds of web sites and applications. It's worth considering, for example, using our [API]({{ '/docs/useralejs/API' | prepend: site.baseurl }}) to abstract fields like `path` with labels, if you need precision, or if you can get by with only knowing users' `target` elements. Similarly, you might consider relying on `pageTitle` rather than `pageUrl` if they sufficiently differentiate pages and if you're dealing with very deep website trees. Through simple [modifications to UserALE.js source]({{ '/docs/useralejs/modifying' | prepend: site.baseurl }}), you can alias verbose fields in your logs to reduce resource consumption

![alt text][verboseLogs]

* Apache Flagon is built to scale as a platform, allowing you to connect additional services to your platform that consume user behavioral data. When considering scale, the *number of services* you connect to your Apache Flagon platform will affect your Elastic stacks' performance. Any production-level deployment will require, at minimum a simple three-node [Elastic cluster](https://dzone.com/articles/elasticsearch-tutorial-creating-an-elasticsearch-c) (with one load-balancing node). As you scale and configure that cluster, be mindful that in addition to performing indexing functions, Elasticsearch is also servicing queries and aggregations of that data. Analytical services connected to Apache Flagon, especially if they both read and write back to index, can consume significant resources and increase indexing and search time. This can be problematic for real-time analytical and monitoring applications (including Kibana). This can also result in data loss if logs are flushed from pipelines prior to being indexed. For hefty analytical services, it may be worth dedicating specific nodes in your cluster to service them. 

For the reasons above, its really critical to do some benchmarking for your use-case prior to deciding on a scaling strategy. Below, you'll find some guidance for how to do this with Apache Flagon and Elastic tools. We also provide some simple benchmarks and underlying assumptions. But again, each webpage or application is a bit different, so it's important create some of your own benchmarks for comparison with ours.
### Benchmarking Tools and Methods for Sizing your Apache Flagon Stack

[Elastic discussion boards](https://discuss.elastic.co/t/10-billion-records-writen-to-es-ervery-day-how-many-nodes-and-hardware-should-need/45307/4)

[Apache UserALE.js](https://github.com/apache/incubator-flagon-useralejs) is the Apache Flagon's thin-client behavioral logging solution. Below, you'll find short-hand instructions for getting started with UserALE.js. For complete instructions, see our [README](https://github.com/apache/incubator-flagon-useralejs/blob/master/README.md).

[Elastic's Stats API](https://www.elastic.co/guide/en/elasticsearch/reference/current/indices-stats.html)
[Overview of Elastic's APIs](https://www.datadoghq.com/blog/collect-elasticsearch-metrics/#index-stats-api)

**Cluster and Index Size**
  ```shell
  #Index Stats using Elastic's GET _stats API
  $ curl localhost:9200/index_name/_stats?pretty=true
  
  #Use me for Apache Flagon index configs
  $ curl localhost:9200/userale/_stats?pretty=true
  ```
[http://localhost:9200/userale/_stats?pretty=true](http://localhost:9200/userale/_stats?pretty=true)


Subscribe to our [dev list](dev-subscribe@flagon.incubator.apache.org) and join the conversation!
---
title: Scaling Considerations
component: stack
permalink: /docs/stack/scaling
priority: 0
---

### Scaling Apache Flagon: An Introduction and First Principles

This guide touches on some basic principles to keep in mind as you're planning for scale with [Apache Flagon](https://github.com/apache/incubator-flagon). We provide some high-level guidance and considerations for working with an Elastic stack to scale Flagon that are unique to [Apache UserALE.js]({{ '/docs/useralejs' | prepend: site.baseurl }}) data. We also walk through some of our benchmarking tools and methodologies, so that you walk into discussions about scale with some accurate assumptions based on your use-case and your needs for data.

**"It Depends..."**

The best way to scale Apache Flagon depends entirely on your use-case: how you'll use your Apache UserALE.js data and which [UserALE.js data streams]({{ '/docs/useralejs/dataschema' | prepend: site.baseurl }}) you'll use. This page provides a few Apache Flagon-specific considerations to think about as you decide how best to scale, and some useful methods for benchmarking to help you make that determination.

**The Apache Flagon Single-Node Elastic Container is an Ingredient, Not a Whole Solution**

The single-node Elastic (ELK) stack in the Docker container distributed by [Apache Flagon]({{ '/docs/stack' | prepend: site.baseurl }}) is not alone suitable for most production-level use-cases. It may be suitable on its own, for "grab-and-go" user-testing use cases, for example. This would entail just a few days of data collection from a specific application, from just a few users. But, alone it will fail quickly for most persistent data collection uses and enterprise-scale use-cases. Rather, this container is meant to be a building block for larger solutions: 

1. Our ELK .yml config files for our Docker container can be used as the building-blocks for your very own [multi-node cluster](https://dzone.com/articles/elasticsearch-tutorial-creating-an-elasticsearch-c) with load-balancing capabilities.
1. You can use our [Kubernetes build](https://github.com/apache/incubator-flagon/tree/master/kubernetes), which relies on our Docker assets, to scale your Apache Flagon stack to meet your needs.
1. You can use our single-node container to scale out in [AWS Elastic Beanstalk (EBS)](https://aws.amazon.com/elasticbeanstalk/).

**Apache Flagon Data Also Scales**

It's important to note that the burden of scale isn't placed wholly on your Apache Flagon stack. Flagon's behavioral logging capability, [Apache UserALE.js]({{ '/docs/useralejs' | prepend: site.baseurl }}) also scales. This means that one of the most cost-efficient ways to manage the resources behind your Apache Flagon stack, is to [configure]({{ '/docs/useralejs/API' | prepend: site.baseurl }}) or [modify]({{ '/docs/useralejs/modifying' | prepend: site.baseurl }}) UserALE.js to meet your use-case. 
### Sizing Up an Elastic Stack

When thinking about how to scale your Apache Flagon Elastic stack, it's important to note that Elasticsearch isn't a database, its a datastore, which stores documents. Elastic is built on top of [Lucene](http://lucene.apache.org/). That means that Apache Flagon "logs" aren't logs once they're indexed in Elastic, they become searchable documents. That's a huge strength (and why we chose Elastic), but it also means that assumptions about resource consumptions based purely on records and fields is misleading in Elastic. Elastic has many useful [guides]((https://www.elastic.co/blog/found-sizing-elasticsearch)) on sizing and scaling. Below, we're adding a few of our own thoughts based on Apache Flagon's own eccentricities.

1. Given that documents are the atomic unit of storage in Elastic, *document generation rate* is the most important consideration to scaling. Default [Apache UserALE.js parameters]({{ '/docs/useralejs' | prepend: site.baseurl }}) produce a lot of [data]({{ '/docs/useralejs/dataschema' | prepend: site.baseurl }}), even from single users in Apache UserALE.js. In fact, we used say that "drinking from the fire-hose" didn't quite do our data-rate justice--we used to say that opening up UserALE.js was more like "drinking from the flame-thrower". We strongly suggest that you think about your needs and consider whether you need data from all our event-handlers. If you don't need mouseover events, for example, you can dramatically reduce the rate at which you generate data and the resources you'll need. You can modify source, use the [UserALE.js API]({{ '/docs/useralejs/API' | prepend: site.baseurl }}), and/or use [configurable HTLM5 parameters in our script tag]({{ '/docs/useralejs' | prepend: site.baseurl }}) to modify the frequency with which UserALE.js logs these kinds of user events.

1. Your Elastic resource needs will also grow with *document length*, especially the length of [strings](https://blog.appdynamics.com/product/estimating-costs-of-storing-documents-in-elasticsearch/) within your logs (see also [Elastic's tips on indexing strings](https://www.elastic.co/guide/en/elasticsearch/reference/5.5/tune-for-disk-usage.html#_use_literal_best_compression_literal)). One of the discriminating features of Apache UserALE.js is its precision--its ability to capture both the target of user behaviors and the entire DOM path of that target in searchable ways--and rich meta data. Apache UserALE.js fields like `path` and `pageUrl` can get quite long for certain kinds of web sites and applications (see below: a sample `path` for a Kibana element). It's worth considering, for example, using our [API]({{ '/docs/useralejs/API' | prepend: site.baseurl }}) to abstract fields like `path` with labels, if you need precision, or if you can get by with only knowing users' `target` elements. Similarly, you might consider relying on `pageTitle` rather than `pageUrl` if they sufficiently differentiate pages and if you're dealing with very deep website trees. Through simple [modifications to UserALE.js source]({{ '/docs/useralejs/modifying' | prepend: site.baseurl }}), you can alias verbose fields in your logs to reduce resource consumption
    ```shell
    ...
        "pageTitle": "Discover - Kibana",
        "toolName": "test_app",
        "userId": "nobody",
        "type": "click",
        "target": "a.kuiButton kuiButton--small kuiButton--secondary",
        "path": [
          "a.kuiButton kuiButton--small kuiButton--secondary",
          "div.kbnDocTableDetails__actions",
          "td",
          "tr",
          "tbody",
          "table.kbn-table table",
          "div.kbnDocTable__container",
          "doc-table",
          "section.dscTable",
          "div.dscResults",
          "div.dscWrapper__content",
          "div.dscWrapper col-md-10",
          "div.row",
          "main.container-fluid",
          "discover-app.app-container",
          "div.application tab-discover",
          "div.app-wrapper-panel",
          "div.app-wrapper",
          "div.content",
          "div#kibana-body",
          "body#kibana-app.coreSystemRootDomElement",
          "html",
          "#document",
          "Window"
        ...
    ```
   

1. Apache Flagon is built to scale as a platform, allowing you to connect additional services to your platform that consume user behavioral data. When considering scale, the *number of services* you connect to your Apache Flagon platform will affect your Elastic stacks' performance. Any production-level deployment will require, at minimum a simple three-node [Elastic cluster](https://dzone.com/articles/elasticsearch-tutorial-creating-an-elasticsearch-c) (with one load-balancing node). As you scale and configure that cluster, be mindful that in addition to performing indexing functions, Elasticsearch is also servicing queries and aggregations of that data. Analytical services connected to Apache Flagon, especially if they both read and write back to index, can consume significant resources and increase indexing and search time. This can be problematic for real-time analytical and monitoring applications (including Kibana). This can also result in data loss if logs are flushed from pipelines prior to being indexed. For hefty analytical services, it may be worth dedicating specific nodes in your cluster to service them. 

For the reasons above, its really critical to do some benchmarking for your use-case prior to deciding on a scaling strategy. Below, you'll find some guidance for how to do this with Apache Flagon and Elastic tools. We also provide some simple benchmarks and underlying assumptions. However, each webpage or application is a bit different, so it's important create some of your own benchmarks for comparison with ours.
### Benchmarking Tools and Methods for Sizing your Apache Flagon Stack

Benchmarking with Elastic isn't as straight forward as figuring out an average log size in bytes and then calculating how many logs per second. The size of Apache UserALE.js logs is too variable (see above) within pages and across log types. Additionally, a single log may actually be indexed as separate, nested documents in Elastic. Moreover, Elastic doesn't really 'think' at the document-level, they think about *indexes*.
  
This guide outlines a set of tools and steps for running your own benchmarking study using Flagon's [single-node container]({{ '/docs/stack' | prepend: site.baseurl }}) 

To generate log data, we'll be using our [UserALE.js Example](https://github.com/apache/incubator-flagon-useralejs/tree/master/example) test kit. This is a useful test utility that makes it easy to [modify]({{ '/docs/useralejs/modifying' | prepend: site.baseurl }}) UserALE.js HTML5 and API parameters on the fly. Again, for your own purposes, you'll want to experiment with your own page/application for more accurate benchmarks.

1. **Start up the Apache Flagon Elastic Stack (detailed instructions [here](https://github.com/apache/incubator-flagon/tree/master/docker)).** 
    
    Important: as noted in the instructions, you'll need to have collected some log data to establish the index.

1. **Once you've started up Elasticsearch, Logstash, Kibana, and metricbead, and confirm that you can see logs in Kibana, take a look at the `userale` index stats.**  
    ```shell
    #Index Stats using Elastic's _stats API
    $ curl localhost:9200/index_name/_stats?pretty=true
  
    #Tailored for Apache Flagon default configs
    $ curl localhost:9200/userale/_stats?pretty=true
 
    #Or, view in your browser
    http://localhost:9200/userale/_stats?pretty=true
    ```
    Find the `indices` portion of the output. It looks like this (#note annotations):
    ```shell
    ...
    "indices" : {
        "userale" : { #this is the index UserALE.js logs write to
          "uuid" : "0h0Wxe2cSwqMALs4QCJ8Tw",
          "primaries" : {
            "docs" : {
              "count" : 1284, #this is the total # of documents in the userale index
              "deleted" : 0
            },
            "store" : {
              "size_in_bytes" : 241212 #this is size of the index in bytes (.24 MB).
    ...
    ```
    Let's call this value a baseline for your benchmarking. 
    
    As you continue your benchmarking, the `userale` index "size_in_bytes" will be one of your key metrics.
    
1. **Next, let's see how much data UserALE.js produces with parameters set to default on your page or app.** We'll call this: "drinking from the flame-thrower". 

    Drop in a UserALE.js script-tag into your project (see [instructions]({{ '/docs/useralejs' | prepend: site.baseurl }})).
    
    Here is an example of the script tag we're using in the UserALE.js Example page for this test
    ```
    <script
      src="file:/// ... /UserALEtest/userale-1.1.0.min.js"
      data-url="http://localhost:8100/"
      data-user="example-user"
      data-version="1.1.1"
      data-tool="Apache UserALE.js Example"
    ></script>
    ```
    To get a conservative upper-bound, generate as many behaviors in your page/app as you can (go nuts with mouse-overs, clicks and scrolls). 
    
    We did just that for 5 minutes solid. Here's what our `userale` index looks now (#note annotations):
   
    ```shell
     "indices" : {
       "userale" : {
         "uuid" : "0h0Wxe2cSwqMALs4QCJ8Tw",
         "primaries" : {
           "docs" : {
             "count" : 3282, #new userale document count
             "deleted" : 0
           },
           "store" : {
             "size_in_bytes" : 820978 #new size of the index (.82 MB)
    ```
    **Some simple math gives +1,998 documents (~2000) and +579,866 bytes (~.58 MB) generated with UserALE.js by one user in 5 mins**. Continuing our ultra-conservative benchmarking, lets assume this data generation rate over an 8 hour period each day, which gives **~56 MB per day**. At 20 working days in an average month, that gives **1.1 GB per month**. 
    
    Again, **this is ultra-conservative**; no one uses pages or applications this way (even games). That's a lot of data for a single-user, but these are valuable, worst-case-scenario upper-bounds to start with. 
    
    If you're a scientist or researcher, these figures might be fine, especially if you want to pour over this data. If you're just interested in how people are moving through your content, this is probably overkill. The biggest culprit: take a look at our `Apache Flagon Page Usage Dashboard` to see.
    
    ![alt text][mouseOverBench1]
    
    Mouseovers accounted for a lot of the data we just produced. Raw mouseover data is written to log very frequently and generates a lot of documents in Elastic. 

1. **Now, let's take the simplest approach to scaling back UserALE.js and see how this changes your data generation rate**.
    
    What we're doing is using the UserALE.js `configs` that can be passed through the script tag to effectively "downsample" certain channels (e.g., mouseovers) that generate a lot of documents quickly.
    
    Here's what our script tag looks like now: 
    ```
    <script
      src="file:/// ... /UserALEtest/userale-1.1.0.min.js"
      data-url="http://localhost:8100/"
      data-user="example-user"
      data-version="1.1.1"
      data-resolution=1000 #We've increased the delay between collection of "high-resolution" events (e.g., mouseover, scrolls) by 100%.
      data-tool="Apache UserALE.js Example"
    ></script>
    ```
    Next, replicate your benchmarking, behaving in a similar way for the same amount of time.
    
    Here's what our `userale` index looks like now after another 5 minutes of vigorous behavior. 
        
    ```shell
     "indices" : {
       "userale" : {
         "uuid" : "0h0Wxe2cSwqMALs4QCJ8Tw",
         "primaries" : {
           "docs" : {
             "count" : 4800, #new userale document count
             "deleted" : 0
           },
           "store" : {
             "size_in_bytes" : 115978 #new size of the index (1.1 MB)  
    ```
    **Maths give us +1518 documents (~500 fewer than our first benchmark) and +295,000 bytes (~.30 MB; ~40% less growth in the store size than previous) generated by one user in 5 minutes.** That would be **28.8 MB per day** or **~576 MB per working month**, per user. We've cut down our data generation considerably by modifying one parameter in our script tag.

    Why? look at the new proportion of mouseover events... we shaved those down by ~50%. As that event stream has the highest data generation, net-net we generated about 25% fewer documents with the same amount and duration of behavior:
    
    ![alt text][mouseOverBench2] 
    
1.  **Still too much data? Below are some other things that you can do to curb the growth of your `userale` index** as you continue benchmarking with your page/app.

    * If you don't need all the different types of events UserALE.js gathers by default, you can easily curate the list of events you by modifying [UserALE.js source](https://github.com/apache/incubator-flagon-useralejs/tree/master/src) (`attachHandlers.js`), then building a custom UserALE.js script.
    * If you don't need both raw logs (specific records of events) and interval logs (aggregates of specific events over a time interval), you can easily drop intervals by modifying UserALE.js [UserALE.js source](https://github.com/apache/incubator-flagon-useralejs/tree/master/src) (`attachHandlers.js` or `packageLogs.js`), then building a custom UserALE.js script.
    * You can reduce the number of meta-data fields written to each UserALE.js log, by modifying [UserALE.js source](https://github.com/apache/incubator-flagon-useralejs/tree/master/src) (`packageLogs.js`), then building a custom UserALE.js script.
    * If you want different levels of logging granularity (more or less data) for different pages within your site/app, you can build different versions of UserALE.js to service different pages. Just name each version differently and point to the one you want with script-tags, page-by-page.
    * You can use our [API]({{ '/docs/useralejs/API' | prepend: site.baseurl }}) for surgical precision in how specific elements (targets) on your page generate data.
    
### Other Tools to Support Benchmarking for Scaling

1. In our benchmarking guide, we primarily used [Elastic's `Stats` API](https://www.elastic.co/guide/en/elasticsearch/reference/current/indices-stats.html). This provides very verbose output, which is pretty useful for understanding all of your indexes, indexing behavior, and how data is being distributed across nodes. You can use other [Elastic APIs](https://www.datadoghq.com/blog/collect-elasticsearch-metrics/#index-stats-api) for different views of what's going on inside your Apache Flagon stack. For more streamlined views into your indices, try the `CAT` API. Try this call in your browser:

    http://localhost:9200/_cat/indices?format=json&bytes=b&pretty
    
    Output is very simple and index sizes stack on top of one another
    ```shell
    [
      {
        "health" : "green",
        "status" : "open",
        "index" : ".kibana_1",
        "uuid" : "FnI_6AQYQEWp2mIxSlM8HQ",
        "pri" : "1",
        "rep" : "0",
        "docs.count" : "184",
        "docs.deleted" : "13",
        "store.size" : "366457",
        "pri.store.size" : "366457"
      },
      {
        "health" : "yellow",
        "status" : "open",
        "index" : "metricbeat-6.6.2-2019.04.22",
        "uuid" : "pDYNmzsxTFu9Z0Tc1_GdLw",
        "pri" : "5",
        "rep" : "1",
        "docs.count" : "4687",
        "docs.deleted" : "0",
        "store.size" : "6309920",
        "pri.store.size" : "6309920"
      },
      {
        "health" : "green",
        "status" : "open",
        "index" : "userale",
        "uuid" : "0h0Wxe2cSwqMALs4QCJ8Tw",
        "pri" : "1",
        "rep" : "0",
        "docs.count" : "14018",
        "docs.deleted" : "0",
        "store.size" : "2235963",
        "pri.store.size" : "2235963"
      },
      {
        "health" : "yellow",
        "status" : "open",
        "index" : "metricbeat-6.6.2-2019.04.27",
        "uuid" : "wTyUBXvNRMOwpR4lDF9BNA",
        "pri" : "5",
        "rep" : "1",
        "docs.count" : "107124",
        "docs.deleted" : "0",
        "store.size" : "63263644",
        "pri.store.size" : "63263644"
      }
    ]
    ```
1. There are a lot of other things going on inside your Apache Flagon Elastic stack. Note above that depending on what you deploy (e.g., metricbeat) you may have additional indices that need monitoring. For one, Metricbeat indices grow fast and you'll want to benchmark that too. The Kibana index will grow as well, but not as much; it depends on how how many additional objects you build (e.g., visualizations, indicies, dashboards). Both the `STATS` and `CAT` APIs are very useful for seeing their growth.

1. There are also a lot of things going on inside your server or Docker containers, depending on how you deploy your Apache Flagon Elastic Stack. This is why we've configured a metricbeat service to run with Flagon. In the same way that you can benchmark your data generation rate while you generate behavioral logs in your page/app, you can also look at how your Apache Flagon stack is utilizing disk and compute resources. When you spin up our single-node Apache Flagon container, make sure to start up metricbeat. In Kibana you can time-filter to specify the date/time of your benchmarking data collections, and look at aggregate metrics and statistics of system, host, and container performance. These are really useful for benchmarking the kind of compute resources you'll be consuming, and how quickly. See a sample below:

    ![alt text][metricBeat]
    
### Wonky Things that Can and Will Happen as You Benchmark

1. You just finished a benchmarking session after modifying UserALE.js to produce less data. What you find is that your new store size is either dramatically bigger than your last benchmark or smaller (which should be impossible). What happened is a thing called [merging](https://www.elastic.co/guide/en/elasticsearch/guide/current/merge-process.html). It is a good thing, but it can be a confusing thing while you're benchmarking against your store size. Essentially, each Elastic shard is an index. As data is collected it's gathered into segments within an index. Each segment is an element of your index and takes up storage, so as your collect data, especially if its collected at a high rate, the number of segments grows quickly consuming a lot of storage. Elastic (Lucene) indexes, merge these segments into larger and larger segments, thus reducing the overall number of segments to reduce storage needs and resource consumption. This process does involve duplicating and deleting old segments. This means that depending on when you make a call to Elastic's `STATS` API, you might be looking at the store size at different stages in the merging process. If your store size looks smaller than your last benchmark. You should re-run it then wait. If your store size looks way to big, then just wait. After a minute or two, call the `STATS` API again, and you'll probably see a store size that makes much more sense once Elastic has finished its latest merge operation. 

### Summary 
Benchmarking and adjusting your data-rate so that you can scale how you want to is made very easy in Apache Flagon. We combine easily deployed and modified capabilities with the power of Elastic's APIs and visualization capabilities. Again, our single-node container is not a scaling solution. It's an ingredient, a potent one, that not only serves as the building block for your cluster, but also a benchmarking tool so that your Apache Flagon cluster meets your needs for capability, scale and cost.
             
Subscribe to our [dev list](dev-subscribe@flagon.incubator.apache.org) and join the conversation!

[mouseOverBench1]: https://github.com/apache/incubator-flagon/blob/FLAGON-344/site/_site/images/mouseOverBench1.png "Proportion of Mouseovers (Benchmark 1)"
[mouseOverBench2]: https://github.com/apache/incubator-flagon/blob/FLAGON-344/site/_site/images/mouseOverBench2.png "Proportion of Mouseovers (Benchmark 2)"
[metricBeat]: https://github.com/apache/incubator-flagon/blob/FLAGON-344/site/_site/images/metricBeat.png "Metricbeat Dashboard"
---
title: Scaling Considerations
component: stack
permalink: /docs/stack/scaling/
priority: 0
---

### Scaling Apache Flagon: An Introduction and First Principles

This guide touches on some basic principles to keep in mind as you're planning for scale with [Apache Flagon](https://github.com/apache/incubator-flagon). 

We provide high-level guidance and considerations for working with an Elastic stack to scale [Apache UserALE.js]({{ '/docs/useralejs' | prepend: site.baseurl }}) services. 

This guide also provides an overview of benchmarking tools and methodologies for accurately gauging your scaling needs.

**"It Depends..."**

The best way to scale Apache Flagon depends entirely on your use-case: 

* how you'll use your Apache UserALE.js data;  
* which [data streams]({{ '/docs/useralejs/dataschema' | prepend: site.baseurl }}) you'll use;
* how long you need to keep your data.

**The Apache Flagon Single-Node Elastic Container is an Ingredient, Not a Whole Solution**

The single-node Elastic (ELK) build distributed by [Apache Flagon]({{ '/docs/stack' | prepend: site.baseurl }}) is not alone suitable for most production-level use-cases. 

This build may be suitable for limited user-testing; just a few days of data collection from a specific application, from just a few users. 

However, a single-node Elastic build will fail quickly for any enterprise-scale use-cases. 

Instead, this container is meant to be a building block for larger solutions: 

1. Our ELK .yml config files for our Docker container can be used as the building-blocks for your very own load-balanced, [multi-node cluster](https://dzone.com/articles/elasticsearch-tutorial-creating-an-elasticsearch-c).
1. You can use our [Kubernetes build](https://github.com/apache/incubator-flagon/tree/master/kubernetes), which relies on our Docker assets, to scale your Apache Flagon stack to meet your needs.
1. You can use our single-node container to scale out in [AWS Elastic Beanstalk (EBS)](https://aws.amazon.com/elasticbeanstalk/).

**Apache Flagon Data Also Scales**

Flagon's behavioral logging capability, [Apache UserALE.js]({{ '/docs/useralejs' | prepend: site.baseurl }}) also scales. The most efficient way to manage scale and resources, is to [configure]({{ '/docs/useralejs/API' | prepend: site.baseurl }}) or [modify]({{ '/docs/useralejs/modifying' | prepend: site.baseurl }}) UserALE.js. 
### Sizing Up an Elastic Stack

Elasticsearch isn't a database, its a document store; UserALE.js "logs" aren't logs once they're indexed in Elastic, they become searchable documents. 

Elastic has many useful [guides]((https://www.elastic.co/blog/found-sizing-elasticsearch)) on sizing and scaling. Below, we're adding some thoughts based on Apache Flagon's own eccentricities.

####Document generation rate is the most important consideration to scaling 

Default [Apache UserALE.js parameters]({{ '/docs/useralejs' | prepend: site.baseurl }}) produce loads of [data]({{ '/docs/useralejs/dataschema' | prepend: site.baseurl }}), even from a single users. 

We strongly suggest that you consider whether you need data from all our event-handlers. 

If you don't need mouseover events, for example, you can dramatically reduce the rate at which you generate data and the resources you'll need. 

Instead, you can [modify source]({{ '/docs/useralejs/modifying' | prepend: site.baseurl }}) or use the [UserALE.js API]({{ '/docs/useralejs/API' | prepend: site.baseurl }}), and/or use [configurable HTLM5 parameters in our script tag]({{ '/docs/useralejs' | prepend: site.baseurl }}) to manage data generation rate.

####Resource needs will also grow with document length

[Strings](https://blog.appdynamics.com/product/estimating-costs-of-storing-documents-in-elasticsearch/) within UserALE.js logs (see also [Elastic's tips on indexing strings](https://www.elastic.co/guide/en/elasticsearch/reference/5.5/tune-for-disk-usage.html#_use_literal_best_compression_literal)) can add to scaling needs. 

One of the discriminating features of Apache UserALE.js is its precision:

* it captures target DOM elements;
* it captures the DOM path that elements are nested in;
* it captures loads of metadata (URI, page title, page url, referrer, etc.). 

UserALE.js fields like `path` and `pageUrl` can be lengthy for certain pages, increasing string length per document. 

Instead, you might consider relying on `pageTitle` rather than `pageUrl`, or just `target` instead of `path`

Below is a sample `path` for a Kibana element:

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
   
Through simple [modifications to UserALE.js source]({{ '/docs/useralejs/modifying' | prepend: site.baseurl }}) or with the UserALE.js [API]({{ '/docs/useralejs/API' | prepend: site.baseurl }}) you can alias verbose fields in your logs to reduce resource consumption.

####Additional services attached to your stack can increase resource consumption

Apache Flagon scales--Elastic products make it easy to attach other services to your Apache Flagon stack.

The *number of services* connected to your stack will affect your Elastic stacks' performance. 

Any production-level deployment will require, at minimum a simple three-node [Elastic cluster](https://dzone.com/articles/elasticsearch-tutorial-creating-an-elasticsearch-c) (with one load-balancing node). 

As you configure that cluster, be mindful that Elasticsearch is indexing and servicing queries and aggregations for connected servies.
 
Analytical services connected to the stack can consume significant resources and increase indexing and search time. 

This can be problematic for real-time analytical and monitoring applications (including Kibana). 

For hefty analytical services, it may be worth dedicating specific nodes in your cluster to service them. 


### Benchmarking Tools and Methods for Sizing your Apache Flagon Stack

For the reasons above, its really critical to do some benchmarking for your use-case prior to deciding on a scaling strategy.

This guide outlines a set of tools and steps for running your own benchmarking study using Flagon's [single-node container]({{ '/docs/stack' | prepend: site.baseurl }}). 

To generate log data, use our [UserALE.js Example](https://github.com/apache/incubator-flagon-useralejs/tree/master/example) test utility or your own website. 

Our test utility that makes it easy to [modify]({{ '/docs/useralejs/modifying' | prepend: site.baseurl }}) UserALE.js HTML5 and API parameters on the fly. 

However, you'll want to experiment with your own page/application for more accurate benchmarks.

1. **Start up the Apache Flagon Elastic Stack (detailed instructions [here](https://github.com/apache/incubator-flagon/tree/master/docker)).** 
    
    Important: as noted in the instructions, you'll need to have collected some log data to establish the index.

1. **Once Elasticsearch, Logstash, Kibana, and metricbeat are up, look at the `userale` index stats.**  
    ```shell
    #Index Stats using Elastic's _stats API
    $ curl localhost:9200/index_name/_stats?pretty=true
  
    #Tailored for Apache Flagon default settings
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
    Let's call this value a simple benchmark. 
    
    As you continue benchmarking, the `userale` index "size_in_bytes" will be one of your key metrics.
    
1. **Next, let's see how much data UserALE.js produces with default parameters on your page or app.** 

    Drop in a UserALE.js script-tag into your project (see [instructions]({{ '/docs/useralejs' | prepend: site.baseurl }})).
    
    Here is an example of the script tag (with `settings`) we're using in the UserALE.js Example page for this test:
    ```
    <script
      src="file:/// ... /UserALEtest/userale-1.1.0.min.js"
      data-url="http://localhost:8100/"
      data-user="example-user"
      data-version="1.1.1"
      data-tool="Apache UserALE.js Example"
    ></script>
    ```
    To get a conservative upper-bound, generate as many mouseover and scroll behaviors in your page/app as you can. 
    
    Doing that for 5 minutes solid, our `userale` index looks like this (#note annotations):
   
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
    **That's +1,998 documents (2000) and +579,866 bytes (.58 MB) generated with UserALE.js by one user in 5 mins**. 
    
    Assuming this rate over an 8 hour period each day for 20 working days: that's **1.1 GB per month**. 
    
    **This is an ultra-conservative, worst-case-scenario estimate** because no one uses pages or applications this way. 
    
    If you're a scientist or researcher, these figures might be fine, but it might be overkill for business analytics.
    
    To find the biggest culprit in data generation: take a look at our `Apache Flagon Page Usage Dashboard` to see.
    
    <img src= "/images/mouseOverBench1.png" width="750" height="500" />
    
    Mouseovers accounted for a lot of the data we just produced--its written frequently to index. 
   
    
1. **Next, scale back UserALE.js mouseover handling and see how this changes data generation rate**.
    
    Using the UserALE.js HTML5 `settings` in our script tag, you can "downsample" certain event handler that generate a lot of documents.
    
    Here's what our script tag looks like now: 
    ```
    <script
      src="file:/// ... /UserALEtest/userale-1.1.0.min.js"
      data-url="http://localhost:8100/"
      data-user="example-user"
      data-version="1.1.1"
      data-resolution=1000 #increased the delay between collection of frequent events (e.g., mouseovers).
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
    **That is +1518 documents and +295K bytes (.30 MB)**
    
    But, it's 500 fewer than our first benchmark and ~40% less growth in the store.
    
    At **~576 MB per working month** we've cut data generation considerably by modifying one parameter in the script tag.

    The proportion of mouseover events is down by ~50%, and 25% fewer documents overall:
    
    <img src= "/images/mouseOverBench2.png" width="750" height="500" />
    
1.  **Still too much data? Below are some other ways to curb the growth of your `userale` index**.

    * Modify [UserALE.js source](https://github.com/apache/incubator-flagon-useralejs/tree/master/src) to cut down on event handlers (`attachHandlers.js`).
    * Drop interval logging by modifying UserALE.js [UserALE.js source](https://github.com/apache/incubator-flagon-useralejs/tree/master/src) (`attachHandlers.js` or `packageLogs.js`).
    * Reduce the amount of metadata you collect by modifying [UserALE.js source](https://github.com/apache/incubator-flagon-useralejs/tree/master/src) (`packageLogs.js`).
    * Use different UserALE.js script builds for different pages within your site/app to serve different logging needs.
    * You can use our [API]({{ '/docs/useralejs/API' | prepend: site.baseurl }}) for surgical precision in how specific elements (targets) on your page generate data.
    
### Other Tools to Support Benchmarking for Scaling

In our benchmarking guide, we primarily used Elastic's [`Stats` API](https://www.elastic.co/guide/en/elasticsearch/reference/current/indices-stats.html). 

You can **use other [Elastic APIs](https://www.datadoghq.com/blog/collect-elasticsearch-metrics/#index-stats-api)** for different views of what's going on inside your Apache Flagon stack. 

For more streamlined views into your indices, try the `CAT` API. Try this call in your browser:

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
    
**Use Flagon's pre-configured metricbeat service** to run with Flagon. 

You can use this utility to see how your Apache Flagon stack is utilizing disk and compute resources. 

See a sample view of Metricbeat stats below:

<img src= "/images/metricBeat.png" width="750" height="500" />
    
### Wonky Things that Can and Will Happen as You Benchmark

You just finished a benchmarking session after modifying UserALE.js to produce less data. 

What you find is that your new store size is either dramatically bigger than your last benchmark or smaller (which should be impossible).
 
What happened is a thing called [merging](https://www.elastic.co/guide/en/elasticsearch/guide/current/merge-process.html). 

As data is collected it's gathered into segments within an index. Each segment is an element of your index and takes up storage.

As Elastic (Lucene) indexes, it merges these segments into larger segments to reduce the overall number of segments to minimize storage. 

This means that a call to Elastic's `STATS` API can result in a view into the store size at different stages in the merging process. 

If your store size looks smaller than your last benchmark. You should re-run it then wait. 

If your store size looks way to big, then wait. After a minute, call the `STATS` API again, and you'll likely see a more sensible store size.
 
### Summary 
Benchmarking and adjusting your data-rate so that you can scale how you want to is made very easy in Apache Flagon. 

We combine easily deployed and modified capabilities with the power of Elastic's APIs and visualization capabilities. 

Again, Flagon's single-node container is not a scaling solution. 

It's a building block benchmarking tool to help you build and manage scale and cost.
             
Subscribe to our [dev list](dev-subscribe@flagon.incubator.apache.org) and join the conversation!


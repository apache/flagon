---
title: Getting Started
component: stack
permalink: /docs/stack/
priority: 0
---

The Apache Flagon project provides a streamlined deployment solution for including behavioral logging capabilities in your project and for monitoring and analyzing your log data in a containerized Elastic backend.  Our Docker container includes an Elastic backend, pre-configured, interactive Kibana dashboards. The container also includes prototype applications for exploration, Apache Distill and Apache Tap.  

Before you begin, you'll need [NPM and Node.js](https://nodejs.org/), [Docker](https://www.docker.com/) and  [Docker Compose](https://docs.docker.com/compose/install/) installed before you start.

### Building and Deploying UserALE.js

[Apache UserALE.js](https://github.com/apache/incubator-flagon-useralejs) is the Apache Flagon's thin-client behavioral logging solution. Below, you'll find short-hand instructions for getting started with UserALE.js. For complete instructions, see our [README](https://github.com/apache/incubator-flagon-useralejs/blob/master/README.md).

First, download the [release](http://flagon.incubator.apache.org/releases/) or clone our [repository on GitHub](https://github.com/apache/incubator-flagon-useralejs/tree/master). Apache UserALE.js is also available as an [NPM package](https://www.npmjs.com/package/useralejs).

Next, **install Dependencies**.
  ```shell
  #intall NPM packages into build directory
  $ npm install
  ```

Then, **build UserALE.js**.
  ```shell
  #produce UserALE.js build artifacts
  $ npm run build
  ```

The build process produced a minified version of UserALE.js and a Web Extension package, giving you two options depending on your needs. 

**Option 1: Include Apache UserALE.js in your project:**

  ```markdown
  #include userale in your project via script tag 
  <script src="/path/to/userale-1.0.0.min.js" data-url="http://yourLoggingUrl"></script>
  ```
Apache UserALE.js allows for configuration via HTML 5 data parameters. For a complete list of options, see the [README](https://github.com/apache/incubator-flagon-useralejs/blob/master/README.md). You can also modify Apache UserALE.js using our API. Find examples in our [repos](https://github.com/apache/incubator-flagon-useralejs/tree/FLAGON-192).

**Option 2: Follow the [instructions](https://github.com/apache/incubator-flagon-useralejs/tree/FLAGON-192/src/UserALEWebExtension) to install the Apache UserALE.js web extension into your browser.**

You can now start generating behavioral log data from your page, or through your browser. To view these logs, you can either utilize our [example logging server](https://github.com/apache/incubator-flagon-useralejs/tree/master/example) and log to file, or you can log directly to our Elastic backend. For complete instructions, see the [README](https://github.com/apache/incubator-flagon/tree/master/docker)
### Building and Using the Elastic Backend

[Apache Flagon](https://github.com/apache/incubator-flagon) utilizes an Elastic stack for transforming, indexing, and storing log data. With Elastic, you'll not only have the ability to search and query log dat, but you'll also be able to monitor it and visualize it through Kibana.

To build our single-node Elastic instance, **first clone our [Docker repo](https://github.com/apache/incubator-flagon/tree/master/docker)**.

Then, **start up a virtual machine**.
  ```shell
# start virtual machine and requisite network 
$ docker-machine create --virtualbox-memory 3072 --virtualbox-cpu-count 2 senssoft
$ docker-machine ssh senssoft sudo sysctl -w vm.max_map_count=262144
$ docker network create esnet
  ```
Next, **start Elastic services**.

  ```shell
 #start Elastic services
 $ docker-compose up -d elasticsearch
 $ docker-compuse up -d logstash
 $ docker-compose up -d kibana
  ```
**Configure UserALE.js** to send logs to localhost:8100. This is easy: either modify the script tag for port 8100 or open up the "options" tab of the web extension and enter localhost:8100 as your logging end-point.

Before starting Kibana, **generate some logs**. Move your mouse around, click around, etc. Do this for a couple minutes to populate the index.

Finally, **navigate to localhost:5601 (Kibaba), set an index pattern, and load our visualizations and dashboards** to see your logs. Find simple instructions in our [README](https://github.com/apache/incubator-flagon/tree/master/docker).

Note that single-node container isn't meant for persistent use, but is built to scale. See our [Kubernetes build](https://github.com/apache/incubator-flagon/tree/master/kubernetes), or configure your own cluster using this container to suite your needs.

Subscribe to our [dev list](dev-subscribe@flagon.incubator.apache.org) and join the conversation!
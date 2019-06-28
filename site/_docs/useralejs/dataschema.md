---
title: UserALE.js DataSchema
component: useralejs
priority: 4
---

#The UserALE.js Data Schema

This guide describes the structure of content of [Apache UserALE.js](https://github.com/apache/incubator-flagon-useralejs) 
logs, including:
 * which behaviors UserALE.js listens to;
 * which meta data UserALE.js attaches to logs, for context:
 * different types of UserALE.js logs, and their usage.

##UserALE.js Logs

UserALE.js logs, by default, contain a lot more data than you might be used to from other business analytics products. 
The reason for this is simple: business analytics are best suited for click-through analytics (e.g., funnel analysis), 
however, UserALE.js is powerful enough for *workflow analysis*.

Workflow analysis is about understanding the complex interdependency between elements and behaviors within and across 
pages. Workflow analysis at this level is really crucial for understanding how people think about the information on 
your site or app, understanding efficiency in information discovery, and for gauging how novices explore pages compared 
to experts/or superusers.

In order to do workflow analysis, and support business analytics, you need a very granular way of looking at user 
interactions with page elements. Below, we'll walk you through some of that data and what it looks like so that you're 
comfortable using it and modifying it.

This is a pretty standard UserALE.js log from our [example test utility](https://github.com/apache/incubator-flagon-useralejs/blob/master/example/index.html): 

```html
    "microTime": 0.185,
    "minor_ver": "0",
    "@timestamp": "2019-06-28T16:00:20.790Z",
    "type": "click",
    "target": "button#test_button",
    "details": {
      "clicks": 13,
      "shift": false,
      "meta": false,
      "alt": false,
      "ctrl": false
    },
    "major_ver": "2",
    "toolVersion": "2.0.0",
    "pageReferrer": "",
    "clientTime": 1561737620520,
    "userAction": true,
    "location": {
      "x": 40,
      "y": 19
    },
    "host": "172.18.0.1",
    "path": [
      "button#test_button",
      "div.container",
      "body",
      "html",
      "#document",
      "Window"
    ],
    "sessionID": "session_1561737570573",
    "toolName": "Apache UserALE.js Example",
    "pageTitle": "UserAleJS - Example Page",
    "logType": "raw",
    "pageUrl": "file:///Users/jpoore/Documents/Apache_Flagon/test/incubator-flagon-useralejs/example/index.html",
    "userId": "example-user",
    "useraleVersion": "2.0.0",
    "patch_ver": "0"
    ]

```

It's a lot, but it makes sense in context:

###UserALE.js Event Tracking

The fields below are the 'bread-and-butter' for workflow analysis. They identify what users do and what they interact 
with. Again, UserALE.js is built so that you can get this information from anywhere on your page or app without 
attaching a ton of hooks at src.  

```html
    "type": "click", [this field documents the kind of user behavior observed]
    "target": "button#test_button", [this field documents the site/app element a user interacted with]
    "path": [  {this is the DOM path to the "target" element, which is critical for disambiguation between elements}
      "button#test_button",
      "div.container",
      "body",
      "html",
      "#document",
      "Window"]

``` 

The fields above are also the ones ('target' & 'path') that you may want to specially label for certain elements that 
are important. See our guide on [the UserALE.js API]({{ '/docs/useralejs/API' | prepend: site.baseurl }}) to understand 
how to use this simple utility. 

For more information about the kinds of behaviors (event classes) we collect, check out our guide for 
[modifying UserALE.js source code](({{ '/docs/useralejs/modifying' | prepend: site.baseurl }}), which has a useful 
run-down of all our eventHandlers.

###Temporal Handling in UserALE.js

Time is a very important concept in UserALE.js. It's critical to the concept of an event and the sequential aspect of 
workflow analysis. Below are the fields related to temporal data capture:

```html
    "clientTime": 1561737620520,    [UserALE.js collects time from the client when a log is generated]
    "microTime": 0.185,             [When a log is wrtten, we write microtime too, not every database parses it]
    "@timestamp": "2019-06-28T16:00:20.790Z", [If you use our Elastic backend, you will see indexing time too]
```

###UserALE.js Meta-Data

You want context? We have all of the things for all of your events:

####Event Context

Every event has a little nuance, UserALE.js gets it all.

What happens if you get like a zillion 'rage-quit' clicks in a really, really short period of time? UserALE.js will add 
to details the number of consecutive clicks, for example that were written into a single log. It will also give you 
context about other inputs at the time of the event (e.g., shift, etc.)

```html
    "details": {
      "clicks": 13,
      "shift": false,
      "meta": false,
      "alt": false,
      "ctrl": false
    },
```

But, where was the cursor at the time of a click? In addition to 'target', you'll get location of the cursor two for 
mouseover and click data, too!

```html
    "location": {
      "x": 40,
      "y": 19
    },
```

[UserALE.js' WebExtension](https://github.com/apache/incubator-flagon-useralejs/tree/master/build) is deployed directly 
into your browser, as a result you'll get browser events. Examples are below, however, with certain browser behavior 
(e.g., new tabs), you'll see our details field has some pretty useful data that isn't available at the page, because it 
hasn't loaded yet, or because it's a browser property!

```html
    "details": {
      "audible": false, [audio media on the page?]
      "title": "Discover - Kibana",
      "selected": true, 
      "tabId": 64, [uniquely tracks each tab] 
      "windowId": 73, [uniquely tracks each window]
      "muted": false,
      "index": 0,
      "incognito": false, [private browsing?]
      "url": "http://localhost:5601/app/kibana#/discover?_g=(refreshInterval:(pause:!t)",
      "active": true, []tab is active?[]
      "pinned": false
    },
```

####Page/App Context

If a user clicks on a thing and you know nothing about that thing, you're toast!

UserALE.js gives a lot context about your page or app. Some are automatically grabbed from the page, some are 
configurable through our [script tag]({{ '/docs/useralejs' | prepend: site.baseurl }}) 

```html
    "toolVersion": "2.0.0", [you can give a semantic versioning of your page or tool]
    "pageReferrer": "", [grabbed from the page, from which page did your users find your page/app]
    "toolName": "Apache UserALE.js Example", [give your tool an alis through our script tag]
    "pageTitle": "UserAleJS - Example Page", [page title grabbed from page]
    "pageUrl": "file:///Users/jpoore/Documents/Apache_Flagon/test/incubator-flagon-useralejs/example/index.html" 
```
To find out more and how to change the context attached to event logs, check out our 
[modifying UserALE.js source code]({{ '/docs/useralejs/modifying' | prepend: site.baseurl }}) guide.

####User Context

UserALE.js has its own methods for gathering user context, and it can integrate with other methods you might have 
(e.g., cookies)

```html
    "sessionID": "session_1561737570573", [This session ID is unique to a specific page visit]
    "userId": "example-user", [You can also pass a unique userId using script-tag methods, or others (e.g., our API)]
    "host": "172.18.0.1", [IP address is pretty useful to check out the cardinality of seats using your tools]
```

To see how to pass in a userId from say, a url, check out our [script tag docs]({{ '/docs/useralejs' | prepend: site.baseurl }}).

Other things you might want to do (e.g., cookies) can also be passed to userId via [the UserALE.js API]({{ '/docs/useralejs/API' | prepend: site.baseurl }}) 
`mapping` function.

##UserALE.js Log Types

For the most part, UserALE.js logs are uniform. However, there are some variations based on the type of d
eployment and type of log.

###WebExtension Logs

WebExtension logs from page-level events will look identical to the logs from our script tag method.

WebExtension logs from browser-level events are a bit different, these include focus, activation, and zoom change of the 
browser tab itself. See below:

```html
"host": "172.18.0.1",
    "path": null,
    "microTime": 0.835,
    "@timestamp": "2019-06-28T18:05:03.681Z",
    "sessionID": "session_1561741679119",
    "type": "browser.tabs.onZoomChange",
    "target": null,
    "details": {
      "audible": false,
      "oldZoomFactor": 1,
      "selected": true,
      "tabId": 64,
      "title": "Discover - Kibana",
      "windowId": 73,
      "newZoomFactor": 1,
      "muted": false,
      "index": 0,
      "incognito": false,
      "url": "http://localhost:5601/app/kibana#/discover?_g=(refreshInterval:(pause:!t),
      "active": true,
      "pinned": false
    },
    "toolName": null,
    "toolVersion": null,
    "clientTime": 1561745100028,
    "userAction": true,
    "logType": "raw",
    "tags": [
      "_grokparsefailure"
    ],
    "location": null,
    "userId": "nobody",
    "useraleVersion": null
  },

```

####Interval Logs

Interval logs are kind of an experimental feature, that write long sequences of the same event to windows. The intent is
 to be able to capture and abstract high resolution data like 'mouseover' and 'scroll' on similar 'targets' in 
 time-boxed summary windows, rather than a mess of discrete events. You'll note that while interval logs have an index 
 time, they have a start- and end-time instead of a single, discrete time-stamp.

```html
    "endTime": 1561739434516, [end interval]
    "minor_ver": "0",
    "@timestamp": "2019-06-28T16:30:35.734Z",
    "type": "mouseover",
    "target": "html", [where were mouseovers observed within the interval]
    "targetChange": true,
    "major_ver": "2",
    "count": 10, [count of disrcete events within the interval] 
    "pageReferrer": "",
    "toolVersion": "2.0.0",
    "userAction": false,
    "duration": 396, [duration of interval in ms]
    "host": "172.18.0.1",
    "path": [
      "html",
      "#document",
      "Window"
    ],
    "sessionID": "session_1561737570573",
    "toolName": "Apache UserALE.js Example",
    "startTime": 1561739434120, [begin interval]
    "typeChange": true, [were there any other events during the interval?]
    "pageTitle": "UserAleJS - Example Page",
    "logType": "interval", [as compared to "raw"]
    "pageUrl": "file:///Users/jpoore/Documents/Apache_Flagon/test/incubator-flagon-useralejs/example/index.html",
    "userId": "example-user",
    "useraleVersion": "2.0.0",
    "patch_ver": "0"
```
## Contributing

Contributions are welcome!  Simply [submit an issue report](https://issues.apache.org/jira/browse/FLAGON) for problems 
you encounter or a pull request for your feature or bug fix.  The core team will review it and work with you to 
incorporate it into UserALE.js.
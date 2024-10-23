---
title: UserALE.js' Data Schema
component: useralejs
permalink: /docs/useralejs/dataschema/
priority: 4
---

This guide describes the structure of content of [Apache UserALE.js](https://github.com/apache/flagon-useralejs) 
logs, including:
 * which behaviors UserALE.js listens to;
 * which meta data UserALE.js attaches to logs, for context:
 * different types of UserALE.js logs, and their usage.

## UserALE.js Logs

UserALE.js logs, by default, contain a lot more data than other business analytics products because it is powerful enough for *workflow analysis*.

Workflow analysis is about understanding the complex interdependency between elements and behaviors within and across 
pages. Workflow analysis at this level is really crucial for understanding:
* how people think about the information on your site or app 
* understanding efficiency in information discovery
* and for gauging how novices explore pages compared to experts or superusers.

In order to do workflow analysis, UserALE.js generates granular data about interactions with page elements. 

This is a standard UserALE.js log from our [example test utility](https://github.com/apache/flagon-useralejs/blob/master/example/index.html): 


```html
{
  target: 'button#test_button',
  path: [
    'button#test_button',
    'div.container',
    'body',
    'html',
    '#document',
    'Window'
  ],
  pageUrl: 'http://localhost:8000/',
  pageTitle: 'UserALE - Example Page',
  pageReferrer: '',
  browser: { browser: 'firefox', version: '131.0.0' },
  clientTime: 1729658103797,
  microTime: 0,
  location: { x: 66, y: 220 },
  scrnRes: { width: 1920, height: 915 },
  type: 'click',
  logType: 'raw',
  userAction: true,
  details: { clicks: 1, ctrl: false, alt: false, shift: false, meta: false },
  userId: 'me',
  toolVersion: '2.3.0',
  toolName: 'Apache UserALE Example (Custom)',
  useraleVersion: '2.4.0',
  sessionId: 'session_1729657762020',
  httpSessionId: '057109eed2c0b107476731f201b6d63d',
  browserSessionId: null,
  attributes: { id: 'test_button' },
  style: {}
}
```


It's a lot, but it makes sense in context.

### UserALE.js Event Tracking

The fields dentify what users do and what they interact with. UserALE.js gets this information from anywhere on a page/app without using a ton of hooks.  


```html
    type: 'click', [this field documents the kind of user behavior observed]
    target: 'button#test_button', [this field documents the site/app element a user interacted with]
    path: [  {this is the DOM path to the "target" element, which is critical for disambiguation between elements}
      'button#test_button',
      'div.container',
      'body',
      'html',
      '#document',
      'Window'
    ]

``` 


You may want to specially label some of these fields and important elements that. See our guide on [the UserALE.js API]({{ '/docs/useralejs/API' | prepend: site.baseurl }}).

For more information about the kinds of behaviors (event classes) we collect, check out our guide for 
[modifying UserALE.js source code]({{ '/docs/useralejs/modifying' | prepend: site.baseurl }}).

### Temporal Handling in UserALE.js

Time is a very important concept in UserALE.js. Below are the fields related to temporal data capture:


```html
    clientTime: 1729658103797,    [UserALE.js collects time from the client when a log is generated]
    microTime: 0,             [When a log is wrtten, we write microtime too, not every database parses it]
```


### UserALE.js Meta-Data

You want context? We have all of the things for all of your events:

#### Event Context

Every event has a little nuance, UserALE.js gets it all.


```html
    details: {
      clicks: 1,
      ctrl: false,
      alt: false,
      shift: false,
      meta: false
    },
```

You'll get location of the cursor two for mouseover and click data, too!


```html
    location: {
      x: 66,
      y: 220
    }
```


[UserALE.js' WebExtension](https://github.com/apache/flagon-useralejs/tree/master/build) is deployed directly 
into your browser, as a result you'll get browser events. 

Examples are below,you'll see our details field has some pretty useful data from the browser.


```html
    details: {
      active: true,
      audible: false,
      autoDiscardable: true,
      discarded: false,
      favIconUrl: 'https://apache.org/favicons/favicon-32x32.png',
      groupId: -1,
      height: 914,
      highlighted: true,
      id: 1852931762,
      incognito: false,
      index: 4,
      lastAccessed: 1729720562214.495,
      openerTabId: 1852931752,
      pinned: false,
      selected: true,
      status: 'complete',
      title: 'Welcome to The Apache Software Foundation!',
      url: 'https://apache.org/',
      width: 1912,
      windowId: 1852931606
    }
```


#### Page/App Context

If a user clicks on a thing and you know nothing about that thing, you're toast!

UserALE.js gives a lot context about your page or app. Some are automatically grabbed from the page, some are 
configurable through our [script tag]({{ '/docs/useralejs' | prepend: site.baseurl }}) 


```html
    "toolVersion": "2.4.0", [you can give a semantic versioning of your page or tool]
    "pageReferrer": "", [grabbed from the page, from which page did your users find your page/app]
    "toolName": "Apache UserALE.js Example", [give your tool an alis through our script tag]
    "pageTitle": "UserAleJS - Example Page", [page title grabbed from page]
    "pageUrl": "file:///.../Apache_Flagon/test/flagon-useralejs/example/index.html" 
```


To find out more and how to change the context attached to event logs, check out our 
[modifying UserALE.js source code]({{ '/docs/useralejs/modifying' | prepend: site.baseurl }}) guide.

#### User Context

UserALE.js has its own methods for gathering user context, and it can integrate with other methods you might have 
(e.g., cookies)


```html
  sessionId: 'session_1729657762020', [This session ID is unique to a specific page visit (deprecated)]
  httpSessionId: '057109eed2c0b107476731f201b6d63d', [This ID is unique to the page session]
  browserSessionId: null, [This ID is unique to the browser session when using the plugin]
  userId: 'me', [You can also pass a unique userId]
```


To see how to pass in a userId from a url, check out our [script tag docs]({{ '/docs/useralejs' | prepend: site.baseurl }}).

Other things you might want to do (e.g., cookies) can also be passed to userId via [the UserALE.js API]({{ '/docs/useralejs/API' | prepend: site.baseurl }}).

## UserALE.js Log Types

For the most part, UserALE.js logs are uniform. However, there are some variations based on the type of log.

```

### Interval Logs

Interval logs are a experimental feature, that write long sequences of the same event to windows. They capture high resolution data like 'mouseovers' in time-boxed summary windows. 
 
Interval logs have a start- and end-time instead of a single, discrete time-stamp.

```html
{
    target: 'img.img-responsive center-block visible-home', [where were mouseovers observed within the interval]
    path: [
      'img.img-responsive center-block visible-home',
      'div.main',
      'header#main-header.container',
      'body#home',
      'html',
      '#document',
      'Window'
    ],
    pageUrl: 'https://apache.org/',
    pageTitle: 'Welcome to The Apache Software Foundation!',
    pageReferrer: 'https://www.bing.com/',
    browser: { browser: 'edge-chromium', version: '130.0.0' },
    count: 0, [count of disrcete events within the interval] 
    duration: 67, [duration of interval in ms]
    startTime: 1729720562466, [begin interval]
    endTime: 1729720562533, [end interval]
    type: 'mouseover',
    logType: 'interval', [as compared to "raw"]
    targetChange: true,
    typeChange: false, [were there any other events during the interval?]
    userAction: false,
    userId: 'pluginUser',
    toolVersion: '2.4.0',
    toolName: 'useralePlugin',
    useraleVersion: '2.4.0',
    sessionId: 'session_1727742067433',
    httpSessionId: '298926d0ffe8085dc0f7c421dbad9c3a',
    browserSessionId: 'd43400275c1f4f04f1ce74da7d0cd3c8'
  }
```
## Contributing

Contributions are welcome!  Simply [submit an issue](https://github.com/apache/flagon-useralejs/issues) for problems 
you encounter or a pull request for your feature or bug fix.  The core team will review it and work with you to 
incorporate it into UserALE.js. We also love Pull Requests!
<!--
  ~ Licensed to the Apache Software Foundation (ASF) under one
  ~ or more contributor license agreements.  See the NOTICE file
  ~ distributed with this work for additional information
  ~ regarding copyright ownership.  The ASF licenses this file
  ~ to you under the Apache License, Version 2.0 (the
  ~ "License"); you may not use this file except in compliance
  ~ with the License.  You may obtain a copy of the License at
  ~
  ~   http://www.apache.org/licenses/LICENSE-2.0
  ~
  ~ Unless required by applicable law or agreed to in writing,
  ~ software distributed under the License is distributed on an
  ~ "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
  ~ KIND, either express or implied.  See the License for the
  ~ specific language governing permissions and limitations
  ~ under the License.
-->

---
title: The UserALE.js API
component: useralejs
permalink: /docs/useralejs/API/
priority: 2
---

[Apache UserALE.js](https://github.com/apache/flagon-useralejs) features a robust API that allows you 
customize official Apache Flagon UserALE.js [builds](https://github.com/apache/flagon-useralejs/tree/master/build) page-by-page to suite your needs.


# API Usage

To invoke the API, simply add additional javascript code blocks under your UserALE.js script tag.

Don't forget to add UserALE.js to your project!
 
It can be deployed as either script-tag, NPM module, or via CDN! For in-depth example, see our [Getting Started Guide]({{ '/docs/useralejs' | prepend: site.baseurl }}) or source [README.md](https://github.com/apache/flagon-useralejs#usage).

Also, check out our[example test utility](https://github.com/apache/flagon-useralejs/tree/master/example) so that you can experiment with logs in your terminal!

The following API examples use script-tag deployment methods for illustration:

```html
<head>
  <title>UserAleJS - Example Page</title>
 <!--
 Add the UserALE.js script tag to the top of your doc
 -->
   <script src="/path/to/userale-2.4.0.min.js" data-url="http://yourLoggingUrl"></script>
```

## `options()`

`options` allows you to modify UserALE.js script tag parameters. This can be particularly useful if need to pass additional data about users from your page into the logging parameters, like username and sessionID. You can build variables constructors that pass data from form data or browser storage to UserALE's paramters. 

```html
<script type="text/javascript">
    const changeMe = "me";
    window.userale.options({
      "userId": changeMe,
      "version": "2.4.0",
      "sessionID": "4"
    })
</script>
```

## `addCallbacks()`

`addCallbacks` allows you to modify UserALE.js logs via callback functions. Callback functions are passed the log to be modifyed, and the corresponding event if one exists. The value returned from the calback is used as the new log, except when a falsey value is returned. In the case of a falsey value, the log is dropped. Callbacks are executed in the order they are submitted. Pass multiple callbacks with an object of functions. The following example shows how to both filter unwanted events and add custom fields.

```html
<script type="text/javascript">
  window.userale.addCallbacks({
    filter(log) {
      var type_array = [
        "mouseup",
        "mouseover",
        "mousedown",
        "keydown",
        "dblclick",
        "blur",
        "focus",
        "input",
        "wheel",
      ];
      var logType_array = ["interval"];
      if (type_array.includes(log.type) || logType_array.includes(log.logType)) {
        return false;
      }
      return log;
    },
    addCustomFields(log, event) {
      var targetsForLabels = ["button#test_button"];
      if (targetsForLabels.includes(log.target)) {
          return Object.assign({}, log, { CustomLabel: "Click me!" });
      } else {
          return log;  
      }
    }
  });
</script>
```

## `removeCallbacks()`

`removeCallbacks` removes a list of callback function that was added by addCallbacks() by name. The following example will remove the filter from the addCallbacks() example

```html
<script type="text/javascript">
  window.userale.removeCallbacks(["filter"]);
</script>
```

Test these examples out in our UserALE.js [example page](https://github.com/apache/flagon-useralejs/blob/master/example/index.html) test utility!

See more [UserALE.js API Examples]()

## Contributing

Contributions are welcome!  Simply [submit an issue](https://github.com/apache/flagon-useralejs/issues) for problems 
you encounter or a pull request for your feature or bug fix.  The core team will review it and work with you to 
incorporate it into UserALE.js. We also love Pull Requests!
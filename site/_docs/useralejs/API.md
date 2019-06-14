---
title: API
component: useralejs
permalink: /docs/useralejs/API
priority: 11
---

# Modifying UserALE.js Behavior via API

[Apache UserALE.js](https://github.com/apache/incubator-flagon-useralejs) features a robust API that allows you customize official Apache Flagon UserALE.js [builds](https://github.com/apache/incubator-flagon-useralejs/tree/master/build) page-by-page to suite your needs.

The API exposes two functions: `setLogFilter` & `setLogMapper`. With these two powerful functions, you have a lot of lattitude in customizing and curating your logs.

#API Usage

To invoke the API, simply add additional javascript code blocks under your UserALE.js script tag.

`setLogFilter` allows you to eliminate log data you don't need or want from your log stream:

```html
<head>
  <title>UserAleJS - Example Page</title>
 <!--
 Add the UserALE.js script tag to the top of your doc
 -->
   <script src="/path/to/userale-1.0.0.min.js" data-url="http://yourLoggingUrl"></script>
<!--
Add additional code blocks to set the filters you want
This simple array filter pulls mouseover data out of your log stream
-->
  <script type="text/javascript">
    window.userale.filter(function (log) {
      return (log.type != 'mouseover');
    });
  </script>
<!-- 
One filter to rule them all! 
Modify the array page-by-page to curate your log stream:
by adding unwanted event 'types' in type_array;
by adding unwanted log classes to eliminate 'raw' or 'interval' logs from your stream.
-->
  <script type="text/javascript">
    var type_array = ['mouseup', 'mouseover', 'dblclick', 'blur', 'focus']
    var logType_array = ['interval']
    window.userale.filter(function (log) {
      return !type_array.includes(log.type) && !logType_array.includes(log.logType);
    });
  </script>
```
You can use the `setLogFilter` function to do other cool stuff. Below is an example for how to further modify the rate at which UserALE.js collects data, but dropping every other log (odd-even) in the logging queue. 

```javascript
<html>
  <head>
    <script src="/path/to/userale-1.0.0.min.js" data-url="http://yourLoggingUrl"></script>

    <script type="text/javascript">
      var logCounter = 0;
      window.userale.filter(function (log) {
        return (logCounter++ % 2);
      });
    </script>
  </head>
```

`setLogMapper` allows you to modify or add new fields to UserALE.js logs: 

```html
<html>
  <head>
   <!--
   Add the UserALE.js script tag to the top of your doc
   -->
    <script src="/path/to/userale-1.0.0.min.js" data-url="http://yourLoggingUrl"></script>
  </head>
  <body>
    <div id="app">
      <button id="increment">+</button>
      <button id="decrement">-</button>
      <div id="scoreboard"></div>
    </div>
<!--
This cool mapping function adds a progressive count on a given element ("app") and writes to a new log field called "score"
-->
    <script type="text/javascript">
      var score = 0;
      var scoreBoard = document.getElementById('scoreboard');
      scoreBoard.innerText = '0';

      function setScore(nextScore) {
        score = nextScore;
        scoreBoard.innerText = String(score);
      }

      document.getElementById('increment').addEventListener('click', function () {
        setScore(score + 1);
      });

      document.getElementById('decrement').addEventListener('click', function () {
        if (score) {
          setScore(score - 1);
        }
      });

      window.userale.map(function (log) {
        return Object.assign({}, log, { score: score }); // Add the "score" property to the log
      });
    </script>
  </body>
</html>

```

Test these examples out in our UserALE.js [example page](https://github.com/apache/incubator-flagon-useralejs/blob/master/example/index.html) test utility!

### Benefits of the UserALE.js API
 * No need to dig into our source code
 * Version control is easy and no need to sweat merges--just download the latest [release]({{ '/releases' | prepend: site.baseurl }}), or update via [npm](https://www.npmjs.com/package/useralejs).
 * Manage logs page-by-page, ideal for large or complex sites
 * Use basic or best-practice JS styles and methods to build your own filters, no need to learn weird custom syntax.

## Contributing

Contributions are welcome!  Simply [submit an issue report](https://issues.apache.org/jira/browse/FLAGON) for problems you encounter or a pull request for your feature or bug fix.  The core team will review it and work with you to incorporate it into UserALE.js.
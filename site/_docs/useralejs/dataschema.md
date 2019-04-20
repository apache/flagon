---
title: API
component: useralejs
permalink: /docs/useralejs/API
priority: 11
---

### The UserALE.js API

For some applications, it may be desirable to filter logs based on some runtime parameters or to enhance the logs with information available to the app. To support this use-case, [Apache UserALE.js](https://github.com/apache/incubator-flagon-useralejs) is equipped with an API exposed against the global UserALE.js object.

The two functions exposed are the `setLogFilter` and `setLogMapper` functions. These allow dynamic modifications to the logs at runtime, but before they are shipped to the server.

`setLogFilter` helps you sculpt your log stream, removing data you don't want.
`setLogMapper` helps you modify the content of your log stream, such as by adding fields to logs, or modifying what is written to existing fields.

**Sample Uses**

Here is an example of a filter that only keeps every second log (odd-even):
```html
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
  <body>
    <div id="app">
      <!-- application goes here -->
    </div>
  </body>
</html>
```

Here is an example of a mapping function that adds runtime information about the current "score":
```html
<html>
  <head>
    <script src="/path/to/userale-1.0.0.min.js" data-url="http://yourLoggingUrl"></script>
  </head>
  <body>
    <div id="app">
      <button id="increment">+</button>
      <button id="decrement">-</button>
      <div id="scoreboard"></div>
    </div>

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

Even with this small API, it is possible to compose very powerful logging capabilities and progressively append additionally app-specific logic to your logs.

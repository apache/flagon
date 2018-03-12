---
title: Getting Started
component: useralejs
permalink: /docs/useralejs/
priority: 0
---

Apache UserALE.js is the UserALE client for DOM and JavaScript-based applications.  It automatically attaches event handlers, is configurable through HTML5 data parameters or a JS API, and logs every user interaction on a web page, including rich JS single-page apps.  

*Note:* Work on UserALE.js' documentation is ongoing.  The most notable undocumented feature is the JS API.  To get involved, see our [Contributing]({{ '/docs/contributing' | prepend: site.baseurl }}) guide.  

### Include UserALE.js in your project

To include UserALE.js in your project with default configuration, simply include the script tag below:

  ```html
  <script src="<userale-0.1.0.js>"></script>
  ```

### Configure UserALE.js

HTML5 Data Parameters are used to configure UserALE.js.  For example, to set the logging URL:

  ```html
  <script src="userale-0.1.0.js" data-url="http://server:port"></script>
  ```

The complete list of configurable options is:

  | Param | Description | Default |
  |:---|:---|:---|
  | data-url | Logging URL | http://localhost:8000 |
  | data-autostart | Should Userale.js start on page load | true |
  | data-interval | Delay between transmit checks | 5000 (ms) |
  | data-threshold | Minimum number of logs to send | 5 |
  | data-user | User identifier | null |
  | data-version | Application version identifier | null |
  | data-log-details | Toggle detailed logs (keys pressed and input/change values) | false |
  | data-resolution | Delay between instances of high frequency logs (mouseover, scroll, etc.) | 500 (ms) |
  | data-user-from-params | Query param in the page URL to fetch userId from | null |
  | data-tool | Name of tool being logged | null |

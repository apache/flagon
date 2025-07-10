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
title: Getting Started
component: useralejs
permalink: /docs/useralejs/
priority: 0
---

[Apache UserALE.js](https://github.com/apache/flagon-useralejs) is the UserALE client for DOM and JavaScript-based applications.  It automatically attaches event handlers, is configurable through HTML5 data parameters or a JS API, and logs every user interaction on a web page, including rich JS single-page apps. You can choose to include UserALE.js directly in your project to track how users engage with it, or if you're interested in generating logs from any webpage, you can try out our web extension that injects UserALE.js into every webpage.

*Note:* Work on UserALE.js' documentation is ongoing.  Contributions are welcome. To get involved, see our [Contributing]({{ '/docs/contributing' | prepend: site.baseurl }}) guide.  
## Include UserALE.js in your project

To start logging with Apache UserALE.js, you can include our script directly in your project. More details can be found in our [README](https://github.com/apache/flagon-useralejs/blob/master/README.md). You can use our [build process]({{ '/docs/useralejs/build' | prepend: site.baseurl }}) to create our script, use a sample in our [repos](https://github.com/apache/flagon-useralejs/tree/master/build), or pull our scripts from [npm](https://www.npmjs.com/package/flagon-userale).

To include UserALE.js in a specific project, you'll need to deploy a version of our minified UserALE.js script in an accessible location into your project:

```html
npm install flagon-userale
```

### Include UserALE.js as a `module`:

```html
import * as userale from 'flagon-userale';

or

const userale = require('flagon-userale');
```

Our [webpack example](https://github.com/apache/flagon-useralejs/tree/master/example/webpackUserAleExample) illustrates this use-case.

### Include UserALE.js as a `script-tag`:

```html
<script src="./node_modules/flagon-userale/build/userale-2.4.0.min.js"></script>
```

Our [script tag example](https://github.com/apache/flagon-useralejs/tree/master/example) illustrates this use-case

If you include UserALE.js as a `script-tag`, consider installing via npm as a development dependency:

```html
npm install --save-dev flagon-userale
```

### Include UserALE.js via a CDN:

```html
<script src="https://cdn.jsdelivr.net/npm/flagon-userale@2.4.0/build/userale-2.4.0.min.js"></script>
```

We also support a [WebExtension](https://github.com/apache/flagon-useralejs/tree/master/src/UserALEWebExtension) that can be added to your browser in developer mode. Follow the link for instructions.

Once UserALE.js is installed in your project, your application will start generating logs automatically.

## Configure UserALE.js

UserALE.js is designed to be easily configured to fit your use case. In `script-tag` deployment, use HTML data parameters to pass configuration options to the library. 

For example, one thing you'll need to do is set the URL (location) of your minified UserALE.js script:

```html
<script src="/path/to/userale-2.4.0.min.js" data-url="http://yourLoggingUrl"></script>
```

The complete list of configurable options is:

| Param | Description | Default |
|---|---|---|
| url | Logging URL | http://localhost:8000 |
| autostart | Should UserALE start on page load | true |
| transmitInterval | Delay between transmit checks | 5000 (ms) |
| logCountThreshold | Minimum number of logs to send | 5 |
| userId | User identifier | null |
| sessionId | Session identifier | null |
| version | Application version identifier | null |
| logDetails | Toggle detailed logs (keys pressed and input/change values) | false |
| resolution | Delay between instances of high frequency logs (mouseover, scroll, etc.) | 500 (ms) |
| userFromParams | Query param in the page URL to fetch userId from | null |
| toolName | Name of tool being logged | null |
| authHeader | Authorization header to be passed to logging endpoint | null |

**NOTE** These options are also available through our [API]({{ '/docs/useralejs/API' | prepend: site.baseurl }}), which support deploying UserALE.js as an NPM `module.`

See our page on [Build and Test]({{ '/docs/useralejs/build' | prepend: site.baseurl }}) for UserALE.js to learn how to build your own minified version of the UserALE.js script, or you check-out a pre-built script with default parameters in our [repo](https://github.com/apache/flagon-useralejs/tree/master/build).

Use our [example test utility](https://github.com/apache/flagon-useralejs/tree/master/example) to experiment with script tag parameters.

## Deploying the UserALE.js WebExtension

If you're interested in using our Web Extension to log user activity across all pages they visit, try our web extension, which injects UserALE.js into any web page your client(s) navigate to. This option is perfect for testing and research. The web extension builds through the same [build pipeline]({{ '/docs/useralejs/build' | prepend: site.baseurl }}) as UserALE.js. You can also use pre-built extension files in our [repo](https://github.com/apache/flagon-useralejs/tree/master/build). 

When you're ready to deploy the UserALE.js web extension, follow the instructions below:

1. Load the web extension into your browser.
    1. Firefox
        1. Open Firefox
        1. Enter about:debugging into the URL bar and press enter
        1. Check the box to 'Enable add-on debugging'
        1. Press the 'Load Temporary Add-on' button
        1. Navigate to the root of the web extension directory (e.g. 'build/UserAleWebExtension')
        1. Press Open, and confirm that 'User ALE Extension' appears in the list
        1. You may now navigate to a web page to inject the User ALE script! 
    1. Chrome
        1. Open Chrome
        1. Enter chrome://extensions into the URL bar and press enter
        1. Check the 'Developer mode' box
        1. Press the 'Load unpacked extension' button
        1. Navigate to the root of the build directory (e.g. 'build/UserAleWebExtension')
        1. Press Ok, and confirm that 'UserALE Extension' appears in the list
        1. You may now navigate to a web page to inject the User ALE script! 

You can set options for the web extension in your browser by opening the extensions page, finding the extension, and choosing either "Preferences" for Firefox, or "Options" for Chrome.

You can also find more instructions in our [README](https://github.com/apache/flagon-useralejs/tree/master/src/UserALEWebExtension).

## Contributing

Contributions are welcome!  Simply [submit an issue](https://github.com/apache/flagon-useralejs/issues) for problems 
you encounter or a pull request for your feature or bug fix.  The core team will review it and work with you to 
incorporate it into UserALE.js. We also love Pull Requests!
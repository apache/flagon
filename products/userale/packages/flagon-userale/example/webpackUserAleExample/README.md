<!--
    Licensed to the Apache Software Foundation (ASF) under one
    or more contributor license agreements.  See the NOTICE file
    distributed with this work for additional information
    regarding copyright ownership.  The ASF licenses this file
    to you under the Apache License, Version 2.0 (the
    "License"); you may not use this file except in compliance
    with the License.  You may obtain a copy of the License at

      http://www.apache.org/licenses/LICENSE-2.0

    Unless required by applicable law or agreed to in writing,
    software distributed under the License is distributed on an
    "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
    KIND, either express or implied.  See the License for the
    specific language governing permissions and limitations
    under the License.
-->
# The UserALE Webpack Example Utility

This example provides: 
 * example usage for UserALE imported as a **module** into a simple HTML Webpage and built with a package bundler (Webpack);
 * a testing utility for developers to evaluate UserALE modifications to logged events;
 * a means of viewing log event structure within a simple UserALE logging server;
 * a means of testing UserALE API functions within a simple HTML Webpage. 

If you are interested in examples for a **script tag** deployment methodology, see the README in the [/examples directory](https://github.com/apache/flagon-useralejs/tree/master/example). For details about our web extension, see 
our [UserALE WebExtension documentation](https://github.com/apache/flagon-useralejs/tree/master/src/UserALEWebExtension).

## Prerequisites

Ensure that you have [node.js](https://nodejs.org/) installed.

You will need to `npm install` the [flagon-userale](https://www.npmjs.com/package/flagon-userale) npm package.

From `./example/webpackUserAleExample` directory, `npm install` dependencies to run this Example Utility. Note that the UserALE Webpack Example has it's own package.json file, that is separate from the larger `flagon-userale` package.

Please follow [Installation directions](https://github.com/apache/flagon-useralejs#installation) if you run into issues.

## Using the Example Page 

The Example Page is a simple HTML Webpage with UserALE included as a module import. 

The example is pre-built and requires no modification to work. 

Open `index.html` in your browser (you can drag it directly into a tab or double-click it). You will see a very simple HTML Webpage with a few interactive features.

On this page, all user events will be captured and sent to the logging server. See instructions below.

## Capturing Logs Using the Logging Server

The UserALE Example page works with a simple logging server, which receives log from any UserALE instrumented page or application at `localhost:8000`.

From the `/example` directory or its parent directory (not `example/webpackUserAleExample`) run the following:

```
$npm run example:watch
```

Once the server starts you will see:

```
> flagon-userale@2.1.0 example:watch ...
> nodemon -w ./example example/server.js

[nodemon] 1.19.1
[nodemon] to restart at any time, enter `rs`
[nodemon] watching: ...
[nodemon] starting `node example/server.js`
UserAle Local running on port 8000
```

The server allows you to watch as logs are sent from the client to the server, as well as review a flat-file of saved logs, which you can view @ `/logs` in the flagon-userale parent directory.

This means you can test logs from your own instrumented application, the [UserALE WebExtension](https://github.com/apache/flagon-useralejs/tree/master/src/UserALEWebExtension), or the UserALE Example Page, so long as you have not changed the UserALE `url` configuration option from `localhost:8000` (instructions below). This is the default setting for userale; logs generated from module, script tag, or WebExtension deployments will always ship logs to `localhost:8000` unless modified via the `userale.options` (API) configuration, HTML script tag parameter (data-url), or the WebExtension options page.

Start using your instrumented application, browser, or the UserALE Example Page, and you will see logs propagating in the terminal:

```

[ { target: 'body',
    path: [ 'body', 'html' ],
    clientTime: 1504287557492,
    location: { x: 0, y: 0 },
    type: 'keydown',
    userAction: true,
    details: null,
    userId: 'example-user',
    toolVersion: '2.1.0',
    toolName: 'Apache UserALE Example',
    useraleVersion: '2.1.0' },
 ...
]
```

Kill the logging script with `^C` or as you would any bash script.

## Modifying the Example Page (Dev Instructions)

Beyond providing you in situ examples of UserALE in action and API usage examples, the test utility is useful for prototyping code blocks for use in your own applications. 
 
Below are a few notes that are useful as you begin to modify the UserALE **module** imoort example. 
 
* the `userale` object imports directly into `index.js` with the following import statement:

```html
import * as userale from 'flagon-userale';

or

const userale = require('flagon-userale');
```

* `index.js` is bundled with **Webpack**, resulting in a `main.js` file in the /dist directory. `index.html` includes `main.js` through a script tag.

```html
<script src="dist/main.js"></script>
```

* the UserALE **module** import example is structured like an npm project--it has its own `package.json` file. This means than any npm commands used for install, built, etc., must be done so within this directory, *not* its parent directories.

* any modifications of `index.js` will require that you rebuild `main.js`, then reload `index.html`. Run the following within the `/example/webpackUserAleExample directory`:

```html
$npm run build-example
```

## Experimenting with UserALE Exports (API)

* UserALE features a robust set of exported functions to support modification and customization of your logs. They can be called as attributes of the userale object (e.g., userale.[function])

* See the top level README for examples and parameters for exports, but a list of exported functions follows:

| Function | Description | Notes |
|---|---|---|
| userale.options | modify userale's configuration option | see top level README for complete list of options |
| [DEPRECATED] userale.filter | filters out logs from logging queue by keys or values | filters are callbacks with global scope |
| [DEPRECATED] userale.map | modify/add log keys or values | mappings are callbacks with global scope |
| userale.addCallbacks | add one or more callbacks to be executed during log packaging | callbacks have global scope |
| userale.removeCallbacks | remove one or more callbacks by name | Removes callbacks added from userale.addCallbacks |
| userale.log | appends a custom log to the log queue | the custom log object is an object key:value pairs |
| userale.packageLog | transforms the provided event into a log and appends it to the log queue | designed for HTML events |
| userale.packageCustomLog | packages the provided customLog to include standard meta data and appends it to the log queue | designed for non HTML events| 
| userale.details | defines the way information is extracted from various events | supports packageLog/packageCustomLog 'details' |
| userale.getSelector | builds a string CSS selector from the provided HTML element id | populates 'target' field in packaged logs |
| userale.buildPath| builds an array of elements from the provided event target, to the root element (DOM path) | populates the 'path' field in packaged logs |
| userale.start | used to start the logging process if | unecessary if 'autostart' is set to true in initial setting (default) |
| userale.stop | halts the logging process. Logs will no longer be sent | will need to invoke userale.start to restart logging |

* additional, annotated examples for most exports can be found embedded within `index.js` the UserALE **module** import example. 

See the [Flagon website](http://flagon.apache.org/) for additional documentation on the [API](http://flagon.apache.org/docs/useralejs/API/) and [testing for scale](http://flagon.apache.org/docs/stack/scaling/).

## Contributing

Contributions are welcome!  Simply [submit an issue](https://github.com/apache/flagon-useralejs/issues) for problems you encounter or submit a pull request for your feature or bug fix.  The core team will review it and work with you to incorporate it into UserALE.
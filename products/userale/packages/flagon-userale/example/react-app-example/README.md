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
# Apache Flagon UseraALE.js React Example

This example was bootstrapped with [Create React App](https://github.com/facebook/create-react-app). It demonstrates UserALE `autostart` configurations and `start()`, `stop()` exports.

## Using this Example

To use this example, first install dependencies (from this subdir):

```Javascript
npm install
```

Then run the `start` script:

```Javascript
npm run start
```

This will start the React App in "developer mode", which will open in your browser.

Click the text on the page to execute the UserALE `start()` export and start logging behaviors.

Or, modify `App.js` in `src` to experiment with `autostart` and `stop()` exports.

Note that you will not receive logs unless you have a [logging server](https://github.com/apache/incubator-flagon-useralejs/tree/master/example#capturing-logs-using-the-logging-server) running. 

"use strict";
/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */
const ws = new WebSocket("ws://localhost:8000");
const encoder = new TextEncoder();
ws.onopen = (event) => {
    let logs = new Array();
    logs.push('{"target": "#document","path": [ "Window" ], "pageUrl": "https://github.com/apache/flagon/tree/master/docker", "pageTitle": "flagon/docker at master · apache/flagon · GitHub", "pageReferrer": "https://gov.teams.microsoft.us/", "browser": { "browser": "chrome", "version": "116.0.0" }, "clientTime": 1719530111079, "microTime": 0,"location": { "x": null, "y": null }, "scrnRes": { "width": 1349, "height":954 }, "type": "load", "logType": "raw", "userAction": true, "details": {"window": true }, "userId": "nobody", "toolVersion": null, "toolName":"test_app", "useraleVersion": "2.3.0", "sessionId":"session_1719530074303", "httpSessionId": "72798a8ad776417183b1aa14e03c3132", "browserSessionId": "06b0db1ab30e8e92819ba3d4091b83bc"}');
    logs.push('{"target": "#document","path": [ "Window" ], "pageUrl": "https://github.com/apache/flagon/tree/master/docker", "pageTitle": "flagon/docker at master · apache/flagon · GitHub", "pageReferrer": "https://gov.teams.microsoft.us/", "browser": { "browser": "chrome", "version": "116.0.0" }, "clientTime": 1719530111079, "microTime": 0,"location": { "x": null, "y": null }, "scrnRes": { "width": 1349, "height":954 }, "type": "load", "logType": "raw", "userAction": true, "details": {"window": true }, "userId": "nobody", "toolVersion": null, "toolName":"test_app", "useraleVersion": "2.3.0", "sessionId":"session_1719530074303", "httpSessionId": "72798a8ad776417183b1aa14e03c3132", "browserSessionId": "06b0db1ab30e8e92819ba3d4091b83bc"}');
    let data = JSON.stringify(logs);
    //let arr = encoder.encode(message);
    ws.send(data);
};
ws.onmessage = (event) => {
    console.log(event.data);
};

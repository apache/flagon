// Licensed to the Apache Software Foundation (ASF) under one or more
// contributor license agreements.  See the NOTICE file distributed with
// this work for additional information regarding copyright ownership.
// The ASF licenses this file to You under the Apache License, Version 2.0
// (the "License"); you may not use this file except in compliance with
// the License.  You may obtain a copy of the License at
//   http://www.apache.org/licenses/LICENSE-2.0
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import {
  ConsoleSpanExporter,
  SimpleSpanProcessor,
} from "@opentelemetry/sdk-trace-base";
import { WebTracerProvider } from "@opentelemetry/sdk-trace-web";
import { UserInteractionInstrumentation } from "@opentelemetry/instrumentation-user-interaction";
import { ZoneContextManager } from "@opentelemetry/context-zone";
import { registerInstrumentations } from "@opentelemetry/instrumentation";
// or if you already have zone.js
// import { ZoneContextManager } from '@opentelemetry/context-zone-peer-dep';

const userale = require("flagon-userale");

const provider = new WebTracerProvider({
  contextManager: new ZoneContextManager(),
});

provider.addSpanProcessor(new SimpleSpanProcessor(new ConsoleSpanExporter()));
provider.register();

registerInstrumentations({
  instrumentations: [new UserInteractionInstrumentation()],
});

// and some test
const btn1 = document.createElement("button");
btn1.append(document.createTextNode("btn1"));
btn1.addEventListener("click", () => {
  console.log("clicked");
});
document.querySelector("body").append(btn1);

const btn2 = document.createElement("button");
btn2.append(document.createTextNode("btn2"));
btn2.addEventListener("click", () => {
  getData("https://httpbin.org/get").then(() => {
    getData("https://httpbin.org/get").then(() => {
      console.log("data downloaded 2");
    });
    getData("https://httpbin.org/get").then(() => {
      console.log("data downloaded 3");
    });
    console.log("data downloaded 1");
  });
});
document.querySelector("body").append(btn2);

function getData(url, resolve) {
  return new Promise(async (resolve, reject) => {
    const req = new XMLHttpRequest();
    req.open("GET", url, true);
    req.setRequestHeader("Content-Type", "application/json");
    req.setRequestHeader("Accept", "application/json");
    req.send();
    req.onload = function () {
      resolve();
    };
    req.onreadystatechange = function () {
      if (req.readyState == XMLHttpRequest.DONE) {
        console.log(req.response);
        userale.log({
          clientTime: Date.now(),
          type: "XMLHttpRequest",
          logType: "custom",
          userAction: "false",
          details: JSON.parse(req.response),
          userId: userale.options().userId,
          useraleVersion: userale.options().useraleVersion,
          sessionId: userale.options().sessionId,
          traceId: trace.getSpan(context.active())._spanContext.traceId,
        });
      }
    };
  });
}
// now click on buttons

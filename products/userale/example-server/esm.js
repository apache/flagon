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

import { UserALE, Configuration } from "/esm-build/main.mjs";

const userale = new UserALE(
  Configuration.getInstance({
    url: "http://localhost:4318",
    userId: "example-user",
    toolName: "Apache UserALE ESM Example",
    logCountThreshold: 20,
    transmitInterval: 1000,
  })
);

// ---------------------------------------------------------------------------
// addCallbacks — filtering
// ---------------------------------------------------------------------------
userale.addCallbacks({
  filter(log) {
    const dropTypes = ["mouseup", "mouseover", "mousedown", "wheel"];
    if (dropTypes.includes(log.type)) {
      return false;
    }
    return log;
  },
});

// ---------------------------------------------------------------------------
// addCallbacks — mapping
// ---------------------------------------------------------------------------
userale.addCallbacks({
  map(log) {
    if (log.target === "button#test_button") {
      return Object.assign({}, log, { customLabel: "map & packageLog Example" });
    }
    return log;
  },
});

userale.start();

// Expose instance for integration tests (stop/start)
window._userale = userale;

// ---------------------------------------------------------------------------
// Text field demo
// ---------------------------------------------------------------------------
document.addEventListener("change", function (e) {
  if (e.target.value === "log") {
    userale.log({
      type: "custom-log-demo",
      logType: "custom",
      userAction: false,
      clientTime: Date.now(),
      details: { demo: true },
      customField: "I can make this log look like anything I want",
    });
  }
});

document.addEventListener("change", function (e) {
  if (e.target.value === "packageCustomLog") {
    userale.packageCustomLog(
      {
        type: "packageCustomLog-demo",
        customLabel: "packageCustomLog demo",
        customField: "merged with standard metadata",
      },
      () => ({ timestamp: Date.now() }),
      true,
    );
  }
});

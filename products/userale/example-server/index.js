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

// ---------------------------------------------------------------------------
// options API
// Set or override config values at runtime. Useful for injecting userId from
// your app's session context rather than a static data-user attribute.
// ---------------------------------------------------------------------------
window.userale.options({
  userId: "example-user",
  toolName: "Apache UserALE Example",
});

// ---------------------------------------------------------------------------
// addCallbacks — filtering
// Return false (or a falsy value) from a callback to drop a log.
// This example drops high-frequency mouse and interval logs to reduce noise.
// ---------------------------------------------------------------------------
window.userale.addCallbacks({
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
// Return a modified copy of the log to add or change fields.
// This example tags clicks on the "Click Me!" button with a custom label.
// ---------------------------------------------------------------------------
window.userale.addCallbacks({
  map(log) {
    if (log.target === "button#test_button") {
      return Object.assign({}, log, { customLabel: "map & packageLog Example" });
    }
    return log;
  },
});

// ---------------------------------------------------------------------------
// Text field demo — type one of these values to see the corresponding API:
//
//   "log"              — userale.log(): append a fully custom log object
//   "packageCustomLog" — userale.packageCustomLog(): merge custom fields with
//                        standard UserALE metadata
// ---------------------------------------------------------------------------

document.addEventListener("change", function (e) {
  if (e.target.value === "log") {
    // Append a fully custom log built from scratch.
    window.userale.log({
      type: "custom-log-demo",
      logType: "custom",
      userAction: false,
      clientTime: Date.now(),
      details: { demo: true },
      customField: "I can make this log look like anything I want",
      userId: window.userale.options().userId,
      toolName: window.userale.options().toolName,
    });
  }
});

document.addEventListener("change", function (e) {
  if (e.target.value === "packageCustomLog") {
    // Merge custom fields with standard UserALE metadata automatically.
    window.userale.packageCustomLog(
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

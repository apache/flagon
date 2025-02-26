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

/** Options API
 *
 * the 'options' API allows you to dynamically change UserALE params and set meta data values
 * pass in variables or properties into the options object, such as from sessionStorage or localStorage
 * NOTE: logDetails is set to true (default:false), this will log key strokes, inputs, and change events
 * (be careful of your form data and auth workflows!)
 */
const changeMe = "me";
window.userale.options({
  userId: changeMe,
  logDetails: true,
  toolName: "Apache UserALE Example (Custom)",
});

/**Filter API

/**the 'filter' API allows you to eliminate logs you don't want
 * use as a global filter and add classes of events or log types to eliminate
 * or use in block scope to surgically eliminate logs from specific elements from an event handler
 * The filter below reduces logs to capture click, change, select, scroll and submit events on index.html
 * Note that for surgical filters, you may need to clear or reset back to a global filter callback
 * the same is true for the 'map' API. See examples below:
 */
window.userale.addCallbacks({
  filter(log) {
    var type_array = [
      "mouseup",
      "mouseover",
      "mousedown",
      "keydown",
      "dblclick",
      "blur",
      "focus",
      "input",
      "wheel",
    ];
    var logType_array = ["interval"];
    if (type_array.includes(log.type) || logType_array.includes(log.logType)) {
      return false;
    }
    return log;
  },
});

/**Log Mapping API
 *
 * the 'map' API allows you to add or modify new fields to your logs
 * this example works with the "Click Me!" button at the top of index.html
 */
document.addEventListener("click", function (e) {
  if (e.target.innerHTML === "Click Me!") {
    window.userale.addCallbacks({
      map(log) {
        return Object.assign({}, log, {
          logType: "custom",
          customLabel: "map & packageLog Example",
        });
      },
    });
    window.userale.packageLog(
      e,
      window.userale.details(window.userale.options(), e.type)
    );
    /**you'll want to reset the map callback function, or set a conditional (e.g., return log), else
     * the callback may be applied to other events of the same class (e.g., click) */
    window.userale.removeCallbacks(["map"]);
  } else {
    return false;
  }
});

/** Alternate Log Mapping API Example
 * Build a global mapping function with conditional logic to modify logs for similar events
 * this example works with the "Click Me!" button at the top of index.html
 * Also, note that specifying log as a return will keep the scope of this callback limited to only the events you want
 */
//window.userale.map(function (log, e) {
//    var targetsForLabels = ["button#test_button"];
//    if (targetsForLabels.includes(log.target)) {
//        return Object.assign({}, log, { customLabel: e.target.innerHTML });
//    } else {
//        return log;
//    }
//});

/**'Log' API and Custom Log Functions
 *
 * the 'log' API generate custom events and add them to the log queue
 * pass in any keys:values for fully customized logs
 * utilize 'options' and other functions to streamline populating custom logs
 * type 'log' into the 'API Test Field' to see this custom log sent to our example server
 */
document.addEventListener("change", function (e) {
  if (e.target.value === "log") {
    window.userale.log({
      target: window.userale.getSelector(e.target),
      path: window.userale.buildPath(e),
      clientTime: Date.now(),
      type: e.type,
      logType: "custom",
      userAction: false,
      details: { foo: "bar", bar: "foo" },
      customField1: "I can make this log look like anything I want",
      customField2: "foo",
      userId: window.userale.options().userId,
      toolVersion: window.userale.options().version,
      toolName: window.userale.options().toolName,
      useraleVersion: window.userale.options().useraleVersion,
      sessionId: window.userale.options().sessionId,
      customLabel: "Custom Log Example",
    });
  }
});

/**you can also use UserALE' own packaging function for HTML events to strive for standardization
 * type 'packageLog into the 'API Test Field' to see this custom log sent to our example server
 */
document.addEventListener("change", function (e) {
  if (e.target.value === "packageLog") {
    /**You can then use the 'Mapping' API function to modify custom logs created with the packageLog function*/
    window.userale.addCallbacks({
      changeMap(log) {
        var targetsForLabels = ["change"];
        if (targetsForLabels.includes(log.type)) {
          return Object.assign({}, log, {
            logType: "custom",
            customLabel: "packageLog Example",
          });
        } else {
          return log;
        }
      },
    });
    /**You can also use the details function to package additional log meta data, or add custom details*/
    window.userale.packageLog(
      e,
      window.userale.details(window.userale.options(), e.type)
    );
  } else {
    return false;
  }
});

/**you can also just add boilerplate UserALE meta data to custom logs with the packageCustomLog function
 * type 'packageCustomLog into the 'API Test Field' to see this custom log sent to our example server
 */
document.addEventListener("change", function (e) {
  if (e.target.value === "packageCustomLog") {
    window.userale.packageCustomLog(
      {
        customLabel: "packageCustomLog Example",
        customField1: "foo",
        customField2: "bar",
      },
      function () {
        return { foo: "bar", bar: "foo" };
      },
      true
    );
  } else {
    return false;
  }
});

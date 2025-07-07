"use strict";
/* Licensed to the Apache Software Foundation (ASF) under one or more
  contributor license agreements. See the NOTICE file distributed with
  this work for additional information regarding copyright ownership.
  The ASF licenses this file to you under the Apache License, Version 2.0
  (the "License"); you may not use this file except in compliance with
  the License. You may obtain a copy of the License at

  http://www.apache.org/licenses/LICENSE-2.0

  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an "AS IS" BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  See the License for the specific language governing permissions and
  limitations under the License.*/
(() => {
  // src/packageLogs.ts
  var logs;
  var config;
  var intervalId;
  var intervalType;
  var intervalPath;
  var intervalTimer;
  var intervalCounter;
  var intervalLog;
  var filterHandler = null;
  var mapHandler = null;
  var cbHandlers = {};
  function addCallbacks(...newCallbacks) {
    newCallbacks.forEach((source) => {
      let descriptors = {};
      descriptors = Object.keys(source).reduce((descriptors2, key) => {
        descriptors2[key] = Object.getOwnPropertyDescriptor(source, key);
        return descriptors2;
      }, descriptors);
      Object.getOwnPropertySymbols(source).forEach((sym) => {
        const descriptor = Object.getOwnPropertyDescriptor(source, sym);
        if (descriptor?.enumerable) {
          descriptors[sym] = descriptor;
        }
      });
      Object.defineProperties(cbHandlers, descriptors);
    });
    return cbHandlers;
  }
  function removeCallbacks(targetKeys) {
    targetKeys.forEach((key) => {
      if (Object.prototype.hasOwnProperty.call(cbHandlers, key)) {
        delete cbHandlers[key];
      }
    });
  }
  function initPackager(newLogs, newConfig) {
    logs = newLogs;
    config = newConfig;
    cbHandlers = {};
    intervalId = null;
    intervalType = null;
    intervalPath = null;
    intervalTimer = null;
    intervalCounter = 0;
    intervalLog = null;
  }
  function packageLog(e, detailFcn) {
    if (!config.on) {
      return false;
    }
    let details = null;
    if (detailFcn) {
      details = detailFcn(e);
    }
    const timeFields = extractTimeFields(
      e.timeStamp && e.timeStamp > 0 ? config.time(e.timeStamp) : Date.now()
    );
    let log2 = {
      target: e.target ? getSelector(e.target) : null,
      path: buildPath(e),
      pageUrl: self.location.href,
      pageTitle: document.title,
      pageReferrer: document.referrer,
      userAgent: self.navigator.userAgent,
      clientTime: timeFields.milli,
      microTime: timeFields.micro,
      location: getLocation(e),
      scrnRes: getScreenRes(),
      type: e.type,
      logType: "raw",
      userAction: true,
      details,
      userId: config.userId,
      toolVersion: config.toolVersion,
      toolName: config.toolName,
      useraleVersion: config.useraleVersion,
      sessionId: config.sessionId,
      httpSessionId: config.httpSessionId,
      browserSessionId: config.browserSessionId,
      attributes: buildAttrs(e),
      style: buildCSS(e)
    };
    if (typeof filterHandler === "function" && !filterHandler(log2)) {
      return false;
    }
    if (typeof mapHandler === "function") {
      log2 = mapHandler(log2, e);
    }
    for (const func of Object.values(cbHandlers)) {
      if (typeof func === "function") {
        log2 = func(log2, e);
        if (!log2) {
          return false;
        }
      }
    }
    logs.push(log2);
    return true;
  }
  function packageCustomLog(customLog, detailFcn, userAction) {
    if (!config.on) {
      return false;
    }
    let details = null;
    if (detailFcn.length === 0) {
      const staticDetailFcn = detailFcn;
      details = staticDetailFcn();
    }
    const metaData = {
      pageUrl: self.location.href,
      pageTitle: document.title,
      pageReferrer: document.referrer,
      userAgent: self.navigator.userAgent,
      clientTime: Date.now(),
      scrnRes: getScreenRes(),
      logType: "custom",
      userAction,
      details,
      userId: config.userId,
      toolVersion: config.toolVersion,
      toolName: config.toolName,
      useraleVersion: config.useraleVersion,
      sessionId: config.sessionId,
      httpSessionId: config.httpSessionId,
      browserSessionId: config.browserSessionId
    };
    let log2 = Object.assign(metaData, customLog);
    if (typeof filterHandler === "function" && !filterHandler(log2)) {
      return false;
    }
    if (typeof mapHandler === "function") {
      log2 = mapHandler(log2);
    }
    for (const func of Object.values(cbHandlers)) {
      if (typeof func === "function") {
        log2 = func(log2, null);
        if (!log2) {
          return false;
        }
      }
    }
    logs.push(log2);
    return true;
  }
  function extractTimeFields(timeStamp) {
    return {
      milli: Math.floor(timeStamp),
      micro: Number((timeStamp % 1).toFixed(3))
    };
  }
  function packageIntervalLog(e) {
    try {
      const target = e.target ? getSelector(e.target) : null;
      const path = buildPath(e);
      const type = e.type;
      const timestamp = Math.floor(
        e.timeStamp && e.timeStamp > 0 ? config.time(e.timeStamp) : Date.now()
      );
      if (intervalId == null) {
        intervalId = target;
        intervalType = type;
        intervalPath = path;
        intervalTimer = timestamp;
        intervalCounter = 0;
      }
      if ((intervalId !== target || intervalType !== type) && intervalTimer) {
        intervalLog = {
          target: intervalId,
          path: intervalPath,
          pageUrl: self.location.href,
          pageTitle: document.title,
          pageReferrer: document.referrer,
          userAgent: self.navigator.userAgent,
          count: intervalCounter,
          duration: timestamp - intervalTimer,
          startTime: intervalTimer,
          endTime: timestamp,
          type: intervalType,
          logType: "interval",
          targetChange: intervalId !== target,
          typeChange: intervalType !== type,
          userAction: false,
          userId: config.userId,
          toolVersion: config.toolVersion,
          toolName: config.toolName,
          useraleVersion: config.useraleVersion,
          sessionId: config.sessionId,
          httpSessionId: config.httpSessionId,
          browserSessionId: config.browserSessionId
        };
        if (typeof filterHandler === "function" && !filterHandler(intervalLog)) {
          return false;
        }
        if (typeof mapHandler === "function") {
          intervalLog = mapHandler(intervalLog, e);
        }
        for (const func of Object.values(cbHandlers)) {
          if (typeof func === "function") {
            intervalLog = func(intervalLog, null);
            if (!intervalLog) {
              return false;
            }
          }
        }
        if (intervalLog)
          logs.push(intervalLog);
        intervalId = target;
        intervalType = type;
        intervalPath = path;
        intervalTimer = timestamp;
        intervalCounter = 0;
      }
      if (intervalId == target && intervalType == type && intervalCounter) {
        intervalCounter = intervalCounter + 1;
      }
      return true;
    } catch {
      return false;
    }
  }
  function getLocation(e) {
    if (e instanceof MouseEvent) {
      if (e.pageX != null) {
        return { x: e.pageX, y: e.pageY };
      } else if (e.clientX != null) {
        return {
          x: document.documentElement.scrollLeft + e.clientX,
          y: document.documentElement.scrollTop + e.clientY
        };
      }
    } else {
      return { x: null, y: null };
    }
  }
  function getScreenRes() {
    return { width: self.innerWidth, height: self.innerHeight };
  }
  function getSelector(ele) {
    if (ele instanceof HTMLElement || ele instanceof Element) {
      if (ele.localName) {
        return ele.localName + (ele.id ? "#" + ele.id : "") + (ele.className ? "." + ele.className : "");
      } else if (ele.nodeName) {
        return ele.nodeName + (ele.id ? "#" + ele.id : "") + (ele.className ? "." + ele.className : "");
      }
    } else if (ele instanceof Document) {
      return "#document";
    } else if (ele === globalThis) {
      return "Window";
    }
    return "Unknown";
  }
  function buildPath(e) {
    const path = e.composedPath();
    return selectorizePath(path);
  }
  function selectorizePath(path) {
    let i = 0;
    let pathEle;
    const pathSelectors = [];
    while (pathEle = path[i]) {
      pathSelectors.push(getSelector(pathEle));
      ++i;
      pathEle = path[i];
    }
    return pathSelectors;
  }
  function buildAttrs(e) {
    const attributes = {};
    const attributeBlackList = ["style"];
    if (e.target && e.target instanceof Element) {
      for (const attr of e.target.attributes) {
        if (attributeBlackList.includes(attr.name))
          continue;
        let val = attr.value;
        try {
          val = JSON.parse(val);
        } catch {
        }
        attributes[attr.name] = val;
      }
    }
    return attributes;
  }
  function buildCSS(e) {
    const properties = {};
    if (e.target && e.target instanceof HTMLElement) {
      const styleObj = e.target.style;
      for (let i = 0; i < styleObj.length; i++) {
        const prop = styleObj[i];
        properties[prop] = styleObj.getPropertyValue(prop);
      }
    }
    return properties;
  }

  // src/attachHandlers.ts
  var events;
  var bufferBools;
  var bufferedEvents;
  var refreshEvents;
  var intervalEvents = [
    "click",
    "focus",
    "blur",
    "input",
    "change",
    "mouseover",
    "submit"
  ];
  var windowEvents = ["load", "blur", "focus"];
  function extractMouseDetails(e) {
    return {
      clicks: e.detail,
      ctrl: e.ctrlKey,
      alt: e.altKey,
      shift: e.shiftKey,
      meta: e.metaKey
    };
  }
  function extractKeyboardDetails(e) {
    return {
      key: e.key,
      code: e.code,
      ctrl: e.ctrlKey,
      alt: e.altKey,
      shift: e.shiftKey,
      meta: e.metaKey
    };
  }
  function extractChangeDetails(e) {
    return {
      value: e.target.value
    };
  }
  function extractWheelDetails(e) {
    return {
      x: e.deltaX,
      y: e.deltaY,
      z: e.deltaZ
    };
  }
  function extractScrollDetails() {
    return {
      x: window.scrollX,
      y: window.scrollY
    };
  }
  function extractResizeDetails() {
    return {
      width: window.outerWidth,
      height: window.outerHeight
    };
  }
  function defineDetails(config3) {
    events = {
      click: extractMouseDetails,
      dblclick: extractMouseDetails,
      mousedown: extractMouseDetails,
      mouseup: extractMouseDetails,
      focus: null,
      blur: null,
      input: config3.logDetails ? extractKeyboardDetails : null,
      change: config3.logDetails ? extractChangeDetails : null,
      dragstart: null,
      dragend: null,
      drag: null,
      drop: null,
      keydown: config3.logDetails ? extractKeyboardDetails : null,
      mouseover: null
    };
    bufferBools = {};
    bufferedEvents = {
      wheel: extractWheelDetails,
      scroll: extractScrollDetails,
      resize: extractResizeDetails
    };
    refreshEvents = {
      submit: null
    };
  }
  function defineCustomDetails(options2, type) {
    const eventType = {
      click: extractMouseDetails,
      dblclick: extractMouseDetails,
      mousedown: extractMouseDetails,
      mouseup: extractMouseDetails,
      focus: null,
      blur: null,
      load: null,
      input: options2.logDetails ? extractKeyboardDetails : null,
      change: options2.logDetails ? extractChangeDetails : null,
      dragstart: null,
      dragend: null,
      drag: null,
      drop: null,
      keydown: options2.logDetails ? extractKeyboardDetails : null,
      mouseover: null,
      wheel: extractWheelDetails,
      scroll: extractScrollDetails,
      resize: extractResizeDetails,
      submit: null
    };
    return eventType[type];
  }
  function attachHandlers(config3) {
    try {
      defineDetails(config3);
      Object.keys(events).forEach(function(ev) {
        document.addEventListener(
          ev,
          function(e) {
            packageLog(e, events[ev]);
          },
          true
        );
      });
      intervalEvents.forEach(function(ev) {
        document.addEventListener(
          ev,
          function(e) {
            packageIntervalLog(e);
          },
          true
        );
      });
      Object.keys(bufferedEvents).forEach(
        function(ev) {
          bufferBools[ev] = true;
          self.addEventListener(
            ev,
            function(e) {
              if (bufferBools[ev]) {
                bufferBools[ev] = false;
                packageLog(e, bufferedEvents[ev]);
                setTimeout(function() {
                  bufferBools[ev] = true;
                }, config3.resolution);
              }
            },
            true
          );
        }
      );
      Object.keys(refreshEvents).forEach(
        function(ev) {
          document.addEventListener(
            ev,
            function(e) {
              packageLog(e, events[ev]);
            },
            true
          );
        }
      );
      windowEvents.forEach(function(ev) {
        self.addEventListener(
          ev,
          function(e) {
            packageLog(e, function() {
              return { window: true };
            });
          },
          true
        );
      });
      return true;
    } catch {
      return false;
    }
  }

  // src/utils/auth/index.ts
  var authCallback = null;
  function updateAuthHeader(config3) {
    if (authCallback) {
      try {
        config3.authHeader = authCallback();
      } catch (e) {
        console.error(`Error encountered while setting the auth header: ${e}`);
      }
    }
  }
  function registerAuthCallback(callback) {
    try {
      verifyCallback(callback);
      authCallback = callback;
      return true;
    } catch {
      return false;
    }
  }
  function verifyCallback(callback) {
    if (typeof callback !== "function") {
      throw new Error("Userale auth callback must be a function");
    }
    const result = callback();
    if (typeof result !== "string") {
      throw new Error("Userale auth callback must return a string");
    }
  }

  // src/utils/headers/index.ts
  var headersCallback = null;
  function updateCustomHeaders(config3) {
    if (headersCallback) {
      try {
        config3.headers = headersCallback();
      } catch (e) {
        console.error(`Error encountered while setting the headers: ${e}`);
      }
    }
  }

  // package.json
  var version = "2.4.0";

  // src/getInitialSettings.ts
  var sessionId = null;
  var httpSessionId = null;
  function getInitialSettings() {
    if (typeof WorkerGlobalScope !== "undefined" && self instanceof WorkerGlobalScope) {
      const settings2 = {
        authHeader: null,
        autostart: true,
        browserSessionId: null,
        custIndex: null,
        headers: null,
        httpSessionId: null,
        logCountThreshold: 5,
        logDetails: false,
        resolution: 500,
        sessionId,
        time: (ts) => ts !== void 0 ? ts : Date.now(),
        toolName: null,
        toolVersion: null,
        transmitInterval: 5e3,
        url: "http://localhost:8000",
        useraleVersion: null,
        userFromParams: null,
        userId: null
      };
      return settings2;
    }
    if (sessionId === null) {
      sessionId = getsessionId(
        "userAlesessionId",
        "session_" + String(Date.now())
      );
    }
    if (httpSessionId === null) {
      httpSessionId = getsessionId(
        "userAleHttpSessionId",
        generatehttpSessionId()
      );
    }
    const script = document.currentScript || function() {
      const scripts = document.getElementsByTagName("script");
      return scripts[scripts.length - 1];
    }();
    const get = script ? script.getAttribute.bind(script) : function() {
      return null;
    };
    const headers = get("data-headers");
    const settings = {
      authHeader: get("data-auth") || null,
      autostart: get("data-autostart") === "false" ? false : true,
      browserSessionId: null,
      custIndex: get("data-index") || null,
      headers: headers ? JSON.parse(headers) : null,
      httpSessionId,
      logCountThreshold: +(get("data-threshold") || 5),
      logDetails: get("data-log-details") === "true" ? true : false,
      resolution: +(get("data-resolution") || 500),
      sessionId: get("data-session") || sessionId,
      time: timeStampScale(document.createEvent("CustomEvent")),
      toolName: get("data-tool") || null,
      toolVersion: get("data-version") || null,
      transmitInterval: +(get("data-interval") || 5e3),
      url: get("data-url") || "http://localhost:8000",
      useraleVersion: get("data-userale-version") || null,
      userFromParams: get("data-user-from-params") || null,
      userId: get("data-user") || null
    };
    return settings;
  }
  function getsessionId(sessionKey, value) {
    if (self.sessionStorage.getItem(sessionKey) === null) {
      self.sessionStorage.setItem(sessionKey, JSON.stringify(value));
      return value;
    }
    return JSON.parse(self.sessionStorage.getItem(sessionKey) || "");
  }
  function timeStampScale(e) {
    let tsScaler;
    if (e.timeStamp && e.timeStamp > 0) {
      const delta = Date.now() - e.timeStamp;
      if (delta < 0) {
        tsScaler = function() {
          return e.timeStamp / 1e3;
        };
      } else if (delta > e.timeStamp) {
        const navStart = performance.timeOrigin;
        tsScaler = function(ts) {
          return ts + navStart;
        };
      } else {
        tsScaler = function(ts) {
          return ts;
        };
      }
    } else {
      tsScaler = function() {
        return Date.now();
      };
    }
    return tsScaler;
  }
  function generatehttpSessionId() {
    const len = 32;
    const arr = new Uint8Array(len / 2);
    window.crypto.getRandomValues(arr);
    return Array.from(arr, (dec) => {
      return dec.toString(16).padStart(2, "0");
    }).join("");
  }

  // src/configure.ts
  var _Configuration = class {
    constructor() {
      this.autostart = false;
      this.authHeader = null;
      this.browserSessionId = null;
      this.custIndex = null;
      this.headers = null;
      this.httpSessionId = null;
      this.logCountThreshold = 0;
      this.logDetails = false;
      this.on = false;
      this.resolution = 0;
      this.sessionId = null;
      this.time = () => Date.now();
      this.toolName = null;
      this.toolVersion = null;
      this.transmitInterval = 0;
      this.url = "";
      this.userFromParams = null;
      this.useraleVersion = null;
      this.userId = null;
      this.version = null;
      this.websocketsEnabled = false;
      if (_Configuration.instance === null) {
        this.initialize();
      }
    }
    static getInstance() {
      if (_Configuration.instance === null) {
        _Configuration.instance = new _Configuration();
      }
      return _Configuration.instance;
    }
    initialize() {
      const settings = getInitialSettings();
      this.update(settings);
    }
    reset() {
      this.initialize();
    }
    update(newConfig) {
      Object.keys(newConfig).forEach((option) => {
        if (option === "userFromParams") {
          const userParamString = newConfig[option];
          const userId = userParamString ? _Configuration.getUserIdFromParams(userParamString) : null;
          if (userId) {
            this["userId"] = userId;
          }
        }
        const hasNewUserFromParams = newConfig["userFromParams"];
        const willNullifyUserId = option === "userId" && newConfig[option] === null;
        if (willNullifyUserId && hasNewUserFromParams) {
          return;
        }
        const newOption = newConfig[option];
        if (newOption !== void 0) {
          this[option] = newOption;
        }
      });
    }
    static getUserIdFromParams(param) {
      const userField = param;
      const regex = new RegExp("[?&]" + userField + "(=([^&#]*)|&|#|$)");
      const results = window.location.href.match(regex);
      if (results && results[2]) {
        return decodeURIComponent(results[2].replace(/\+/g, " "));
      }
      return null;
    }
  };
  var Configuration = _Configuration;
  Configuration.instance = null;

  // src/sendLogs.ts
  var sendIntervalId;
  var wsock;
  function initSender(logs3, config3) {
    if (sendIntervalId) {
      clearInterval(sendIntervalId);
    }
    const url = new URL(config3.url);
    if (url.protocol === "ws:" || url.protocol === "wss:") {
      wsock = new WebSocket(config3.url);
    }
    sendIntervalId = sendOnInterval(logs3, config3);
    sendOnClose(logs3, config3);
  }
  function sendOnInterval(logs3, config3) {
    return setInterval(function() {
      if (!config3.on) {
        return;
      }
      if (logs3.length >= config3.logCountThreshold) {
        sendLogs(logs3.slice(0), config3, 0);
        logs3.splice(0);
      }
    }, config3.transmitInterval);
  }
  function sendOnClose(logs3, config3) {
    self.addEventListener("pagehide", function() {
      if (!config3.on) {
        return;
      }
      if (logs3.length > 0) {
        const url = new URL(config3.url);
        if (url.protocol === "ws:" || url.protocol === "wss:") {
          const data = JSON.stringify(logs3);
          wsock.send(data);
        } else {
          const headers = new Headers();
          headers.set("Content-Type", "application/json;charset=UTF-8");
          if (config3.authHeader) {
            headers.set("Authorization", config3.authHeader.toString());
          }
          fetch(config3.url, {
            keepalive: true,
            method: "POST",
            headers,
            body: JSON.stringify(logs3)
          }).catch((error) => {
            console.error(error);
          });
        }
        logs3.splice(0);
      }
    });
  }
  async function sendLogs(logs3, config3, retries) {
    const data = JSON.stringify(logs3);
    const url = new URL(config3.url);
    if (url.protocol === "ws:" || url.protocol === "wss:") {
      wsock.send(data);
      return;
    }
    const headers = new Headers({
      "Content-Type": "application/json;charset=UTF-8"
    });
    updateAuthHeader(config3);
    if (config3.authHeader) {
      const authHeaderValue = typeof config3.authHeader === "function" ? config3.authHeader() : config3.authHeader;
      headers.set("Authorization", authHeaderValue);
    }
    updateCustomHeaders(config3);
    if (config3.headers) {
      for (const [header, value] of Object.entries(config3.headers)) {
        headers.set(header, value);
      }
    }
    async function attemptSend(remainingRetries) {
      try {
        const response = await fetch(config3.url, {
          method: "POST",
          headers,
          body: data
        });
        if (!response.ok) {
          if (remainingRetries > 0) {
            return attemptSend(remainingRetries - 1);
          } else {
            throw new Error(`Failed to send logs: ${response.statusText}`);
          }
        }
      } catch (error) {
        if (remainingRetries > 0) {
          return attemptSend(remainingRetries - 1);
        }
        throw error;
      }
    }
    return attemptSend(retries);
  }

  // src/main.ts
  var config2 = Configuration.getInstance();
  var logs2 = [];
  var startLoadTimestamp = Date.now();
  var endLoadTimestamp;
  self.onload = function() {
    endLoadTimestamp = Date.now();
  };
  var started = false;
  config2.update({
    useraleVersion: version
  });
  initPackager(logs2, config2);
  if (config2.autostart) {
    setup(config2);
  }
  function setup(config3) {
    if (!started) {
      setTimeout(function() {
        let state;
        try {
          state = document.readyState;
        } catch (error) {
          state = "complete";
        }
        if (config3.autostart && (state === "interactive" || state === "complete")) {
          attachHandlers(config3);
          initSender(logs2, config3);
          started = config3.on = true;
          if (typeof window !== "undefined" && typeof document !== "undefined") {
            packageCustomLog(
              {
                type: "load",
                details: { pageLoadTime: endLoadTimestamp - startLoadTimestamp }
              },
              () => ({}),
              false
            );
          }
        } else {
          setup(config3);
        }
      }, 100);
    }
  }
  var version2 = version;
  function start() {
    if (!started || config2.autostart === false) {
      started = config2.on = true;
      config2.update({ autostart: true });
    }
  }
  function stop() {
    started = config2.on = false;
    config2.update({ autostart: false });
  }
  function options(newConfig) {
    if (newConfig) {
      config2.update(newConfig);
    }
    return config2;
  }
  function log(customLog) {
    if (customLog) {
      logs2.push(customLog);
      return true;
    } else {
      return false;
    }
  }
  if (typeof window !== "undefined") {
    window.userale = {
      start,
      stop,
      options,
      log,
      version,
      details: defineCustomDetails,
      registerAuthCallback,
      addCallbacks,
      removeCallbacks,
      packageLog,
      packageCustomLog,
      getSelector,
      buildPath
    };
  }
})();
/*!
 * Licensed to the Apache Software Foundation (ASF) under one or more
 * contributor license agreements.  See the NOTICE file distributed with
 * this work for additional information regarding copyright ownership.
 * The ASF licenses this file to You under the Apache License, Version 2.0
 * (the "License"); you may not use this file except in compliance with
 * the License.  You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
/*!
 * Licensed to the Apache Software Foundation (ASF) under one or more
 * contributor license agreements.  See the NOTICE file distributed with
 * this work for additional information regarding copyright ownership.
 * The ASF licenses this file to You under the Apache License, Version 2.0
 * (the 'License'); you may not use this file except in compliance with
 * the License.  You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an 'AS IS' BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
//# sourceMappingURL=main.global.js.map
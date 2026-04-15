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
var userale = (() => {
  // ../core-sdk/build/main.mjs
  var version = "2.4.0";
  var Packager = class {
    constructor(logs, config) {
      this.intervalId = null;
      this.intervalType = null;
      this.intervalPath = null;
      this.intervalTimer = null;
      this.intervalCounter = 0;
      this.logs = logs;
      this.config = config;
      this.cbHandlers = {};
    }
    addCallbacks(...newCallbacks) {
      for (const source of newCallbacks) {
        const descriptors = {};
        for (const key of Object.keys(source)) {
          const d = Object.getOwnPropertyDescriptor(source, key);
          if (d)
            descriptors[key] = d;
        }
        for (const sym of Object.getOwnPropertySymbols(source)) {
          const d = Object.getOwnPropertyDescriptor(source, sym);
          if (d?.enumerable)
            descriptors[sym] = d;
        }
        Object.defineProperties(this.cbHandlers, descriptors);
      }
      return this.cbHandlers;
    }
    removeCallbacks(targetKeys) {
      for (const key of targetKeys) {
        if (Object.prototype.hasOwnProperty.call(this.cbHandlers, key)) {
          delete this.cbHandlers[key];
        }
      }
    }
    applyPipeline(log, e) {
      for (const func of Object.values(this.cbHandlers)) {
        if (typeof func === "function") {
          log = func(log, e);
          if (!log)
            return null;
        }
      }
      return log;
    }
    packageLog(e, detailFcn) {
      if (!this.config.on)
        return false;
      const timeFields = extractTimeFields(
        e.timeStamp && e.timeStamp > 0 ? this.config.time(e.timeStamp) : Date.now()
      );
      const raw = {
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
        details: detailFcn ? detailFcn(e) : null,
        userId: this.config.userId,
        toolVersion: this.config.toolVersion,
        toolName: this.config.toolName,
        useraleVersion: this.config.useraleVersion,
        sessionId: this.config.sessionId,
        httpSessionId: this.config.httpSessionId,
        browserSessionId: this.config.browserSessionId,
        attributes: buildAttrs(e),
        style: buildCSS(e)
      };
      const result = this.applyPipeline(raw, e);
      if (!result)
        return false;
      this.logs.push(result);
      return true;
    }
    packageCustomLog(userLog, detailFcn, userAction) {
      if (!this.config.on)
        return false;
      const details = detailFcn.length === 0 ? detailFcn() : null;
      const log = Object.assign(
        {
          pageUrl: self.location.href,
          pageTitle: document.title,
          pageReferrer: document.referrer,
          userAgent: self.navigator.userAgent,
          clientTime: Date.now(),
          scrnRes: getScreenRes(),
          logType: "custom",
          userAction,
          details,
          userId: this.config.userId,
          toolVersion: this.config.toolVersion,
          toolName: this.config.toolName,
          useraleVersion: this.config.useraleVersion,
          sessionId: this.config.sessionId,
          httpSessionId: this.config.httpSessionId,
          browserSessionId: this.config.browserSessionId
        },
        userLog
      );
      const result = this.applyPipeline(log, null);
      if (!result)
        return false;
      this.logs.push(result);
      return true;
    }
    packageIntervalLog(e) {
      const target = e.target ? getSelector(e.target) : null;
      const path = buildPath(e);
      const type = e.type;
      const timestamp = Math.floor(
        e.timeStamp && e.timeStamp > 0 ? this.config.time(e.timeStamp) : Date.now()
      );
      if (this.intervalId == null) {
        this.intervalId = target;
        this.intervalType = type;
        this.intervalPath = path;
        this.intervalTimer = timestamp;
        this.intervalCounter = 0;
        return true;
      }
      if ((this.intervalId !== target || this.intervalType !== type) && this.intervalTimer !== null) {
        const interval = {
          target: this.intervalId,
          path: this.intervalPath,
          pageUrl: self.location.href,
          pageTitle: document.title,
          pageReferrer: document.referrer,
          userAgent: self.navigator.userAgent,
          clientTime: this.intervalTimer,
          scrnRes: getScreenRes(),
          count: this.intervalCounter,
          duration: timestamp - this.intervalTimer,
          startTime: this.intervalTimer,
          endTime: timestamp,
          type: this.intervalType,
          logType: "interval",
          targetChange: this.intervalId !== target,
          typeChange: this.intervalType !== type,
          userAction: false,
          details: null,
          userId: this.config.userId,
          toolVersion: this.config.toolVersion,
          toolName: this.config.toolName,
          useraleVersion: this.config.useraleVersion,
          sessionId: this.config.sessionId,
          httpSessionId: this.config.httpSessionId,
          browserSessionId: this.config.browserSessionId
        };
        const result = this.applyPipeline(interval, e);
        if (result)
          this.logs.push(result);
        this.intervalId = target;
        this.intervalType = type;
        this.intervalPath = path;
        this.intervalTimer = timestamp;
        this.intervalCounter = 0;
      } else if (this.intervalId === target && this.intervalType === type) {
        this.intervalCounter += 1;
      }
      return true;
    }
  };
  function extractTimeFields(timeStamp) {
    return {
      milli: Math.floor(timeStamp),
      micro: Number((timeStamp % 1).toFixed(3))
    };
  }
  function getLocation(e) {
    if (e instanceof MouseEvent) {
      if (e.pageX != null) {
        return { x: e.pageX, y: e.pageY };
      }
      return {
        x: document.documentElement.scrollLeft + e.clientX,
        y: document.documentElement.scrollTop + e.clientY
      };
    }
    return { x: null, y: null };
  }
  function getScreenRes() {
    return { width: self.innerWidth, height: self.innerHeight };
  }
  function getSelector(ele) {
    if (ele instanceof HTMLElement || ele instanceof Element) {
      const base = ele.localName || ele.nodeName;
      if (base) {
        return base + (ele.id ? "#" + ele.id : "") + (ele.className ? "." + ele.className : "");
      }
    } else if (ele instanceof Document) {
      return "#document";
    } else if (ele === globalThis) {
      return "Window";
    }
    return "Unknown";
  }
  function buildPath(e) {
    return selectorizePath(e.composedPath());
  }
  function selectorizePath(path) {
    return path.map(getSelector);
  }
  function buildAttrs(e) {
    const attributes = {};
    const attributeBlockList = ["style"];
    if (e.target instanceof Element) {
      for (const attr2 of e.target.attributes) {
        if (attributeBlockList.includes(attr2.name))
          continue;
        try {
          attributes[attr2.name] = JSON.parse(attr2.value);
        } catch {
          attributes[attr2.name] = attr2.value;
        }
      }
    }
    return attributes;
  }
  function buildCSS(e) {
    const properties = {};
    if (e.target instanceof HTMLElement) {
      const styleObj = e.target.style;
      for (let i = 0; i < styleObj.length; i++) {
        const prop = styleObj[i];
        properties[prop] = styleObj.getPropertyValue(prop);
      }
    }
    return properties;
  }
  var authCallback = null;
  function updateAuthHeader(config) {
    if (authCallback) {
      try {
        config.authHeader = authCallback();
      } catch (e) {
        console.error(`Error encountered while setting the auth header: ${e}`);
      }
    }
  }
  var headersCallback = null;
  function updateCustomHeaders(config) {
    if (headersCallback) {
      try {
        config.headers = headersCallback();
      } catch (e) {
        console.error(`Error encountered while setting the headers: ${e}`);
      }
    }
  }
  function generateTraceId() {
    const bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);
    return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
  }
  function generateSpanId() {
    const bytes = new Uint8Array(8);
    crypto.getRandomValues(bytes);
    return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
  }
  function encodeValue(v) {
    if (v === null || v === void 0)
      return { stringValue: "" };
    if (typeof v === "boolean")
      return { boolValue: v };
    if (typeof v === "number") {
      return Number.isInteger(v) ? { intValue: String(v) } : { doubleValue: v };
    }
    if (typeof v === "string")
      return { stringValue: v };
    if (Array.isArray(v)) {
      return { arrayValue: { values: v.map(encodeValue) } };
    }
    if (typeof v === "object") {
      return {
        kvlistValue: {
          values: Object.entries(v).map(
            ([k, val]) => ({ key: k, value: encodeValue(val) })
          )
        }
      };
    }
    return { stringValue: String(v) };
  }
  function attr(key, v) {
    return { key, value: encodeValue(v) };
  }
  function toNanoString(clientTimeMs, microTime = 0) {
    return String(
      BigInt(Math.floor(clientTimeMs)) * 1000000n + BigInt(Math.round(microTime * 1e6))
    );
  }
  function buildResource(config) {
    const attributes = [
      attr("service.name", config.toolName ?? "userale"),
      attr("service.version", config.toolVersion ?? ""),
      attr("userale.version", config.useraleVersion ?? ""),
      attr("userale.sessionId", config.sessionId ?? "")
    ];
    if (config.userId)
      attributes.push(attr("userale.userId", config.userId));
    return { attributes };
  }
  var SCOPE = {
    name: "flagon-userale",
    version: ""
  };
  var KNOWN_LOG_KEYS = /* @__PURE__ */ new Set([
    "logType",
    "type",
    "userAction",
    "pageUrl",
    "pageTitle",
    "pageReferrer",
    "userAgent",
    "sessionId",
    "browserSessionId",
    "httpSessionId",
    "clientTime",
    "microTime",
    "target",
    "path",
    "location",
    "scrnRes",
    "details",
    "attributes",
    "style",
    "userId",
    "toolVersion",
    "toolName",
    "useraleVersion"
  ]);
  function buildLogRecord(log, spanId, traceId) {
    const clientTime = log.clientTime ?? Date.now();
    const microTime = log.logType === "raw" ? log.microTime ?? 0 : 0;
    const attributes = [
      attr("userale.logType", log.logType),
      attr("userale.type", log.type),
      attr("userale.userAction", log.userAction),
      attr("browser.url", log.pageUrl),
      attr("browser.title", log.pageTitle),
      attr("browser.referrer", log.pageReferrer),
      attr("user_agent.original", log.userAgent),
      attr("userale.sessionId", log.sessionId),
      attr("userale.browserSessionId", log.browserSessionId),
      attr("userale.httpSessionId", log.httpSessionId),
      attr("userale.scrnRes", log.scrnRes)
    ];
    if (log.details !== null && log.details !== void 0) {
      attributes.push(attr("userale.details", log.details));
    }
    if (log.logType === "raw") {
      if (log.target !== void 0)
        attributes.push(attr("userale.target", log.target));
      if (log.path !== void 0)
        attributes.push(attr("userale.path", log.path));
      if (log.location !== void 0)
        attributes.push(attr("userale.location", log.location));
      if (Object.keys(log.attributes).length > 0)
        attributes.push(attr("userale.attributes", log.attributes));
      if (Object.keys(log.style).length > 0)
        attributes.push(attr("userale.style", log.style));
    }
    for (const key of Object.keys(log)) {
      if (!KNOWN_LOG_KEYS.has(key)) {
        const val = log[key];
        if (val !== void 0)
          attributes.push(attr(key, val));
      }
    }
    return {
      timeUnixNano: toNanoString(clientTime, microTime),
      observedTimeUnixNano: toNanoString(Date.now()),
      severityNumber: log.userAction ? 9 : 5,
      severityText: log.userAction ? "INFO" : "DEBUG",
      eventName: log.type ?? "",
      body: { stringValue: log.type ?? "" },
      attributes,
      traceId,
      spanId
    };
  }
  function buildSpan(log) {
    const attributes = [
      attr("userale.logType", "interval"),
      attr("userale.type", log.type),
      attr("userale.count", log.count),
      attr("userale.targetChange", log.targetChange),
      attr("userale.typeChange", log.typeChange),
      attr("userale.sessionId", log.sessionId),
      attr("userale.browserSessionId", log.browserSessionId),
      attr("userale.httpSessionId", log.httpSessionId),
      attr("browser.url", log.pageUrl),
      attr("browser.title", log.pageTitle),
      attr("user_agent.original", log.userAgent)
    ];
    if (log.target !== void 0)
      attributes.push(attr("userale.target", log.target));
    if (log.path !== void 0)
      attributes.push(attr("userale.path", log.path));
    return {
      traceId: generateTraceId(),
      spanId: generateSpanId(),
      name: `userale.${log.type ?? "interval"}`,
      kind: 1,
      startTimeUnixNano: toNanoString(log.startTime ?? 0),
      endTimeUnixNano: toNanoString(log.endTime ?? 0),
      attributes,
      status: { code: 0 }
    };
  }
  function buildPayloads(logs, traceId, spanId, config) {
    const logRecords = [];
    const spans = [];
    for (const log of logs) {
      if (log.logType === "interval") {
        spans.push(buildSpan(log));
      } else {
        logRecords.push(buildLogRecord(log, spanId, traceId));
      }
    }
    const resource = buildResource(config);
    const scope = {
      ...SCOPE,
      version: config.useraleVersion ?? ""
    };
    const logsPayload = logRecords.length > 0 ? {
      resourceLogs: [
        {
          resource,
          scopeLogs: [{ scope, logRecords, schemaUrl: "" }],
          schemaUrl: ""
        }
      ]
    } : void 0;
    const tracesPayload = spans.length > 0 ? {
      resourceSpans: [
        {
          resource,
          scopeSpans: [{ scope, spans, schemaUrl: "" }],
          schemaUrl: ""
        }
      ]
    } : void 0;
    return { logs: logsPayload, traces: tracesPayload };
  }
  function buildHeaders(config) {
    updateAuthHeader(config);
    updateCustomHeaders(config);
    const headers = new Headers({ "Content-Type": "application/json" });
    if (config.authHeader) {
      const value = typeof config.authHeader === "function" ? config.authHeader() : config.authHeader;
      headers.set("Authorization", value);
    }
    if (config.headers) {
      for (const [key, value] of Object.entries(config.headers)) {
        headers.set(key, value);
      }
    }
    return headers;
  }
  async function exportBatch(logs, traceId, spanId, config) {
    const { logs: logsPayload, traces: tracesPayload } = buildPayloads(
      logs,
      traceId,
      spanId,
      config
    );
    const baseUrl = config.url.replace(/\/$/, "");
    const headers = buildHeaders(config);
    const sends = [];
    if (logsPayload) {
      sends.push(
        fetch(`${baseUrl}/v1/logs`, {
          method: "POST",
          headers,
          body: JSON.stringify(logsPayload)
        })
      );
    }
    if (tracesPayload) {
      sends.push(
        fetch(`${baseUrl}/v1/traces`, {
          method: "POST",
          headers,
          body: JSON.stringify(tracesPayload)
        })
      );
    }
    await Promise.all(sends);
  }
  var Sender = class {
    constructor() {
      this.activeTraceId = "";
      this.activeSpanId = "";
    }
    start(logs, config) {
      if (this.sendIntervalId) {
        clearInterval(this.sendIntervalId);
      }
      this.activeTraceId = generateTraceId();
      this.activeSpanId = generateSpanId();
      this.sendIntervalId = this.onInterval(logs, config);
      this.onClose(logs, config);
    }
    stop() {
      if (this.sendIntervalId) {
        clearInterval(this.sendIntervalId);
        this.sendIntervalId = void 0;
      }
    }
    onInterval(logs, config) {
      return setInterval(() => {
        if (!config.on)
          return;
        if (logs.length >= config.logCountThreshold) {
          exportBatch(
            logs.slice(0),
            this.activeTraceId,
            this.activeSpanId,
            config
          );
          logs.splice(0);
        }
      }, config.transmitInterval);
    }
    onClose(logs, config) {
      self.addEventListener("pagehide", () => {
        if (!config.on || logs.length === 0)
          return;
        const { logs: logsPayload, traces: tracesPayload } = buildPayloads(
          logs,
          this.activeTraceId,
          this.activeSpanId,
          config
        );
        const baseUrl = config.url.replace(/\/$/, "");
        const headers = buildHeaders(config);
        if (logsPayload) {
          fetch(`${baseUrl}/v1/logs`, {
            keepalive: true,
            method: "POST",
            headers,
            body: JSON.stringify(logsPayload)
          }).catch((error) => {
            console.error(error);
          });
        }
        if (tracesPayload) {
          fetch(`${baseUrl}/v1/traces`, {
            keepalive: true,
            method: "POST",
            headers,
            body: JSON.stringify(tracesPayload)
          }).catch((error) => {
            console.error(error);
          });
        }
        logs.splice(0);
      });
    }
    flush(logs, config) {
      return exportBatch(logs, this.activeTraceId, this.activeSpanId, config);
    }
  };
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
  function defineDetails(config) {
    return {
      click: extractMouseDetails,
      dblclick: extractMouseDetails,
      mousedown: extractMouseDetails,
      mouseup: extractMouseDetails,
      focus: null,
      blur: null,
      input: config.logDetails ? extractKeyboardDetails : null,
      change: config.logDetails ? extractChangeDetails : null,
      dragstart: null,
      dragend: null,
      drag: null,
      drop: null,
      keydown: config.logDetails ? extractKeyboardDetails : null,
      mouseover: null
    };
  }
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
  var bufferedEvents = {
    wheel: extractWheelDetails,
    scroll: extractScrollDetails,
    resize: extractResizeDetails
  };
  var refreshEvents = {
    submit: null
  };
  function attachHandlers(config, packager) {
    try {
      const events = defineDetails(config);
      const bufferBools = {};
      Object.keys(events).forEach(function(ev) {
        document.addEventListener(
          ev,
          function(e) {
            packager.packageLog(e, events[ev]);
          },
          true
        );
      });
      intervalEvents.forEach(function(ev) {
        document.addEventListener(
          ev,
          function(e) {
            packager.packageIntervalLog(e);
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
                packager.packageLog(e, bufferedEvents[ev]);
                setTimeout(function() {
                  bufferBools[ev] = true;
                }, config.resolution);
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
              packager.packageLog(e, events[ev]);
            },
            true
          );
        }
      );
      windowEvents.forEach(function(ev) {
        self.addEventListener(
          ev,
          function(e) {
            packager.packageLog(e, function() {
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
  var startLoadTimestamp = Date.now();
  var endLoadTimestamp = startLoadTimestamp;
  self.addEventListener("load", () => {
    endLoadTimestamp = Date.now();
  });
  var UserALE = class {
    constructor(config) {
      this.started = false;
      this.config = config;
      this.config.update({ useraleVersion: version });
      this.logs = [];
      this.packager = new Packager(this.logs, this.config);
      this.sender = new Sender();
    }
    start() {
      this.whenReady(() => {
        this.attach();
        this.sender.start(this.logs, this.config);
      });
    }
    capture() {
      this.whenReady(() => this.attach());
    }
    stop() {
      this.started = this.config.on = false;
      this.sender.stop();
    }
    whenReady(fn) {
      if (typeof document === "undefined") {
        fn();
        return;
      }
      if (document.readyState === "interactive" || document.readyState === "complete") {
        fn();
      } else {
        document.addEventListener("DOMContentLoaded", fn, { once: true });
      }
    }
    attach() {
      if (!this.started) {
        attachHandlers(this.config, this.packager);
        this.started = this.config.on = true;
        if (typeof window !== "undefined" && typeof document !== "undefined") {
          this.packager.packageCustomLog(
            {
              type: "load",
              details: { pageLoadTime: endLoadTimestamp - startLoadTimestamp }
            },
            () => ({}),
            false
          );
        }
      } else {
        this.config.on = true;
      }
    }
    options(newConfig) {
      if (newConfig)
        this.config.update(newConfig);
      return this.config;
    }
    log(customLog) {
      if (customLog) {
        this.logs.push(customLog);
        return true;
      }
      return false;
    }
    flush() {
      return this.sender.flush(this.logs, this.config);
    }
    addCallbacks(...newCallbacks) {
      this.packager.addCallbacks(...newCallbacks);
    }
    removeCallbacks(targetKeys) {
      this.packager.removeCallbacks(targetKeys);
    }
    packageCustomLog(userLog, detailFcn, userAction) {
      return this.packager.packageCustomLog(userLog, detailFcn, userAction);
    }
  };
  var sessionId = null;
  var httpSessionId = null;
  function getInitialSettings() {
    if (typeof WorkerGlobalScope !== "undefined" && self instanceof WorkerGlobalScope) {
      return {
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
        url: "http://localhost:4318",
        useraleVersion: null,
        userFromParams: null,
        userId: null
      };
    }
    if (sessionId === null) {
      sessionId = getOrCreateSessionId(
        "userAlesessionId",
        "session_" + String(Date.now())
      );
    }
    if (httpSessionId === null) {
      httpSessionId = getOrCreateSessionId(
        "userAleHttpSessionId",
        generateSpanId()
      );
    }
    const script = document.currentScript ?? (() => {
      const scripts = document.getElementsByTagName("script");
      return scripts[scripts.length - 1] ?? null;
    })();
    const get = (attr2) => script ? script.getAttribute(attr2) : null;
    const headers = get("data-headers");
    return {
      authHeader: get("data-auth"),
      autostart: get("data-autostart") !== "false",
      browserSessionId: null,
      custIndex: get("data-index"),
      headers: headers ? JSON.parse(headers) : null,
      httpSessionId,
      logCountThreshold: +(get("data-threshold") ?? 5),
      logDetails: get("data-log-details") === "true",
      resolution: +(get("data-resolution") ?? 500),
      sessionId: get("data-session") ?? sessionId,
      time: timeStampScale(document.createEvent("CustomEvent")),
      toolName: get("data-tool"),
      toolVersion: get("data-version"),
      transmitInterval: +(get("data-interval") ?? 5e3),
      url: get("data-url") ?? "http://localhost:4318",
      useraleVersion: get("data-userale-version"),
      userFromParams: get("data-user-from-params"),
      userId: get("data-user")
    };
  }
  function getOrCreateSessionId(key, defaultValue) {
    const stored = self.sessionStorage.getItem(key);
    if (stored === null) {
      self.sessionStorage.setItem(key, JSON.stringify(defaultValue));
      return defaultValue;
    }
    return JSON.parse(stored);
  }
  function timeStampScale(e) {
    if (e.timeStamp && e.timeStamp > 0) {
      const delta = Date.now() - e.timeStamp;
      if (delta < 0) {
        return () => e.timeStamp / 1e3;
      } else if (delta > e.timeStamp) {
        const navStart = performance.timeOrigin;
        return (ts) => ts + navStart;
      } else {
        return (ts) => ts;
      }
    }
    return () => Date.now();
  }
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

  // src/main.ts
  var instance = new UserALE(Configuration.getInstance());
  if (instance.config.autostart) {
    instance.start();
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
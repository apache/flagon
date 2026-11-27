/*! Licensed to the Apache Software Foundation (ASF) under one or more
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

// package.json
var version = "2.4.0";

// src/domUtils.ts
var DEFAULT_IGNORE_SELECTOR = '[data-userale-ignore]:not([data-userale-ignore="false"]), .userale-ignore';
var DEFAULT_REDACT_SELECTOR = '[data-userale-redact]:not([data-userale-redact="false"]), [data-userale-mask]:not([data-userale-mask="false"]), .userale-redact, .userale-mask';
function getProtoDescriptor(obj, prop) {
  let proto = Object.getPrototypeOf(obj);
  while (proto && proto !== Object.prototype) {
    const desc = Object.getOwnPropertyDescriptor(proto, prop);
    if (desc) {
      return desc;
    }
    proto = Object.getPrototypeOf(proto);
  }
  return void 0;
}
function callProtoGetter(obj, prop) {
  if (!obj || typeof obj !== "object") {
    return void 0;
  }
  const desc = getProtoDescriptor(obj, prop);
  if (typeof desc?.get === "function") {
    try {
      return desc.get.call(obj);
    } catch {
      return void 0;
    }
  }
  return void 0;
}
function callProtoMethod(obj, prop, ...args) {
  if (!obj || typeof obj !== "object") {
    return void 0;
  }
  const desc = getProtoDescriptor(obj, prop);
  if (typeof desc?.value === "function") {
    return desc.value.apply(obj, args);
  }
  return void 0;
}
function isNodeObject(val) {
  const nodeType = callProtoGetter(val, "nodeType");
  return typeof nodeType === "number";
}
function isElementNode(val) {
  return callProtoGetter(val, "nodeType") === 1;
}
function isDocumentNode(val) {
  return callProtoGetter(val, "nodeType") === 9;
}
function safeGetParentNode(node) {
  return callProtoGetter(node, "parentNode") ?? null;
}
function safeGetShadowHost(node) {
  if (callProtoGetter(node, "nodeType") !== 11) {
    return null;
  }
  const host = callProtoGetter(node, "host");
  return isElementNode(host) ? host : null;
}
function getParentAcrossShadow(node) {
  const parent = safeGetParentNode(node);
  if (parent) {
    return parent;
  }
  return safeGetShadowHost(node);
}
function matchesStrict(el, selector) {
  if (!selector) {
    return false;
  }
  const desc = getProtoDescriptor(el, "matches");
  if (typeof desc?.value !== "function") {
    return false;
  }
  return Boolean(desc.value.call(el, selector));
}
function safeMatches(el, selector) {
  try {
    return matchesStrict(el, selector);
  } catch {
    return false;
  }
}
function safeGetAttribute(el, name) {
  try {
    const val = callProtoMethod(el, "getAttribute", name);
    return val === void 0 ? null : val;
  } catch {
    return null;
  }
}
function safeGetAttributes(el) {
  return callProtoGetter(el, "attributes") ?? null;
}
function safeGetStyle(el) {
  return callProtoGetter(el, "style") ?? null;
}
function safeGetId(el) {
  return safeGetAttribute(el, "id") ?? "";
}
function safeGetClassName(el) {
  return safeGetAttribute(el, "class") ?? "";
}
function safeGetLocalName(el) {
  const local = callProtoGetter(el, "localName");
  if (typeof local === "string" && local.length > 0) {
    return local;
  }
  const nodeName = callProtoGetter(el, "nodeName");
  return typeof nodeName === "string" ? nodeName : "";
}
function safeComposedPath(e) {
  if (!e || typeof e !== "object") {
    return [];
  }
  try {
    const path = callProtoMethod(e, "composedPath");
    return Array.isArray(path) ? path : [];
  } catch {
    return [];
  }
}
function getEventOriginElement(e) {
  const composed = safeComposedPath(e);
  const rawOrigin = composed.length > 0 ? composed[0] : e.target;
  if (isElementNode(rawOrigin)) {
    return rawOrigin;
  }
  if (isNodeObject(rawOrigin)) {
    let cur = getParentAcrossShadow(rawOrigin);
    while (cur) {
      if (isElementNode(cur)) {
        return cur;
      }
      cur = getParentAcrossShadow(cur);
    }
  }
  return null;
}
function closestComposed(start2, selector) {
  if (!start2 || !selector) {
    return null;
  }
  let cur = start2;
  while (cur) {
    if (isElementNode(cur) && safeMatches(cur, selector)) {
      return cur;
    }
    cur = getParentAcrossShadow(cur);
  }
  return null;
}
function isEventLike(val) {
  if (!val || typeof val !== "object") {
    return false;
  }
  return typeof callProtoGetter(val, "type") === "string" && (getProtoDescriptor(val, "target") !== void 0 || "target" in val);
}
function isNodeIgnored(node, ignoreSelector = DEFAULT_IGNORE_SELECTOR) {
  if (!node || typeof node !== "object") {
    return false;
  }
  try {
    if (isEventLike(node)) {
      const path = safeComposedPath(node);
      for (const item of path) {
        if (isElementNode(item) && matchesStrict(item, ignoreSelector)) {
          return true;
        }
      }
      let cur = getEventOriginElement(node);
      while (cur) {
        if (isElementNode(cur) && matchesStrict(cur, ignoreSelector)) {
          return true;
        }
        cur = getParentAcrossShadow(cur);
      }
      return false;
    }
    if (isNodeObject(node)) {
      let cur = node;
      while (cur) {
        if (isElementNode(cur) && matchesStrict(cur, ignoreSelector)) {
          return true;
        }
        cur = getParentAcrossShadow(cur);
      }
    }
    return false;
  } catch {
    return true;
  }
}
function isElementRedacted(target, redactSelector = DEFAULT_REDACT_SELECTOR) {
  if (!isNodeObject(target)) {
    return false;
  }
  return Boolean(closestComposed(target, redactSelector));
}

// src/privacy.ts
var DEFAULT_PRIVACY_OPTIONS = Object.freeze({
  preset: "default",
  allowlistSelector: null,
  capturePageUrl: true,
  capturePageTitle: true,
  capturePageReferrer: true,
  captureHost: true,
  captureUserAgent: true,
  captureScreenRes: true,
  captureLocation: true,
  captureTargetRect: true,
  captureDetails: true,
  captureMicroTime: true,
  attachTraceContext: true,
  ignoreUntrustedEvents: false,
  domSelectorMode: "full",
  allowedAttributes: null
});
var STRICT_PRIVACY_OPTIONS = Object.freeze({
  preset: "strict",
  allowlistSelector: null,
  capturePageUrl: false,
  capturePageTitle: false,
  capturePageReferrer: false,
  captureHost: false,
  captureUserAgent: false,
  captureScreenRes: false,
  captureLocation: false,
  captureTargetRect: false,
  captureDetails: false,
  captureMicroTime: false,
  attachTraceContext: false,
  ignoreUntrustedEvents: true,
  domSelectorMode: "none",
  allowedAttributes: Object.freeze([])
});
var PRIVACY_BOOL_KEYS = [
  "capturePageUrl",
  "capturePageTitle",
  "capturePageReferrer",
  "captureHost",
  "captureUserAgent",
  "captureScreenRes",
  "captureLocation",
  "captureTargetRect",
  "captureDetails",
  "captureMicroTime",
  "attachTraceContext",
  "ignoreUntrustedEvents"
];
var ATTRIBUTE_BLACKLIST = /* @__PURE__ */ new Set(["style", "data-api-key", "data-auth"]);
var SENSITIVE_ATTRIBUTE_RE = /^data-(api-key|auth|token|secret|password)/i;
function isPrivacySensitiveAttribute(name) {
  return ATTRIBUTE_BLACKLIST.has(name.toLowerCase()) || SENSITIVE_ATTRIBUTE_RE.test(name);
}
function validateCssSelector(selector) {
  if (typeof selector !== "string" || selector.trim().length === 0) {
    return false;
  }
  if (typeof document !== "undefined" && typeof document.createElement === "function") {
    try {
      document.createElement("div").matches(selector);
      return true;
    } catch {
      return false;
    }
  }
  return true;
}
function clonePrivacyOptions(opts) {
  return {
    preset: opts.preset,
    allowlistSelector: opts.allowlistSelector,
    capturePageUrl: opts.capturePageUrl,
    capturePageTitle: opts.capturePageTitle,
    capturePageReferrer: opts.capturePageReferrer,
    captureHost: opts.captureHost,
    captureUserAgent: opts.captureUserAgent,
    captureScreenRes: opts.captureScreenRes,
    captureLocation: opts.captureLocation,
    captureTargetRect: opts.captureTargetRect,
    captureDetails: opts.captureDetails,
    captureMicroTime: opts.captureMicroTime,
    attachTraceContext: opts.attachTraceContext,
    ignoreUntrustedEvents: opts.ignoreUntrustedEvents,
    domSelectorMode: opts.domSelectorMode,
    allowedAttributes: Array.isArray(opts.allowedAttributes) ? [...opts.allowedAttributes] : null
  };
}
function freezePrivacyOptions(opts) {
  const cloned = clonePrivacyOptions(opts);
  if (Array.isArray(cloned.allowedAttributes)) {
    Object.freeze(cloned.allowedAttributes);
  }
  return Object.freeze(cloned);
}
function hasOwn(obj, key) {
  return Object.prototype.hasOwnProperty.call(obj, key);
}
function mergePrivacyOptions(current, incoming) {
  if (!incoming || typeof incoming !== "object") {
    const cloned = clonePrivacyOptions(current);
    return {
      resolved: cloned,
      allowlistSelectorInvalid: cloned.allowlistSelector !== null && !validateCssSelector(cloned.allowlistSelector)
    };
  }
  let base;
  if (hasOwn(incoming, "preset")) {
    if (incoming.preset === "strict" && current.preset !== "strict") {
      base = clonePrivacyOptions(STRICT_PRIVACY_OPTIONS);
    } else if (incoming.preset === "default" && current.preset !== "default") {
      base = clonePrivacyOptions(DEFAULT_PRIVACY_OPTIONS);
    } else {
      base = clonePrivacyOptions(current);
    }
  } else {
    base = clonePrivacyOptions(current);
  }
  for (const key of PRIVACY_BOOL_KEYS) {
    if (hasOwn(incoming, key)) {
      const val = incoming[key];
      if (typeof val === "boolean") {
        base[key] = val;
      }
    }
  }
  if (hasOwn(incoming, "domSelectorMode")) {
    const mode = incoming.domSelectorMode;
    if (mode === "full" || mode === "structural" || mode === "none") {
      base.domSelectorMode = mode;
    }
  }
  if (hasOwn(incoming, "allowlistSelector")) {
    const sel = incoming.allowlistSelector;
    if (sel === null) {
      base.allowlistSelector = null;
    } else if (typeof sel === "string") {
      base.allowlistSelector = sel;
    }
  }
  if (hasOwn(incoming, "allowedAttributes")) {
    const attrs = incoming.allowedAttributes;
    if (attrs === null) {
      base.allowedAttributes = null;
    } else if (Array.isArray(attrs)) {
      const seen = /* @__PURE__ */ new Set();
      for (const item of attrs) {
        if (typeof item === "string" && item.length > 0) {
          seen.add(item);
        }
      }
      base.allowedAttributes = Array.from(seen);
    }
  }
  let allowlistSelectorInvalid = false;
  if (base.allowlistSelector !== null && !validateCssSelector(base.allowlistSelector)) {
    allowlistSelectorInvalid = true;
    console.error(
      "[UserALE] Invalid privacy.allowlistSelector; failing closed."
    );
  }
  return { resolved: base, allowlistSelectorInvalid };
}
function evaluateEventPrivacyFilter(e, privacy, allowlistSelectorInvalid, ignoreSelector = DEFAULT_IGNORE_SELECTOR) {
  if (privacy.ignoreUntrustedEvents && e.isTrusted === false) {
    return { allowed: false, matchedElement: null };
  }
  if (isNodeIgnored(e, ignoreSelector)) {
    return { allowed: false, matchedElement: null };
  }
  if (allowlistSelectorInvalid) {
    return { allowed: false, matchedElement: null };
  }
  if (privacy.allowlistSelector !== null) {
    const originEl = getEventOriginElement(e);
    if (originEl !== null) {
      const matched = closestComposed(originEl, privacy.allowlistSelector);
      return matched ? { allowed: true, matchedElement: matched } : { allowed: false, matchedElement: null };
    }
    const target = e.target;
    const isWindowOrDoc = typeof self !== "undefined" && target === self || target === globalThis || isDocumentNode(target);
    return isWindowOrDoc ? { allowed: true, matchedElement: null } : { allowed: false, matchedElement: null };
  }
  return { allowed: true, matchedElement: getEventOriginElement(e) };
}
function stripSelectorToStructural(sel) {
  if (!sel || sel === "#document" || sel === "Window" || sel === "Unknown") {
    return sel;
  }
  const hashIdx = sel.indexOf("#");
  const dotIdx = sel.indexOf(".");
  let cutIdx = -1;
  if (hashIdx >= 0 && dotIdx >= 0) {
    cutIdx = Math.min(hashIdx, dotIdx);
  } else if (hashIdx >= 0) {
    cutIdx = hashIdx;
  } else if (dotIdx >= 0) {
    cutIdx = dotIdx;
  }
  return cutIdx >= 0 ? sel.slice(0, cutIdx) : sel;
}
function stripUrlHost(rawUrl) {
  if (!rawUrl) {
    return "";
  }
  try {
    const parsed = new URL(rawUrl, "https://placeholder.invalid");
    return parsed.pathname || "/";
  } catch {
    return rawUrl.replace(/^[a-zA-Z][a-zA-Z\d+\-.]*:\/\/[^/?#]*/, "");
  }
}
function safeReadPageUrl(privacy) {
  if (!privacy.capturePageUrl) {
    return "";
  }
  if (typeof self === "undefined" || !self.location) {
    return "";
  }
  if (!privacy.captureHost) {
    return self.location.pathname ?? "";
  }
  return self.location.href ?? "";
}
function safeReadPageTitle(privacy) {
  if (!privacy.capturePageTitle || typeof document === "undefined") {
    return "";
  }
  return document.title ?? "";
}
function safeReadPageReferrer(privacy) {
  if (!privacy.capturePageReferrer || typeof document === "undefined") {
    return "";
  }
  return document.referrer ?? "";
}
function safeReadUserAgent(privacy) {
  if (!privacy.captureUserAgent || typeof self === "undefined" || !self.navigator) {
    return "";
  }
  return self.navigator.userAgent ?? "";
}
function enforcePrivacyOnLog(log2, privacy, opts) {
  if (privacy.capturePageUrl && privacy.capturePageTitle && privacy.capturePageReferrer && privacy.captureHost && privacy.captureUserAgent && privacy.captureScreenRes && privacy.captureLocation && privacy.captureTargetRect && privacy.captureDetails && privacy.captureMicroTime && privacy.attachTraceContext && privacy.domSelectorMode === "full" && privacy.allowedAttributes === null) {
    return log2;
  }
  const out = { ...log2 };
  const isPackaged = opts.isPackaged;
  if (!privacy.capturePageUrl) {
    if (isPackaged || "pageUrl" in out) {
      out.pageUrl = "";
    }
  } else if (!privacy.captureHost) {
    if (typeof out.pageUrl === "string" && out.pageUrl.length > 0) {
      out.pageUrl = stripUrlHost(out.pageUrl);
    }
  }
  if (!privacy.captureHost) {
    delete out.host;
  }
  if (!privacy.capturePageTitle) {
    if (isPackaged || "pageTitle" in out) {
      out.pageTitle = "";
    }
  }
  if (!privacy.capturePageReferrer) {
    if (isPackaged || "pageReferrer" in out) {
      out.pageReferrer = "";
    }
  }
  if (!privacy.captureUserAgent) {
    if (isPackaged || "userAgent" in out) {
      out.userAgent = "";
    }
    if ("browser" in out) {
      out.browser = { browser: null, version: null };
    }
  }
  if (!privacy.captureScreenRes) {
    if (isPackaged || "scrnRes" in out) {
      out.scrnRes = null;
    }
  }
  if (!privacy.captureLocation) {
    if ("location" in out) {
      out.location = null;
    }
  }
  if (!privacy.captureTargetRect) {
    delete out.targetRect;
  }
  if (!privacy.captureDetails) {
    if (isPackaged || "details" in out) {
      out.details = null;
    }
  }
  if (!privacy.captureMicroTime) {
    if ("microTime" in out) {
      out.microTime = null;
    }
  }
  if (!privacy.attachTraceContext) {
    delete out.traceId;
    delete out.spanId;
  }
  if (privacy.domSelectorMode === "none") {
    if ("target" in out) {
      out.target = "";
    }
    if ("path" in out) {
      out.path = [];
    }
  } else if (privacy.domSelectorMode === "structural") {
    if (typeof out.target === "string") {
      out.target = stripSelectorToStructural(out.target);
    }
    if (Array.isArray(out.path)) {
      out.path = out.path.map(
        (item) => typeof item === "string" ? stripSelectorToStructural(item) : item
      );
    }
  }
  if (Array.isArray(privacy.allowedAttributes)) {
    const allowedSet = new Set(
      privacy.allowedAttributes.filter((k) => !isPrivacySensitiveAttribute(k))
    );
    if (out.attributes && typeof out.attributes === "object" && !Array.isArray(out.attributes)) {
      const filtered = {};
      for (const [k, v] of Object.entries(
        out.attributes
      )) {
        if (allowedSet.has(k) && v !== void 0 && v !== null) {
          filtered[k] = typeof v === "string" ? v : String(v);
        }
      }
      out.attributes = filtered;
    }
    if ("style" in out) {
      out.style = {};
    }
  }
  return out;
}

// src/getInitialSettings.ts
var EXPLICIT_EXPORTER_MODE_SYM = /* @__PURE__ */ Symbol.for(
  "apache.flagon.userale.explicitExporterMode"
);
function parseHeadersAttr(raw) {
  if (!raw) {
    return null;
  }
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}
function getInitialSettings(overrides) {
  const isWorker = typeof WorkerGlobalScope !== "undefined" && typeof self !== "undefined" && self instanceof WorkerGlobalScope;
  if (isWorker || typeof document === "undefined" || typeof window === "undefined") {
    const settings2 = {
      apiKey: null,
      authHeader: null,
      autostart: overrides?.autostart ?? isWorker,
      browserSessionId: null,
      custIndex: null,
      events: null,
      exporter: null,
      exporterFormat: "http-json",
      exporterType: "http-json",
      headers: null,
      httpSessionId: null,
      logCountThreshold: 5,
      logDetails: false,
      maxQueueSize: 1e4,
      observeMutations: false,
      otelLogger: null,
      otlpEndpoint: null,
      persistSession: overrides?.persistSession ?? isWorker,
      privacy: clonePrivacyOptions(DEFAULT_PRIVACY_OPTIONS),
      resolution: 500,
      sessionId: overrides?.sessionId !== void 0 ? overrides.sessionId : null,
      time: (ts) => ts !== void 0 ? ts : Date.now(),
      toolName: null,
      toolVersion: null,
      traceContext: null,
      transmitInterval: 5e3,
      url: "http://localhost:8000",
      useraleVersion: null,
      userFromParams: null,
      userId: null
    };
    return settings2;
  }
  const script = overrides?.skipScriptTag ? null : document.currentScript;
  const get = script ? script.getAttribute.bind(script) : function() {
    return null;
  };
  const persistSession = overrides?.persistSession !== void 0 ? overrides.persistSession : get("data-persist-session") === "false" ? false : true;
  let resolvedSessionId = null;
  let resolvedHttpSessionId = null;
  if (persistSession) {
    if (overrides?.sessionId !== void 0) {
      resolvedSessionId = overrides.sessionId;
    } else {
      resolvedSessionId = get("data-session") || getsessionId("userAlesessionId", "session_" + String(Date.now()));
    }
    resolvedHttpSessionId = getsessionId(
      "userAleHttpSessionId",
      generatehttpSessionId()
    );
  } else {
    resolvedSessionId = overrides?.sessionId !== void 0 ? overrides.sessionId : get("data-session") || null;
    resolvedHttpSessionId = null;
  }
  const headers = get("data-headers");
  const otlpEndpoint = get("data-otlp-endpoint") || null;
  const explicitExporterAttr = get("data-exporter-type") || get("data-exporter-format") || get("data-exporter");
  const exporterAttr = explicitExporterAttr || (otlpEndpoint ? "otlp" : "http-json");
  const defaultAutostart = get("data-autostart") === "false" ? false : true;
  const settings = {
    apiKey: get("data-api-key") || null,
    authHeader: get("data-auth") || null,
    autostart: overrides?.autostart !== void 0 ? overrides.autostart : defaultAutostart,
    browserSessionId: null,
    custIndex: get("data-index") || null,
    events: null,
    exporter: null,
    exporterFormat: exporterAttr,
    exporterType: exporterAttr,
    headers: parseHeadersAttr(headers),
    httpSessionId: resolvedHttpSessionId,
    logCountThreshold: +(get("data-threshold") || 5),
    logDetails: get("data-log-details") === "true" ? true : false,
    maxQueueSize: +(get("data-max-queue-size") || 1e4),
    observeMutations: get("data-observe-mutations") === "true" ? true : false,
    otelLogger: null,
    otlpEndpoint,
    persistSession,
    privacy: clonePrivacyOptions(DEFAULT_PRIVACY_OPTIONS),
    resolution: +(get("data-resolution") || 500),
    sessionId: resolvedSessionId,
    time: timeStampScale(document.createEvent("CustomEvent")),
    toolName: get("data-tool") || null,
    toolVersion: get("data-version") || null,
    traceContext: null,
    transmitInterval: +(get("data-interval") || 5e3),
    url: get("data-url") || "http://localhost:8000",
    useraleVersion: get("data-userale-version") || null,
    userFromParams: get("data-user-from-params") || null,
    userId: get("data-user") || null
  };
  if (explicitExporterAttr) {
    Object.defineProperty(settings, EXPLICIT_EXPORTER_MODE_SYM, {
      value: true,
      enumerable: false
    });
  }
  return settings;
}
function getsessionId(sessionKey, value) {
  try {
    const storage = typeof self !== "undefined" ? self.sessionStorage : void 0;
    if (!storage) {
      return value;
    }
    const existing = storage.getItem(sessionKey);
    if (existing === null) {
      storage.setItem(sessionKey, JSON.stringify(value));
      return value;
    }
    return JSON.parse(existing);
  } catch {
    return value;
  }
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
  if (typeof globalThis !== "undefined" && globalThis.crypto && typeof globalThis.crypto.getRandomValues === "function") {
    globalThis.crypto.getRandomValues(arr);
  }
  return Array.from(arr, (dec) => {
    return dec.toString(16).padStart(2, "0");
  }).join("");
}

// src/configure.ts
var FORBIDDEN_CONFIG_KEYS = /* @__PURE__ */ new Set([
  "__proto__",
  "constructor",
  "prototype",
  "initialized"
]);
var ALLOW_CALLABLE_KEYS = /* @__PURE__ */ new Set(["time", "authHeader", "traceContext"]);
var LOCKED_BLOCKED_KEYS = /* @__PURE__ */ new Set([
  "userFromParams",
  "events",
  "exporter",
  "url",
  "otlpEndpoint",
  "exporterType",
  "exporterFormat",
  "websocketsEnabled",
  "otelLogger"
]);
var configInternalStates = /* @__PURE__ */ new WeakMap();
function getInternalState(cfg) {
  let state = configInternalStates.get(cfg);
  if (!state) {
    state = {
      privacyLocked: false,
      allowlistSelectorInvalid: false,
      resolvedPrivacy: clonePrivacyOptions(DEFAULT_PRIVACY_OPTIONS),
      hasExplicitExporterMode: false
    };
    configInternalStates.set(cfg, state);
  }
  return state;
}
var _Configuration = class _Configuration {
  // Private constructor to prevent external instantiation
  constructor(skipInit = false, overrides) {
    this.initialized = false;
    // Public properties corresponding to fields in the Config interface
    this.apiKey = null;
    this.autostart = false;
    this.authHeader = null;
    this.browserSessionId = null;
    this.custIndex = null;
    this.events = null;
    this.exporter = null;
    this.exporterFormat = "http-json";
    this.exporterType = "http-json";
    this.headers = null;
    this.httpSessionId = null;
    this.logCountThreshold = 0;
    this.logDetails = false;
    this.maxQueueSize = 1e4;
    this.observeMutations = false;
    this.on = false;
    this.otelLogger = null;
    this.otlpEndpoint = null;
    this.persistSession = true;
    this.privacy = freezePrivacyOptions(DEFAULT_PRIVACY_OPTIONS);
    this.resolution = 0;
    this.sessionId = null;
    this.time = () => Date.now();
    this.toolName = null;
    this.toolVersion = null;
    this.traceContext = null;
    this.transmitInterval = 0;
    this.url = "";
    this.userFromParams = null;
    this.useraleVersion = null;
    this.userId = null;
    this.version = null;
    this.websocketsEnabled = false;
    if (!skipInit) {
      this.initialize(overrides);
    }
  }
  // Static method to get the singleton instance
  static getInstance() {
    if (_Configuration.instance === null) {
      _Configuration.instance = new _Configuration(false);
    }
    return _Configuration.instance;
  }
  // Creates an uninitialized Configuration instance without reading browser storage
  static createUninitialized() {
    return new _Configuration(true);
  }
  // Creates an independent initialized Configuration instance
  static create(overrides) {
    return new _Configuration(false, overrides);
  }
  isInitialized() {
    return this.initialized;
  }
  lockPrivacy() {
    getInternalState(this).privacyLocked = true;
  }
  isPrivacyLocked() {
    return getInternalState(this).privacyLocked;
  }
  getResolvedPrivacy() {
    return clonePrivacyOptions(getInternalState(this).resolvedPrivacy);
  }
  isAllowlistSelectorInvalid() {
    return getInternalState(this).allowlistSelectorInvalid;
  }
  hasExplicitExporterMode() {
    return getInternalState(this).hasExplicitExporterMode;
  }
  initialize(overrides) {
    const state = getInternalState(this);
    if (state.privacyLocked) {
      return;
    }
    const settings = getInitialSettings(overrides);
    const explicitFromScript = Boolean(
      settings[EXPLICIT_EXPORTER_MODE_SYM]
    );
    this.applyUpdate(settings, true);
    state.hasExplicitExporterMode = explicitFromScript;
    this.initialized = true;
  }
  /**
   * Resets the configuration to its initial state.
   */
  reset(overrides) {
    const state = getInternalState(this);
    if (state.privacyLocked) {
      console.warn(
        "[UserALE] Ignoring config.reset() because privacy is locked."
      );
      return;
    }
    state.resolvedPrivacy = clonePrivacyOptions(DEFAULT_PRIVACY_OPTIONS);
    state.allowlistSelectorInvalid = false;
    state.hasExplicitExporterMode = false;
    this.privacy = freezePrivacyOptions(DEFAULT_PRIVACY_OPTIONS);
    this.events = null;
    this.otelLogger = null;
    this.initialize(overrides);
  }
  /**
   * Merges `newConfig` into the configuration instance, updating privacy policy
   * first and enforcing locked-mode and prototype-pollution guards.
   * @param  {Partial<Settings.Config>} newConfig Configuration object to merge into the current config.
   */
  update(newConfig) {
    this.applyUpdate(newConfig, false);
  }
  applyUpdate(newConfig, fromInit) {
    if (!newConfig || typeof newConfig !== "object" || Array.isArray(newConfig)) {
      return;
    }
    const state = getInternalState(this);
    if (!state.privacyLocked && Object.prototype.hasOwnProperty.call(newConfig, "privacy")) {
      if (newConfig.privacy === null) {
        state.resolvedPrivacy = clonePrivacyOptions(DEFAULT_PRIVACY_OPTIONS);
        state.allowlistSelectorInvalid = false;
        this.privacy = freezePrivacyOptions(state.resolvedPrivacy);
      } else if (newConfig.privacy && typeof newConfig.privacy === "object" && !Array.isArray(newConfig.privacy)) {
        const merged = mergePrivacyOptions(
          state.resolvedPrivacy,
          newConfig.privacy
        );
        state.resolvedPrivacy = merged.resolved;
        state.allowlistSelectorInvalid = merged.allowlistSelectorInvalid;
        this.privacy = freezePrivacyOptions(state.resolvedPrivacy);
      }
    }
    Object.keys(newConfig).forEach((option) => {
      if (option === "privacy" || FORBIDDEN_CONFIG_KEYS.has(option)) {
        return;
      }
      if (typeof this[option] === "function" && !ALLOW_CALLABLE_KEYS.has(option)) {
        return;
      }
      const newOption = newConfig[option];
      if (newOption === void 0) {
        return;
      }
      if (state.privacyLocked) {
        if (LOCKED_BLOCKED_KEYS.has(option) || option === "logDetails" && newOption === true || option === "persistSession" && newOption === true && this.persistSession === false || option === "observeMutations" && newOption === true || option === "traceContext" && !state.resolvedPrivacy.attachTraceContext) {
          return;
        }
      }
      if (option === "time" && typeof newOption !== "function") {
        return;
      }
      if (option === "userFromParams") {
        const userParamString = newOption;
        const userId = userParamString && state.resolvedPrivacy.capturePageUrl !== false ? _Configuration.getUserIdFromParams(userParamString) : null;
        if (userId) {
          this["userId"] = userId;
        }
      }
      const hasNewUserFromParams = newConfig["userFromParams"];
      const willNullifyUserId = option === "userId" && newConfig[option] === null;
      if (willNullifyUserId && hasNewUserFromParams) {
        return;
      }
      if (option === "headers") {
        if (newOption === null) {
          this.headers = null;
        } else if (typeof newOption === "object" && !Array.isArray(newOption)) {
          const clonedHeaders = {};
          for (const [k, v] of Object.entries(
            newOption
          )) {
            if (!FORBIDDEN_CONFIG_KEYS.has(k) && typeof v === "string") {
              clonedHeaders[k] = v;
            }
          }
          this.headers = clonedHeaders;
        }
        return;
      }
      if (option === "events") {
        if (newOption === null) {
          this.events = null;
        } else if (Array.isArray(newOption)) {
          this.events = newOption.filter(
            (item) => typeof item === "string"
          );
        }
        return;
      }
      this[option] = newOption;
      if (option === "exporterFormat") {
        if (!fromInit) {
          state.hasExplicitExporterMode = true;
        }
        if (newConfig.exporterType === void 0) {
          this.exporterType = newOption;
        }
      } else if (option === "exporterType") {
        if (!fromInit) {
          state.hasExplicitExporterMode = true;
        }
        if (newConfig.exporterFormat === void 0) {
          this.exporterFormat = newOption;
        }
      }
    });
    if (newConfig.persistSession === false) {
      if (newConfig.httpSessionId === void 0) {
        this.httpSessionId = null;
      }
      if (newConfig.sessionId === void 0) {
        this.sessionId = null;
      }
    }
  }
  /**
   * Attempts to extract the userid from the query parameters of the URL.
   * @param  {string} param The name of the query parameter containing the userid.
   * @return {string | null}       The extracted/decoded userid, or null if none is found.
   */
  static getUserIdFromParams(param) {
    if (!param || typeof param !== "string" || typeof window === "undefined" || !window.location?.href) {
      return null;
    }
    const href = window.location.href;
    const qIdx = href.indexOf("?");
    if (qIdx === -1) {
      return null;
    }
    const hIdx = href.indexOf("#", qIdx);
    const query = hIdx === -1 ? href.slice(qIdx + 1) : href.slice(qIdx + 1, hIdx);
    const val = new URLSearchParams(query).get(param);
    return val && val.length > 0 ? val : null;
  }
};
// Private static property to hold the singleton instance
_Configuration.instance = null;
var Configuration = _Configuration;

// src/packageLogs.ts
var FORBIDDEN_KEYS = /* @__PURE__ */ new Set(["__proto__", "constructor", "prototype"]);
function mergeSafeCustomFields(target, source) {
  for (const [key, val] of Object.entries(source)) {
    if (!FORBIDDEN_KEYS.has(key) && val !== void 0) {
      target[key] = val;
    }
  }
  return target;
}
function createPackager(targetLogs, targetConfig, onCallbackRegistryUpdate) {
  let intervalId = null;
  let intervalType = null;
  let intervalPath = null;
  let intervalTimer = null;
  let intervalCounter = 0;
  let intervalLog = null;
  const cbMap = {};
  const resetIntervalState2 = () => {
    intervalId = null;
    intervalType = null;
    intervalPath = null;
    intervalTimer = null;
    intervalCounter = 0;
    intervalLog = null;
  };
  const addCallbacks3 = (...newCallbacks) => {
    if (targetConfig.isPrivacyLocked()) {
      return {};
    }
    newCallbacks.forEach((source) => {
      if (!source || typeof source !== "object") {
        return;
      }
      const descriptors = {};
      for (const key of Object.keys(source)) {
        if (FORBIDDEN_KEYS.has(key)) {
          continue;
        }
        const descriptor = Object.getOwnPropertyDescriptor(source, key);
        if (descriptor) {
          descriptors[key] = descriptor;
        }
      }
      for (const sym of Object.getOwnPropertySymbols(source)) {
        const descriptor = Object.getOwnPropertyDescriptor(source, sym);
        if (descriptor?.enumerable) {
          descriptors[sym] = descriptor;
        }
      }
      Object.defineProperties(cbMap, descriptors);
    });
    onCallbackRegistryUpdate?.(cbMap);
    return { ...cbMap };
  };
  const removeCallbacks3 = (targetKeys) => {
    targetKeys.forEach((key) => {
      if (Object.prototype.hasOwnProperty.call(cbMap, key)) {
        delete cbMap[key];
      }
    });
    onCallbackRegistryUpdate?.(cbMap);
  };
  const enqueueLog2 = (logEntry) => {
    const cap = typeof targetConfig?.maxQueueSize === "number" && targetConfig.maxQueueSize > 0 ? targetConfig.maxQueueSize : 1e4;
    if (targetLogs.length >= cap) {
      targetLogs.splice(0, targetLogs.length - cap + 1);
    }
    targetLogs.push(logEntry);
  };
  const packageLog3 = (e, detailFcn) => {
    if (!targetConfig.on) {
      return false;
    }
    const privacy = targetConfig.getResolvedPrivacy();
    const filterResult = evaluateEventPrivacyFilter(
      e,
      privacy,
      targetConfig.isAllowlistSelectorInvalid()
    );
    if (!filterResult.allowed) {
      return false;
    }
    const details2 = privacy.captureDetails && detailFcn ? detailFcn(e) : null;
    const timeFields = extractTimeFields(
      e.timeStamp && e.timeStamp > 0 ? targetConfig.time(e.timeStamp) : Date.now()
    );
    const rawTarget = e.target ? getSelector(e.target, privacy.domSelectorMode) : privacy.domSelectorMode === "none" ? "" : null;
    let log3 = {
      target: rawTarget,
      path: buildPath(e, privacy.domSelectorMode),
      pageUrl: safeReadPageUrl(privacy),
      pageTitle: safeReadPageTitle(privacy),
      pageReferrer: safeReadPageReferrer(privacy),
      browser: privacy.captureUserAgent ? detectBrowser() : { browser: null, version: null },
      userAgent: safeReadUserAgent(privacy),
      clientTime: timeFields.milli,
      microTime: privacy.captureMicroTime ? timeFields.micro : null,
      location: privacy.captureLocation ? getLocation(e) : null,
      scrnRes: privacy.captureScreenRes ? getScreenRes() : null,
      type: e.type,
      logType: "raw",
      userAction: true,
      details: details2,
      userId: targetConfig.userId,
      toolVersion: targetConfig.toolVersion,
      toolName: targetConfig.toolName,
      useraleVersion: targetConfig.useraleVersion,
      sessionId: targetConfig.sessionId,
      httpSessionId: targetConfig.httpSessionId,
      browserSessionId: targetConfig.browserSessionId,
      attributes: buildAttrs(
        e,
        filterResult.matchedElement,
        privacy.allowedAttributes
      ),
      style: privacy.allowedAttributes !== null ? {} : buildCSS(e)
    };
    if (privacy.captureTargetRect && DISCRETE_RECT_EVENTS.has(e.type) && e.target) {
      const rect = getTargetRect(e.target);
      if (rect && (rect.width > 0 || rect.height > 0 || rect.x !== 0 || rect.y !== 0)) {
        log3.targetRect = rect;
      }
    }
    if (typeof filterHandler === "function" && !filterHandler(log3)) {
      return false;
    }
    const redactEventInCallback = targetConfig.isPrivacyLocked() || privacy.preset === "strict" || privacy.domSelectorMode === "none" || !privacy.captureDetails;
    const cbEventArg = redactEventInCallback ? null : e;
    if (typeof mapHandler === "function") {
      log3 = mapHandler(log3, cbEventArg);
    }
    for (const func of Object.values(cbMap)) {
      if (typeof func === "function") {
        log3 = func(log3, cbEventArg);
        if (!log3) {
          return false;
        }
      }
    }
    log3 = enforcePrivacyOnLog(log3, privacy, { isPackaged: true });
    enqueueLog2(log3);
    return true;
  };
  const packageCustomLog3 = (customLog, detailFcn, userAction) => {
    if (!targetConfig.on) {
      return false;
    }
    const privacy = targetConfig.getResolvedPrivacy();
    let details2 = null;
    if (privacy.captureDetails && typeof detailFcn === "function") {
      details2 = detailFcn();
    }
    const metaData = {
      pageUrl: safeReadPageUrl(privacy),
      pageTitle: safeReadPageTitle(privacy),
      pageReferrer: safeReadPageReferrer(privacy),
      browser: privacy.captureUserAgent ? detectBrowser() : { browser: null, version: null },
      userAgent: safeReadUserAgent(privacy),
      clientTime: Date.now(),
      scrnRes: privacy.captureScreenRes ? getScreenRes() : null,
      logType: "custom",
      userAction,
      details: details2,
      userId: targetConfig.userId,
      toolVersion: targetConfig.toolVersion,
      toolName: targetConfig.toolName,
      useraleVersion: targetConfig.useraleVersion,
      sessionId: targetConfig.sessionId,
      httpSessionId: targetConfig.httpSessionId,
      browserSessionId: targetConfig.browserSessionId
    };
    let log3 = mergeSafeCustomFields(metaData, customLog);
    if (typeof filterHandler === "function" && !filterHandler(log3)) {
      return false;
    }
    if (typeof mapHandler === "function") {
      log3 = mapHandler(log3);
    }
    for (const func of Object.values(cbMap)) {
      if (typeof func === "function") {
        log3 = func(log3, null);
        if (!log3) {
          return false;
        }
      }
    }
    log3 = enforcePrivacyOnLog(log3, privacy, { isPackaged: true });
    enqueueLog2(log3);
    return true;
  };
  const packageIntervalLog2 = (e) => {
    try {
      if (!targetConfig || !targetConfig.on) {
        return false;
      }
      const privacy = targetConfig.getResolvedPrivacy();
      const filterResult = evaluateEventPrivacyFilter(
        e,
        privacy,
        targetConfig.isAllowlistSelectorInvalid()
      );
      if (!filterResult.allowed) {
        return false;
      }
      const target = e.target ? getSelector(e.target, privacy.domSelectorMode) : privacy.domSelectorMode === "none" ? "" : null;
      const path = buildPath(e, privacy.domSelectorMode);
      const type = e.type;
      const timestamp = Math.floor(
        e.timeStamp && e.timeStamp > 0 ? targetConfig.time(e.timeStamp) : Date.now()
      );
      if (intervalId == null) {
        intervalId = target;
        intervalType = type;
        intervalPath = path;
        intervalTimer = timestamp;
        intervalCounter = 0;
      }
      let dropped = false;
      if ((intervalId !== target || intervalType !== type) && intervalTimer) {
        try {
          intervalLog = {
            target: intervalId,
            path: intervalPath,
            pageUrl: safeReadPageUrl(privacy),
            pageTitle: safeReadPageTitle(privacy),
            pageReferrer: safeReadPageReferrer(privacy),
            browser: privacy.captureUserAgent ? detectBrowser() : { browser: null, version: null },
            userAgent: safeReadUserAgent(privacy),
            count: intervalCounter,
            duration: timestamp - intervalTimer,
            startTime: intervalTimer,
            endTime: timestamp,
            type: intervalType,
            logType: "interval",
            targetChange: intervalId !== target,
            typeChange: intervalType !== type,
            userAction: false,
            userId: targetConfig.userId,
            toolVersion: targetConfig.toolVersion,
            toolName: targetConfig.toolName,
            useraleVersion: targetConfig.useraleVersion,
            sessionId: targetConfig.sessionId,
            httpSessionId: targetConfig.httpSessionId,
            browserSessionId: targetConfig.browserSessionId
          };
          if (typeof filterHandler === "function" && !filterHandler(intervalLog)) {
            dropped = true;
          }
          if (!dropped) {
            const redactEventInCallback = targetConfig.isPrivacyLocked() || privacy.preset === "strict" || privacy.domSelectorMode === "none" || !privacy.captureDetails;
            if (typeof mapHandler === "function") {
              intervalLog = mapHandler(
                intervalLog,
                redactEventInCallback ? null : e
              );
            }
            for (const func of Object.values(cbMap)) {
              if (typeof func === "function") {
                intervalLog = func(intervalLog, null);
                if (!intervalLog) {
                  dropped = true;
                  break;
                }
              }
            }
          }
          if (!dropped && intervalLog) {
            intervalLog = enforcePrivacyOnLog(intervalLog, privacy, {
              isPackaged: true
            });
            enqueueLog2(intervalLog);
          }
        } finally {
          intervalId = target;
          intervalType = type;
          intervalPath = path;
          intervalTimer = timestamp;
          intervalCounter = 0;
        }
      }
      if (intervalId == target && intervalType == type && intervalCounter !== null) {
        intervalCounter = intervalCounter + 1;
      }
      return !dropped;
    } catch {
      return false;
    }
  };
  const log2 = (customLog) => {
    if (!customLog || typeof customLog !== "object" || Array.isArray(customLog)) {
      return false;
    }
    const cloned = mergeSafeCustomFields({}, customLog);
    const enforced = enforcePrivacyOnLog(
      cloned,
      targetConfig.getResolvedPrivacy(),
      { isPackaged: false }
    );
    enqueueLog2(enforced);
    return true;
  };
  return {
    packageLog: packageLog3,
    packageCustomLog: packageCustomLog3,
    packageIntervalLog: packageIntervalLog2,
    addCallbacks: addCallbacks3,
    removeCallbacks: removeCallbacks3,
    enqueueLog: enqueueLog2,
    resetIntervalState: resetIntervalState2,
    log: log2
  };
}
var logs = [];
var filterHandler = null;
var mapHandler = null;
var cbHandlers = {};
var legacyPackager = createPackager(
  logs,
  Configuration.createUninitialized(),
  (next) => {
    cbHandlers = next;
  }
);
function addCallbacks(...newCallbacks) {
  return legacyPackager.addCallbacks(...newCallbacks);
}
function removeCallbacks(targetKeys) {
  legacyPackager.removeCallbacks(targetKeys);
}
function enqueueLog(logEntry) {
  legacyPackager.enqueueLog(logEntry);
}
function resetIntervalState() {
  legacyPackager.resetIntervalState();
}
function initPackager(newLogs, newConfig) {
  logs = newLogs;
  cbHandlers = {};
  legacyPackager = createPackager(newLogs, newConfig, (next) => {
    cbHandlers = next;
  });
}
function detectBrowser() {
  try {
    const nav = typeof self !== "undefined" ? self.navigator : null;
    if (!nav) {
      return { browser: null, version: null };
    }
    const brands = nav.userAgentData?.brands;
    if (Array.isArray(brands) && brands.length > 0) {
      const meaningful = brands.find(
        (b) => b.brand && !/not.?a.?brand|chromium/i.test(b.brand)
      ) ?? brands[0];
      if (meaningful?.brand) {
        return {
          browser: meaningful.brand.toLowerCase(),
          version: meaningful.version || null
        };
      }
    }
    const ua = typeof nav.userAgent === "string" ? nav.userAgent : "";
    if (!ua) {
      return { browser: null, version: null };
    }
    const rules = [
      ["edge", /Edg(?:e|A|iOS)?\/([\d.]+)/],
      ["opera", /(?:OPR|Opera)\/([\d.]+)/],
      ["chrome", /(?:Chrome|CriOS)\/([\d.]+)/],
      ["firefox", /(?:Firefox|FxiOS)\/([\d.]+)/],
      ["safari", /Version\/([\d.]+).*Safari/]
    ];
    for (const [name, regex] of rules) {
      const match = ua.match(regex);
      if (match) {
        return { browser: name, version: match[1] ?? null };
      }
    }
  } catch {
  }
  return { browser: null, version: null };
}
var DISCRETE_RECT_EVENTS = /* @__PURE__ */ new Set(["click", "dblclick", "change", "submit"]);
function getTargetRect(target) {
  try {
    if (target && typeof target.getBoundingClientRect === "function") {
      const rect = target.getBoundingClientRect();
      if (rect && Number.isFinite(rect.x) && Number.isFinite(rect.y) && Number.isFinite(rect.width) && Number.isFinite(rect.height)) {
        return {
          x: Math.round(rect.x),
          y: Math.round(rect.y),
          width: Math.round(rect.width),
          height: Math.round(rect.height)
        };
      }
    }
  } catch {
  }
  return null;
}
function packageLog(e, detailFcn) {
  return legacyPackager.packageLog(e, detailFcn);
}
function packageCustomLog(customLog, detailFcn, userAction) {
  return legacyPackager.packageCustomLog(customLog, detailFcn, userAction);
}
function extractTimeFields(timeStamp) {
  return {
    milli: Math.floor(timeStamp),
    micro: Number((timeStamp % 1).toFixed(3))
  };
}
function packageIntervalLog(e) {
  return legacyPackager.packageIntervalLog(e);
}
function getLocation(e) {
  if (e && typeof e === "object" && (typeof MouseEvent !== "undefined" && e instanceof MouseEvent || typeof e.pageX === "number" || typeof e.clientX === "number")) {
    const me = e;
    if (me.pageX != null) {
      return { x: me.pageX, y: me.pageY };
    } else if (me.clientX != null) {
      return {
        x: document.documentElement.scrollLeft + me.clientX,
        y: document.documentElement.scrollTop + me.clientY
      };
    }
  }
  return { x: null, y: null };
}
function getScreenRes() {
  return { width: self.innerWidth, height: self.innerHeight };
}
function getSelector(ele, mode = "full") {
  if (mode === "none") {
    return "";
  }
  if (isElementNode(ele)) {
    const tag = safeGetLocalName(ele);
    if (tag) {
      if (mode === "structural") {
        return tag;
      }
      const id = safeGetId(ele);
      const rawClass = safeGetClassName(ele);
      return tag + (id ? "#" + id : "") + (rawClass ? "." + rawClass : "");
    }
  } else if (isDocumentNode(ele)) {
    return "#document";
  } else if (ele === globalThis || typeof self !== "undefined" && ele === self || typeof ele === "object" && ele !== null && ele.window === ele) {
    return "Window";
  }
  return "Unknown";
}
function buildPath(e, mode = "full") {
  if (mode === "none") {
    return [];
  }
  const path = safeComposedPath(e);
  return selectorizePath(path, mode);
}
function selectorizePath(path, mode = "full") {
  if (mode === "none") {
    return [];
  }
  let i = 0;
  let pathEle;
  const pathSelectors = [];
  while (pathEle = path[i]) {
    pathSelectors.push(getSelector(pathEle, mode));
    ++i;
  }
  return pathSelectors;
}
var jsonValuePattern = /^(?:\{[\s\S]*\}|\[[\s\S]*\]|"(?:[^"\\]|\\.)*"|-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?|true|false|null)$/;
function buildAttrs(e, targetElement, allowedAttributes) {
  const attributes = {};
  const rawTarget = e?.target;
  const el = targetElement ?? (isElementNode(rawTarget) ? rawTarget : null);
  if (!el) {
    return attributes;
  }
  if (Array.isArray(allowedAttributes)) {
    for (const attrName of allowedAttributes) {
      if (isPrivacySensitiveAttribute(attrName)) {
        continue;
      }
      const val = safeGetAttribute(el, attrName);
      if (val !== null) {
        attributes[attrName] = val;
      }
    }
    return attributes;
  }
  const attrList = safeGetAttributes(el);
  if (attrList) {
    for (let i = 0; i < attrList.length; i++) {
      const attr = attrList[i];
      if (!attr || isPrivacySensitiveAttribute(attr.name)) {
        continue;
      }
      let val = attr.value;
      if (jsonValuePattern.test(val.trim())) {
        try {
          val = JSON.parse(val);
        } catch {
        }
      }
      attributes[attr.name] = val;
    }
  }
  return attributes;
}
function buildCSS(e) {
  const properties = {};
  const target = e.target;
  if (isElementNode(target)) {
    const styleObj = safeGetStyle(target);
    if (styleObj && typeof styleObj.getPropertyValue === "function") {
      for (let i = 0; i < styleObj.length; i++) {
        const prop = styleObj[i];
        properties[prop] = styleObj.getPropertyValue(prop);
      }
    }
  }
  return properties;
}

// src/utils/auth/index.ts
var authCallback = null;
function resolveAuthHeader() {
  if (!authCallback) {
    return null;
  }
  try {
    const result = authCallback();
    return typeof result === "string" ? result : null;
  } catch (e) {
    console.error(`Error encountered while setting the auth header: ${e}`);
    return null;
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
function resetAuthCallback() {
  authCallback = null;
}

// src/utils/headers/index.ts
var headersCallback = null;
function isValidHeadersObject(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }
  for (const [key, val] of Object.entries(value)) {
    if (typeof key !== "string" || typeof val !== "string") {
      return false;
    }
  }
  return true;
}
function resolveCustomHeaders() {
  if (!headersCallback) {
    return null;
  }
  try {
    const result = headersCallback();
    return isValidHeadersObject(result) ? { ...result } : null;
  } catch (e) {
    console.error(`Error encountered while setting the headers: ${e}`);
    return null;
  }
}
function registerHeadersCallback(callback) {
  try {
    verifyCallback2(callback);
    headersCallback = callback;
    return true;
  } catch {
    return false;
  }
}
function verifyCallback2(callback) {
  if (typeof callback !== "function") {
    throw new Error("Userale headers callback must be a function");
  }
  const result = callback();
  if (!result || typeof result !== "object" || Array.isArray(result)) {
    throw new Error("Userale headers callback must return an object");
  }
  for (const [key, value] of Object.entries(result)) {
    if (typeof key !== "string" || typeof value !== "string") {
      throw new Error(
        "Userale header callback must return an object with string keys and values"
      );
    }
  }
}
function resetHeadersCallback() {
  headersCallback = null;
}

// src/utils/index.ts
var configCredentialResolvers = /* @__PURE__ */ new WeakMap();
function registerConfigCredentialResolver(config, resolver) {
  configCredentialResolvers.set(config, resolver);
}
function getConfigCredentialResolver(config) {
  return configCredentialResolvers.get(config);
}

// src/exporters/headers.ts
function buildHeaders(config) {
  const headers = new Headers({
    "Content-Type": "application/json;charset=UTF-8"
  });
  const instanceResolver = getConfigCredentialResolver(config);
  if (instanceResolver) {
    const resolvedAuth = instanceResolver.resolveAuthHeader();
    if (resolvedAuth !== void 0) {
      if (resolvedAuth) {
        headers.set("Authorization", resolvedAuth);
      }
    } else if (config.authHeader) {
      const authHeaderValue = typeof config.authHeader === "function" ? config.authHeader() : String(config.authHeader);
      if (authHeaderValue) {
        headers.set("Authorization", authHeaderValue);
      }
    }
  } else if (authCallback) {
    const dynamicAuth = resolveAuthHeader();
    if (dynamicAuth) {
      headers.set("Authorization", dynamicAuth);
    }
  } else if (config.authHeader) {
    const authHeaderValue = typeof config.authHeader === "function" ? config.authHeader() : String(config.authHeader);
    if (authHeaderValue) {
      headers.set("Authorization", authHeaderValue);
    }
  }
  if (config.apiKey) {
    headers.set("x-api-key", config.apiKey);
  }
  let customHeaders = config.headers;
  if (instanceResolver) {
    const resolvedCustom = instanceResolver.resolveCustomHeaders();
    if (resolvedCustom !== void 0) {
      customHeaders = resolvedCustom;
    }
  } else if (headersCallback) {
    customHeaders = resolveCustomHeaders();
  }
  if (customHeaders) {
    for (const [header, value] of Object.entries(customHeaders)) {
      headers.set(header, value);
    }
  }
  return headers;
}

// src/exporters/http-json.ts
var MAX_KEEPALIVE_BYTES = 48 * 1024;
function utf8ByteLength(str) {
  if (typeof TextEncoder !== "undefined") {
    return new TextEncoder().encode(str).byteLength;
  }
  let bytes = 0;
  for (let i = 0; i < str.length; i++) {
    const code = str.charCodeAt(i);
    if (code < 128) {
      bytes += 1;
    } else if (code < 2048) {
      bytes += 2;
    } else if (code >= 55296 && code <= 56319) {
      i++;
      bytes += 4;
    } else {
      bytes += 3;
    }
  }
  return bytes;
}
function chunkLogsForKeepalive(logs2, serialize) {
  const full = serialize(logs2);
  if (utf8ByteLength(full) <= MAX_KEEPALIVE_BYTES || logs2.length <= 1) {
    return [full];
  }
  const mid = Math.ceil(logs2.length / 2);
  return [
    ...chunkLogsForKeepalive(logs2.slice(0, mid), serialize),
    ...chunkLogsForKeepalive(logs2.slice(mid), serialize)
  ];
}
var HttpJsonExporter = class {
  constructor(config) {
    this.config = config;
  }
  serialize(logs2) {
    return JSON.stringify(logs2);
  }
  getEndpoint() {
    return this.config.url;
  }
  async export(logs2, options2) {
    const headers = buildHeaders(this.config);
    const endpoint = this.getEndpoint();
    const keepalive = Boolean(options2?.keepalive);
    const retries = options2?.retries ?? 0;
    if (keepalive) {
      const payloads = chunkLogsForKeepalive(
        logs2,
        (batch) => this.serialize(batch)
      );
      try {
        for (const body2 of payloads) {
          await fetch(endpoint, {
            keepalive: utf8ByteLength(body2) <= MAX_KEEPALIVE_BYTES,
            method: "POST",
            headers,
            body: body2
          });
        }
        return { success: true };
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        console.error(error);
        return { success: false, error };
      }
    }
    const body = this.serialize(logs2);
    const explicitKeepalive = options2?.keepalive === false ? { keepalive: false } : {};
    async function attemptSend(remainingRetries) {
      try {
        const response = await fetch(endpoint, {
          method: "POST",
          headers,
          body,
          ...explicitKeepalive
        });
        if (!response.ok) {
          if (remainingRetries > 0) {
            return attemptSend(remainingRetries - 1);
          }
          throw new Error(`Failed to send logs: ${response.statusText}`);
        }
      } catch (error) {
        if (remainingRetries > 0) {
          return attemptSend(remainingRetries - 1);
        }
        throw error;
      }
    }
    try {
      await attemptSend(retries);
      return { success: true };
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      console.error(error);
      return { success: false, error };
    }
  }
  async flush() {
    return Promise.resolve();
  }
  async shutdown() {
    return Promise.resolve();
  }
};

// src/exporters/otel-sdk.ts
function isNonEmptyPlainObject(val) {
  return Boolean(val) && typeof val === "object" && !Array.isArray(val) && Object.keys(val).length > 0;
}
var OtelSdkExporter = class {
  constructor(logger) {
    this.logger = logger;
  }
  async export(logs2) {
    try {
      for (const log2 of logs2) {
        const logType = typeof log2.logType === "string" ? log2.logType : "raw";
        const eventType = typeof log2.type === "string" && log2.type.trim().length > 0 ? log2.type.trim() : logType;
        const eventName = `userale.${logType}.${eventType}`;
        const timestamp = typeof log2.clientTime === "number" && Number.isFinite(log2.clientTime) ? log2.clientTime : typeof log2.endTime === "number" && Number.isFinite(log2.endTime) ? log2.endTime : typeof log2.startTime === "number" && Number.isFinite(log2.startTime) ? log2.startTime : Date.now();
        const attributes = {
          "event.name": eventName,
          "flagon.log_type": logType,
          "flagon.event_type": eventType
        };
        if (typeof log2.pageUrl === "string" && log2.pageUrl.length > 0) {
          attributes["url.full"] = log2.pageUrl;
        }
        if (typeof log2.pageTitle === "string" && log2.pageTitle.length > 0) {
          attributes["page.title"] = log2.pageTitle;
        }
        if (typeof log2.pageReferrer === "string" && log2.pageReferrer.length > 0) {
          attributes["page.referrer"] = log2.pageReferrer;
        }
        if (typeof log2.userId === "string" && log2.userId.length > 0) {
          attributes["user.id"] = log2.userId;
        }
        if (typeof log2.sessionId === "string" && log2.sessionId.length > 0) {
          attributes["session.id"] = log2.sessionId;
        }
        if (typeof log2.target === "string" && log2.target.length > 0) {
          attributes["flagon.target"] = log2.target;
        }
        if (Array.isArray(log2.path) && log2.path.length > 0) {
          attributes["flagon.path"] = log2.path;
        }
        if (typeof log2.userAction === "boolean") {
          attributes["flagon.user_action"] = log2.userAction;
        }
        const loc = log2.location;
        if (loc && typeof loc === "object") {
          if (typeof loc.x === "number" && Number.isFinite(loc.x)) {
            attributes["flagon.location.x"] = loc.x;
          }
          if (typeof loc.y === "number" && Number.isFinite(loc.y)) {
            attributes["flagon.location.y"] = loc.y;
          }
        }
        if (isNonEmptyPlainObject(log2.targetRect)) {
          attributes["flagon.target_rect"] = log2.targetRect;
        }
        if (isNonEmptyPlainObject(log2.attributes)) {
          attributes["flagon.element.attributes"] = log2.attributes;
        }
        const hasNonEmptyBody = log2.details !== void 0 && log2.details !== null && (typeof log2.details !== "object" || Array.isArray(log2.details) || Object.keys(log2.details).length > 0);
        this.logger.emit({
          timestamp,
          observedTimestamp: timestamp,
          severityNumber: 9,
          severityText: "INFO",
          eventName,
          body: hasNonEmptyBody ? log2.details : eventName,
          attributes
        });
      }
      return { success: true };
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      return { success: false, error };
    }
  }
};

// src/exporters/otlp-json.ts
var HEX_32_RE = /^[0-9a-f]{32}$/i;
var HEX_16_RE = /^[0-9a-f]{16}$/i;
var ALL_ZEROS_RE = /^0+$/;
var KNOWN_LOG_KEYS = /* @__PURE__ */ new Set([
  "target",
  "path",
  "pageUrl",
  "pageTitle",
  "pageReferrer",
  "browser",
  "userAgent",
  "clientTime",
  "scrnRes",
  "microTime",
  "location",
  "type",
  "logType",
  "userAction",
  "details",
  "userId",
  "toolVersion",
  "toolName",
  "useraleVersion",
  "sessionId",
  "httpSessionId",
  "browserSessionId",
  "attributes",
  "style",
  "count",
  "duration",
  "startTime",
  "endTime",
  "targetChange",
  "typeChange",
  "targetRect",
  "traceId",
  "spanId"
]);
function resolveOtlpLogsEndpoint(rawUrl) {
  try {
    const parsed = new URL(
      rawUrl,
      typeof window !== "undefined" && window.location ? window.location.origin : "http://localhost:4318"
    );
    if (parsed.pathname === "" || parsed.pathname === "/") {
      parsed.pathname = "/v1/logs";
      return parsed.toString();
    }
    return rawUrl;
  } catch {
    const trimmed = rawUrl.replace(/\/+$/, "");
    return `${trimmed}/v1/logs`;
  }
}
function toOtlpAnyValue(val) {
  if (val === null || val === void 0) {
    return { stringValue: "" };
  }
  if (typeof val === "string") {
    return { stringValue: val };
  }
  if (typeof val === "boolean") {
    return { boolValue: val };
  }
  if (typeof val === "bigint") {
    return { intValue: val.toString(10) };
  }
  if (typeof val === "number") {
    if (!Number.isFinite(val)) {
      return { stringValue: String(val) };
    }
    if (Number.isInteger(val)) {
      return { intValue: BigInt(val).toString(10) };
    }
    return { doubleValue: val };
  }
  if (Array.isArray(val)) {
    return {
      arrayValue: {
        values: val.map((item) => toOtlpAnyValue(item))
      }
    };
  }
  if (typeof val === "object") {
    const entries = Object.entries(val).filter(
      ([, v]) => v !== void 0
    );
    return {
      kvlistValue: {
        values: entries.map(([key, v]) => ({
          key,
          value: toOtlpAnyValue(v)
        }))
      }
    };
  }
  return { stringValue: String(val) };
}
function pushStringAttr(attrs, key, val) {
  if (typeof val === "string" && val.length > 0) {
    attrs.push({ key, value: { stringValue: val } });
  }
}
function pushIntAttr(attrs, key, val) {
  if (typeof val === "number" && Number.isFinite(val)) {
    attrs.push({
      key,
      value: { intValue: BigInt(Math.trunc(val)).toString(10) }
    });
  }
}
function pushDoubleAttr(attrs, key, val) {
  if (typeof val === "number" && Number.isFinite(val)) {
    attrs.push({ key, value: { doubleValue: val } });
  }
}
function pushBoolAttr(attrs, key, val) {
  if (typeof val === "boolean") {
    attrs.push({ key, value: { boolValue: val } });
  }
}
function toUnixNanoString(clientTimeMs, microTime) {
  const ms = typeof clientTimeMs === "number" && Number.isFinite(clientTimeMs) ? Math.trunc(clientTimeMs) : Date.now();
  let subMsNanos = 0;
  if (typeof microTime === "number" && Number.isFinite(microTime)) {
    const frac = microTime - Math.trunc(microTime);
    if (frac > 0 && frac < 1) {
      subMsNanos = Math.round(frac * 1e6);
    }
  }
  return (BigInt(ms) * BigInt(1e6) + BigInt(subMsNanos)).toString(10);
}
function resolveTraceContext(log2, config) {
  if (config?.getResolvedPrivacy?.()?.attachTraceContext === false) {
    return {};
  }
  let rawTraceId = typeof log2.traceId === "string" ? log2.traceId : void 0;
  let rawSpanId = typeof log2.spanId === "string" ? log2.spanId : void 0;
  if ((!rawTraceId || !rawSpanId) && typeof config?.traceContext === "function") {
    try {
      const ctx = config.traceContext();
      if (ctx) {
        rawTraceId = rawTraceId ?? ctx.traceId;
        rawSpanId = rawSpanId ?? ctx.spanId;
      }
    } catch {
    }
  }
  const allowGlobalOtel = config === void 0 || (typeof config.isPrivacyLocked === "function" ? !config.isPrivacyLocked() : true);
  if ((!rawTraceId || !rawSpanId) && allowGlobalOtel) {
    const globalOtel = globalThis.opentelemetry;
    const spanCtx = globalOtel?.trace?.getActiveSpan?.()?.spanContext?.();
    if (spanCtx) {
      rawTraceId = rawTraceId ?? spanCtx.traceId;
      rawSpanId = rawSpanId ?? spanCtx.spanId;
    }
  }
  const result = {};
  if (rawTraceId && HEX_32_RE.test(rawTraceId) && !ALL_ZEROS_RE.test(rawTraceId)) {
    result.traceId = rawTraceId.toLowerCase();
  }
  if (rawSpanId && HEX_16_RE.test(rawSpanId) && !ALL_ZEROS_RE.test(rawSpanId)) {
    result.spanId = rawSpanId.toLowerCase();
  }
  return result;
}
function buildOtlpResourceAttributes(logs2, config) {
  const first = logs2[0] ?? {};
  const attrs = [];
  const serviceName = typeof first.toolName === "string" && first.toolName || config?.toolName || "unknown_service:userale";
  attrs.push({ key: "service.name", value: { stringValue: serviceName } });
  const serviceVersion = typeof first.toolVersion === "string" && first.toolVersion || config?.toolVersion;
  pushStringAttr(attrs, "service.version", serviceVersion);
  attrs.push({
    key: "telemetry.sdk.name",
    value: { stringValue: "apache-flagon-userale" }
  });
  attrs.push({
    key: "telemetry.sdk.language",
    value: { stringValue: "webjs" }
  });
  const sdkVersion = typeof first.useraleVersion === "string" && first.useraleVersion || config?.useraleVersion || "2.4.0";
  pushStringAttr(attrs, "telemetry.sdk.version", sdkVersion);
  pushStringAttr(attrs, "user_agent.original", first.userAgent);
  const browserObj = first.browser;
  if (browserObj && typeof browserObj === "object") {
    pushStringAttr(attrs, "browser.name", browserObj.browser);
    pushStringAttr(attrs, "browser.version", browserObj.version);
  }
  const sessionId = "sessionId" in first ? typeof first.sessionId === "string" ? first.sessionId : null : config?.sessionId;
  pushStringAttr(attrs, "session.id", sessionId);
  const httpSessionId = "httpSessionId" in first ? typeof first.httpSessionId === "string" ? first.httpSessionId : null : config?.httpSessionId;
  pushStringAttr(attrs, "flagon.http_session_id", httpSessionId);
  const browserSessionId = "browserSessionId" in first ? typeof first.browserSessionId === "string" ? first.browserSessionId : null : config?.browserSessionId;
  pushStringAttr(attrs, "flagon.browser_session_id", browserSessionId);
  const scrnRes = first.scrnRes;
  if (scrnRes && typeof scrnRes === "object") {
    pushIntAttr(attrs, "screen.width", scrnRes.width);
    pushIntAttr(attrs, "screen.height", scrnRes.height);
  }
  return attrs;
}
function toOtlpLogRecord(log2, config) {
  const logType = typeof log2.logType === "string" ? log2.logType : "raw";
  const eventType = typeof log2.type === "string" && log2.type.trim().length > 0 ? log2.type.trim() : logType;
  const eventName = `userale.${logType}.${eventType}`;
  const primaryTimeMs = typeof log2.clientTime === "number" ? log2.clientTime : typeof log2.endTime === "number" ? log2.endTime : typeof log2.startTime === "number" ? log2.startTime : Date.now();
  const timeUnixNano = toUnixNanoString(primaryTimeMs, log2.microTime);
  const attrs = [
    { key: "event.name", value: { stringValue: eventName } },
    { key: "flagon.log_type", value: { stringValue: logType } },
    { key: "flagon.event_type", value: { stringValue: eventType } }
  ];
  pushStringAttr(attrs, "url.full", log2.pageUrl);
  pushStringAttr(attrs, "page.title", log2.pageTitle);
  pushStringAttr(attrs, "page.referrer", log2.pageReferrer);
  pushStringAttr(attrs, "user.id", log2.userId);
  pushStringAttr(attrs, "flagon.target", log2.target);
  pushBoolAttr(attrs, "flagon.user_action", log2.userAction);
  if (Array.isArray(log2.path) && log2.path.length > 0) {
    attrs.push({
      key: "flagon.path",
      value: {
        arrayValue: {
          values: log2.path.map((p) => ({ stringValue: String(p) }))
        }
      }
    });
  }
  const loc = log2.location;
  if (loc && typeof loc === "object") {
    pushDoubleAttr(attrs, "flagon.location.x", loc.x);
    pushDoubleAttr(attrs, "flagon.location.y", loc.y);
  }
  if (log2.targetRect && typeof log2.targetRect === "object" && !Array.isArray(log2.targetRect)) {
    attrs.push({
      key: "flagon.target_rect",
      value: toOtlpAnyValue(log2.targetRect)
    });
  }
  if (logType === "interval") {
    pushIntAttr(attrs, "flagon.interval.count", log2.count);
    pushIntAttr(attrs, "flagon.interval.duration_ms", log2.duration);
    pushIntAttr(attrs, "flagon.interval.start_time_ms", log2.startTime);
    pushIntAttr(attrs, "flagon.interval.end_time_ms", log2.endTime);
    pushBoolAttr(attrs, "flagon.interval.target_change", log2.targetChange);
    pushBoolAttr(attrs, "flagon.interval.type_change", log2.typeChange);
  }
  if (log2.attributes && typeof log2.attributes === "object" && !Array.isArray(log2.attributes) && Object.keys(log2.attributes).length > 0) {
    attrs.push({
      key: "flagon.element.attributes",
      value: toOtlpAnyValue(log2.attributes)
    });
  }
  if (log2.style && typeof log2.style === "object" && !Array.isArray(log2.style) && Object.keys(log2.style).length > 0) {
    attrs.push({
      key: "flagon.element.style",
      value: toOtlpAnyValue(log2.style)
    });
  }
  const extraFields = {};
  for (const [key, val] of Object.entries(log2)) {
    if (!KNOWN_LOG_KEYS.has(key) && val !== void 0) {
      extraFields[key] = val;
    }
  }
  const bodyObj = {};
  if (log2.details && typeof log2.details === "object" && !Array.isArray(log2.details)) {
    Object.assign(bodyObj, log2.details);
  } else if (log2.details !== void 0 && log2.details !== null) {
    bodyObj.details = log2.details;
  }
  Object.assign(bodyObj, extraFields);
  const body = Object.keys(bodyObj).length > 0 ? toOtlpAnyValue(bodyObj) : {
    stringValue: typeof log2.target === "string" && log2.target ? `${eventType} on ${log2.target}` : eventType
  };
  const record = {
    timeUnixNano,
    observedTimeUnixNano: timeUnixNano,
    severityNumber: 9,
    severityText: "INFO",
    eventName,
    body,
    attributes: attrs
  };
  const traceCtx = resolveTraceContext(log2, config);
  if (traceCtx.traceId) {
    record.traceId = traceCtx.traceId;
  }
  if (traceCtx.spanId) {
    record.spanId = traceCtx.spanId;
  }
  return record;
}
function toOtlpExportLogsServiceRequest(logs2, config) {
  const first = logs2[0] ?? {};
  const scopeVersion = typeof first.useraleVersion === "string" && first.useraleVersion || config?.useraleVersion || "2.4.0";
  return {
    resourceLogs: [
      {
        resource: {
          attributes: buildOtlpResourceAttributes(logs2, config)
        },
        scopeLogs: [
          {
            scope: {
              name: "org.apache.flagon.userale",
              version: scopeVersion
            },
            logRecords: logs2.map((log2) => toOtlpLogRecord(log2, config))
          }
        ]
      }
    ]
  };
}
var OtlpJsonExporter = class extends HttpJsonExporter {
  constructor(config) {
    super(config);
    this.otlpConfig = config;
  }
  getEndpoint() {
    const raw = this.otlpConfig.otlpEndpoint || this.otlpConfig.url;
    return resolveOtlpLogsEndpoint(raw);
  }
  serialize(logs2) {
    return JSON.stringify(
      toOtlpExportLogsServiceRequest(logs2, this.otlpConfig)
    );
  }
};

// src/exporters/proto-json.ts
var FORBIDDEN_STRUCT_KEYS = /* @__PURE__ */ new Set([
  "__proto__",
  "constructor",
  "prototype"
]);
var KNOWN_CUSTOM_LOG_KEYS = /* @__PURE__ */ new Set([
  "pageUrl",
  "pageTitle",
  "pageReferrer",
  "browser",
  "userAgent",
  "clientTime",
  "scrnRes",
  "logType",
  "userAction",
  "details",
  "userId",
  "toolVersion",
  "toolName",
  "useraleVersion",
  "sessionId",
  "httpSessionId",
  "browserSessionId",
  "traceId",
  "spanId"
]);
function safeFiniteInt(val) {
  return typeof val === "number" && Number.isFinite(val) ? Math.trunc(val) : null;
}
function safeInt64String(val, fallback = "0") {
  const n = safeFiniteInt(val);
  return n !== null ? String(n) : fallback;
}
function toStructValue(val) {
  if (val === null || val === void 0) {
    return null;
  }
  if (typeof val === "string" || typeof val === "boolean") {
    return val;
  }
  if (typeof val === "number") {
    return Number.isFinite(val) ? val : null;
  }
  if (typeof val === "bigint") {
    return val.toString(10);
  }
  if (Array.isArray(val)) {
    return val.map((item) => toStructValue(item));
  }
  if (typeof val === "object") {
    const out = {};
    for (const [k, v] of Object.entries(val)) {
      if (FORBIDDEN_STRUCT_KEYS.has(k) || v === void 0) {
        continue;
      }
      out[k] = toStructValue(v);
    }
    return out;
  }
  return String(val);
}
function toProtoStruct(obj) {
  if (!obj || typeof obj !== "object" || Array.isArray(obj)) {
    return void 0;
  }
  const out = {};
  for (const [k, v] of Object.entries(obj)) {
    if (FORBIDDEN_STRUCT_KEYS.has(k) || v === void 0) {
      continue;
    }
    out[k] = toStructValue(v);
  }
  return out;
}
function buildProtoMetadata(log2, config) {
  const scrnRes = log2.scrnRes;
  const metadata = {
    pageUrl: typeof log2.pageUrl === "string" ? log2.pageUrl : "",
    pageTitle: typeof log2.pageTitle === "string" ? log2.pageTitle : "",
    pageReferrer: typeof log2.pageReferrer === "string" ? log2.pageReferrer : "",
    userAgent: typeof log2.userAgent === "string" ? log2.userAgent : "",
    clientTime: safeInt64String(
      typeof log2.clientTime === "number" && Number.isFinite(log2.clientTime) ? log2.clientTime : log2.startTime,
      "0"
    )
  };
  if (scrnRes && typeof scrnRes === "object") {
    const width = safeFiniteInt(scrnRes.width);
    const height = safeFiniteInt(scrnRes.height);
    if (width !== null || height !== null) {
      metadata.screenResolution = {
        width: width ?? 0,
        height: height ?? 0
      };
    }
  }
  if (typeof log2.userId === "string") metadata.userId = log2.userId;
  if (typeof log2.sessionId === "string") metadata.sessionId = log2.sessionId;
  if (typeof log2.httpSessionId === "string")
    metadata.httpSessionId = log2.httpSessionId;
  if (typeof log2.browserSessionId === "string")
    metadata.browserSessionId = log2.browserSessionId;
  if (typeof log2.toolName === "string") metadata.toolName = log2.toolName;
  if (typeof log2.toolVersion === "string")
    metadata.toolVersion = log2.toolVersion;
  if (typeof log2.useraleVersion === "string")
    metadata.useraleVersion = log2.useraleVersion;
  if (config?.getResolvedPrivacy?.()?.attachTraceContext !== false) {
    if (typeof log2.traceId === "string" && log2.traceId.length > 0) {
      metadata.traceId = log2.traceId;
    }
    if (typeof log2.spanId === "string" && log2.spanId.length > 0) {
      metadata.spanId = log2.spanId;
    }
  }
  return metadata;
}
function toProtoUserALELog(log2, config) {
  const metadata = buildProtoMetadata(log2, config);
  const logType = log2.logType;
  if (logType === "raw") {
    const raw = {
      metadata,
      target: typeof log2.target === "string" ? log2.target : "",
      path: Array.isArray(log2.path) ? log2.path : [],
      eventType: typeof log2.type === "string" ? log2.type : "",
      userAction: Boolean(log2.userAction)
    };
    const loc = log2.location;
    if (loc && typeof loc === "object") {
      const lx = typeof loc.x === "number" && Number.isFinite(loc.x) ? loc.x : null;
      const ly = typeof loc.y === "number" && Number.isFinite(loc.y) ? loc.y : null;
      if (lx !== null || ly !== null) {
        const location = {};
        if (lx !== null) location.x = lx;
        if (ly !== null) location.y = ly;
        raw.location = location;
      }
    }
    if (typeof log2.microTime === "number" && Number.isFinite(log2.microTime)) {
      raw.microTime = log2.microTime;
    }
    const detailsStruct = toProtoStruct(log2.details);
    if (detailsStruct) {
      raw.details = detailsStruct;
    }
    const attrsStruct = toProtoStruct(log2.attributes);
    if (attrsStruct) {
      raw.attributes = attrsStruct;
    }
    const styleStruct = toProtoStruct(log2.style);
    if (styleStruct) {
      raw.style = styleStruct;
    }
    const tr = log2.targetRect;
    if (tr && typeof tr === "object" && !Array.isArray(tr)) {
      const rx = safeFiniteInt(tr.x);
      const ry = safeFiniteInt(tr.y);
      const rw = safeFiniteInt(tr.width);
      const rh = safeFiniteInt(tr.height);
      if (rx !== null && ry !== null && rw !== null && rh !== null) {
        raw.targetRect = { x: rx, y: ry, width: rw, height: rh };
      }
    }
    return {
      logType: "LOG_TYPE_RAW",
      raw
    };
  }
  if (logType === "interval") {
    const interval = {
      metadata,
      target: typeof log2.target === "string" ? log2.target : "",
      path: Array.isArray(log2.path) ? log2.path : [],
      eventType: typeof log2.type === "string" ? log2.type : "",
      count: safeFiniteInt(log2.count) ?? 0,
      duration: safeInt64String(log2.duration, "0"),
      startTime: safeInt64String(log2.startTime, "0"),
      endTime: safeInt64String(log2.endTime, "0"),
      targetChange: Boolean(log2.targetChange),
      typeChange: Boolean(log2.typeChange),
      userAction: Boolean(log2.userAction)
    };
    return {
      logType: "LOG_TYPE_INTERVAL",
      interval
    };
  }
  const rawCustomFields = {};
  for (const [key, value] of Object.entries(log2)) {
    if (!FORBIDDEN_STRUCT_KEYS.has(key) && !KNOWN_CUSTOM_LOG_KEYS.has(key) && value !== void 0) {
      rawCustomFields[key] = value;
    }
  }
  if (typeof logType === "string" && logType !== "custom") {
    rawCustomFields.logType = logType;
  }
  const custom = {
    metadata,
    userAction: Boolean(log2.userAction),
    customFields: toProtoStruct(rawCustomFields) ?? {}
  };
  const customDetails = toProtoStruct(log2.details);
  if (customDetails) {
    custom.details = customDetails;
  }
  const protoLogType = logType === "mutation" ? "LOG_TYPE_MUTATION" : logType === "replay" ? "LOG_TYPE_REPLAY" : "LOG_TYPE_CUSTOM";
  return {
    logType: protoLogType,
    custom
  };
}
function toProtoLogBatch(logs2, config) {
  return {
    logs: logs2.map((entry) => toProtoUserALELog(entry, config))
  };
}
var ProtoJsonExporter = class extends HttpJsonExporter {
  constructor(config) {
    super(config);
    this.protoConfig = config;
  }
  serialize(logs2) {
    return JSON.stringify(toProtoLogBatch(logs2, this.protoConfig));
  }
};

// src/exporters/websocket.ts
var MAX_PENDING_MESSAGES = 100;
var WS_CONNECTING = 0;
var WS_OPEN = 1;
var WebSocketExporter = class {
  constructor(config) {
    this.pendingPayloads = [];
    this.wsock = new WebSocket(config.url);
    if (typeof this.wsock.addEventListener === "function") {
      this.wsock.addEventListener("open", () => {
        this.drainPending();
      });
    }
  }
  drainPending() {
    const openState = typeof WebSocket !== "undefined" ? WebSocket.OPEN : WS_OPEN;
    if (this.wsock.readyState !== openState) {
      return;
    }
    while (this.pendingPayloads.length > 0) {
      if (this.wsock.readyState !== openState) {
        break;
      }
      const next = this.pendingPayloads.shift();
      this.wsock.send(next);
    }
  }
  async export(logs2) {
    const data = JSON.stringify(logs2);
    const openState = typeof WebSocket !== "undefined" ? WebSocket.OPEN : WS_OPEN;
    const connectingState = typeof WebSocket !== "undefined" ? WebSocket.CONNECTING : WS_CONNECTING;
    if (this.wsock.readyState === openState) {
      this.wsock.send(data);
      return { success: true };
    }
    if (this.wsock.readyState === connectingState) {
      if (this.pendingPayloads.length >= MAX_PENDING_MESSAGES) {
        this.pendingPayloads.shift();
      }
      this.pendingPayloads.push(data);
      return { success: true };
    }
    return {
      success: false,
      error: new Error("WebSocket is not open")
    };
  }
  async flush() {
    this.drainPending();
    return Promise.resolve();
  }
  async shutdown() {
    this.pendingPayloads = [];
    const openState = typeof WebSocket !== "undefined" ? WebSocket.OPEN : WS_OPEN;
    const connectingState = typeof WebSocket !== "undefined" ? WebSocket.CONNECTING : WS_CONNECTING;
    if (this.wsock.readyState === openState || this.wsock.readyState === connectingState) {
      this.wsock.close();
    }
    return Promise.resolve();
  }
};

// src/exporters/index.ts
function createExporter(config) {
  if (config.exporter) {
    return config.exporter;
  }
  const mode = config.exporterFormat || config.exporterType;
  if (mode === "otel-sdk" && config.otelLogger) {
    return new OtelSdkExporter(config.otelLogger);
  }
  if (mode === "proto-json") {
    return new ProtoJsonExporter(config);
  }
  if (mode === "otlp" || mode === "otlp-json") {
    return new OtlpJsonExporter(config);
  }
  if (mode === "websocket" || config.websocketsEnabled) {
    return new WebSocketExporter(config);
  }
  if (config.hasExplicitExporterMode?.() && (mode === "http-json" || mode === "v2-json")) {
    return new HttpJsonExporter(config);
  }
  if (config.otlpEndpoint) {
    return new OtlpJsonExporter(config);
  }
  try {
    const url = new URL(config.url);
    if (url.protocol === "ws:" || url.protocol === "wss:") {
      return new WebSocketExporter(config);
    }
  } catch {
  }
  return new HttpJsonExporter(config);
}

// src/replay/index.ts
var DEFAULT_MASK_SELECTOR = DEFAULT_REDACT_SELECTOR;
var MAX_KEEPALIVE_BYTES2 = 48 * 1024;
var DEFAULT_MAX_BYTES = 5 * 1024 * 1024;
var ReplayRingBuffer = class {
  constructor(maxDurationMs = 3e4, maxFrames = 2e3, maxBytes = DEFAULT_MAX_BYTES) {
    this.frames = [];
    this.head = 0;
    this.totalBytes = 0;
    this.anchorMeta = null;
    this.anchorFullSnapshot = null;
    this.maxDurationMs = Math.max(1e3, maxDurationMs);
    this.maxFrames = Math.max(10, maxFrames);
    this.maxBytes = Math.max(256, maxBytes);
  }
  push(frame, isCheckout = false) {
    const ts = typeof frame.timestamp === "number" && Number.isFinite(frame.timestamp) ? frame.timestamp : Date.now();
    const normalized = { ...frame, timestamp: ts };
    if (isCheckout) {
      this.frames = [];
      this.head = 0;
      this.totalBytes = 0;
      if (normalized.type !== 2) {
        this.anchorMeta = null;
      }
      this.anchorFullSnapshot = null;
    }
    if (normalized.type === 4) {
      this.anchorMeta = normalized;
    } else if (normalized.type === 2) {
      this.anchorFullSnapshot = normalized;
    }
    let bytes = 64;
    try {
      bytes = utf8ByteLength(JSON.stringify(normalized));
    } catch {
      bytes = 64;
    }
    this.frames.push({ frame: normalized, bytes });
    this.totalBytes += bytes;
    this.prune(ts);
  }
  prune(now = Date.now()) {
    const cutoff = now - this.maxDurationMs;
    while (this.head < this.frames.length) {
      const entry = this.frames[this.head];
      const count = this.frames.length - this.head;
      if (entry.frame.timestamp < cutoff || count > this.maxFrames || this.totalBytes > this.maxBytes) {
        this.totalBytes -= entry.bytes;
        this.head++;
      } else {
        break;
      }
    }
    if (this.head > 64 && this.head * 2 >= this.frames.length) {
      this.frames = this.frames.slice(this.head);
      this.head = 0;
    }
  }
  getSnapshotFrames() {
    const lastIdx = this.frames.length - 1;
    this.prune(
      lastIdx >= this.head ? this.frames[lastIdx].frame.timestamp : Date.now()
    );
    const activeFrames = this.frames.slice(this.head).map((e) => e.frame);
    if (activeFrames.length === 0) {
      return [];
    }
    const result = [];
    const hasMetaInWindow = activeFrames.some((f) => f.type === 4);
    const hasFullSnapshotInWindow = activeFrames.some((f) => f.type === 2);
    if (!hasFullSnapshotInWindow && this.anchorFullSnapshot) {
      if (!hasMetaInWindow && this.anchorMeta && this.anchorMeta.timestamp <= this.anchorFullSnapshot.timestamp) {
        result.push(this.anchorMeta);
      }
      result.push(this.anchorFullSnapshot);
    } else if (!hasMetaInWindow && this.anchorMeta) {
      const firstTs = activeFrames[0]?.timestamp ?? Infinity;
      if (this.anchorMeta.timestamp <= firstTs) {
        result.push(this.anchorMeta);
      }
    }
    for (const f of activeFrames) {
      if (result.length > 0 && result[result.length - 1] === f) {
        continue;
      }
      result.push(f);
    }
    return result;
  }
  clear() {
    this.frames = [];
    this.head = 0;
    this.totalBytes = 0;
    this.anchorMeta = null;
    this.anchorFullSnapshot = null;
  }
  size() {
    return this.frames.length - this.head;
  }
};
var RageClickDetector = class {
  constructor(windowMs = 1e3, threshold = 3, radiusPx = 30) {
    this.clicks = [];
    this.windowMs = windowMs;
    this.threshold = threshold;
    this.radiusPx = radiusPx;
  }
  recordClick(sample) {
    if (!sample.target || sample.target.trim().length === 0) {
      return { isRageClick: false, clickCount: 0 };
    }
    if (sample.x === null || sample.y === null || !Number.isFinite(sample.x) || !Number.isFinite(sample.y)) {
      return { isRageClick: false, clickCount: 0 };
    }
    const cutoff = sample.timestamp - this.windowMs;
    this.clicks = this.clicks.filter((c) => c.timestamp >= cutoff);
    this.clicks.push(sample);
    const matching = this.clicks.filter((c) => {
      if (c.target !== sample.target) {
        return false;
      }
      if (c.x === null || c.y === null || !Number.isFinite(c.x) || !Number.isFinite(c.y)) {
        return false;
      }
      const dx = c.x - sample.x;
      const dy = c.y - sample.y;
      return Math.hypot(dx, dy) <= this.radiusPx;
    });
    if (matching.length >= this.threshold) {
      const count = matching.length;
      this.clicks = this.clicks.filter((c) => c.target !== sample.target);
      return { isRageClick: true, clickCount: count };
    }
    return { isRageClick: false, clickCount: matching.length };
  }
  reset() {
    this.clicks = [];
  }
};
function createReplayController(config, packager, getExporter) {
  let activeStopFn = null;
  let activeRingBuffer = null;
  let activeFlushFn = null;
  const stopSessionReplay3 = () => {
    if (activeStopFn) {
      activeStopFn();
      activeStopFn = null;
    }
    activeRingBuffer = null;
    activeFlushFn = null;
  };
  const flushSessionReplay3 = async (trigger = "manual") => {
    if (activeFlushFn) {
      return activeFlushFn(trigger);
    }
    return null;
  };
  const getActiveReplayRingBuffer3 = () => {
    return activeRingBuffer;
  };
  const startSessionReplay3 = (options2 = {}) => {
    if (config.isPrivacyLocked()) {
      console.warn(
        "[UserALE] Ignoring startSessionReplay() because privacy is locked."
      );
      return () => {
      };
    }
    stopSessionReplay3();
    const maxDurationMs = options2.maxDurationMs ?? 3e4;
    const maxFrames = options2.maxFrames ?? 2e3;
    const maxBytes = options2.maxBytes ?? DEFAULT_MAX_BYTES;
    const observeMutations = options2.observeMutations ?? true;
    const detectRageClicks = options2.detectRageClicks ?? true;
    const flushOnError = options2.flushOnError ?? true;
    const ignoreSelector = options2.ignoreSelector ?? DEFAULT_IGNORE_SELECTOR;
    const maskTextSelector = options2.maskAllText ? "*" : options2.maskTextSelector ?? DEFAULT_MASK_SELECTOR;
    const maskAllInputs = options2.maskAllInputs ?? true;
    const ringBuffer = new ReplayRingBuffer(maxDurationMs, maxFrames, maxBytes);
    activeRingBuffer = ringBuffer;
    let stopRecorder;
    if (typeof options2.recorder === "function") {
      stopRecorder = options2.recorder({
        emit: (event, isCheckout) => {
          ringBuffer.push(event, isCheckout);
        },
        checkoutEveryNms: maxDurationMs,
        maskAllInputs,
        ...options2.maskAllText !== void 0 ? { maskAllText: options2.maskAllText } : {},
        blockSelector: ignoreSelector,
        maskTextSelector
      });
    }
    const doFlush = async (trigger) => {
      if (!config.on) {
        return null;
      }
      const frames = ringBuffer.getSnapshotFrames();
      if (frames.length === 0) {
        return null;
      }
      const privacy = config.getResolvedPrivacy();
      const traceCtx = privacy.attachTraceContext && typeof config.traceContext === "function" ? config.traceContext() : null;
      const envelope = {
        logType: "replay",
        type: "session_replay",
        trigger,
        sessionId: config.sessionId,
        httpSessionId: config.httpSessionId,
        browserSessionId: config.browserSessionId,
        pageUrl: safeReadPageUrl(privacy),
        startTime: frames[0].timestamp,
        endTime: frames[frames.length - 1].timestamp,
        frameCount: frames.length,
        frames,
        ...traceCtx?.traceId ? { traceId: traceCtx.traceId } : {},
        ...traceCtx?.spanId ? { spanId: traceCtx.spanId } : {}
      };
      if (typeof options2.onFlush === "function") {
        await options2.onFlush(envelope);
        return envelope;
      }
      const serialized = JSON.stringify(envelope);
      if (utf8ByteLength(serialized) <= MAX_KEEPALIVE_BYTES2) {
        packager.packageCustomLog(
          {
            logType: "replay",
            type: "session_replay",
            trigger,
            frameCount: envelope.frameCount,
            startTime: envelope.startTime,
            endTime: envelope.endTime
          },
          () => ({
            frames: envelope.frames
          }),
          false
        );
      } else {
        const exporter = config.exporter && typeof config.exporter.export === "function" ? config.exporter : getExporter ? getExporter() : createExporter(config);
        try {
          await exporter.export([envelope], {
            keepalive: false
          });
        } catch {
        }
      }
      return envelope;
    };
    activeFlushFn = doFlush;
    let observer = null;
    let mutationTimer = null;
    let pendingAdded = 0;
    let pendingRemoved = 0;
    let pendingAttributes = 0;
    const pendingTargets = /* @__PURE__ */ new Set();
    const flushMutationSummary = () => {
      mutationTimer = null;
      if (pendingAdded === 0 && pendingRemoved === 0 && pendingAttributes === 0) {
        return;
      }
      const addedCount = pendingAdded;
      const removedCount = pendingRemoved;
      const attributeCount = pendingAttributes;
      const targets = Array.from(pendingTargets).slice(0, 10);
      pendingAdded = 0;
      pendingRemoved = 0;
      pendingAttributes = 0;
      pendingTargets.clear();
      if (config.on) {
        const privacy = config.getResolvedPrivacy();
        packager.packageCustomLog(
          {
            logType: "mutation",
            type: "mutation",
            target: targets[0] ?? (privacy.domSelectorMode === "none" ? "" : "#document")
          },
          () => ({
            addedCount,
            removedCount,
            attributeCount,
            targets
          }),
          false
        );
      }
    };
    if (observeMutations && typeof MutationObserver !== "undefined" && typeof document !== "undefined" && document.documentElement) {
      observer = new MutationObserver((records) => {
        if (!config.on) {
          return;
        }
        const privacy = config.getResolvedPrivacy();
        const allowlistInvalid = config.isAllowlistSelectorInvalid();
        if (allowlistInvalid) {
          return;
        }
        for (const rec of records) {
          if (isNodeIgnored(rec.target, ignoreSelector)) {
            continue;
          }
          if (privacy.allowlistSelector !== null && (!isElementNode(rec.target) || !closestComposed(rec.target, privacy.allowlistSelector))) {
            continue;
          }
          if (rec.type === "childList") {
            let validAdded = 0;
            for (let i = 0; i < rec.addedNodes.length; i++) {
              if (!isNodeIgnored(rec.addedNodes[i], ignoreSelector)) {
                validAdded++;
              }
            }
            let validRemoved = 0;
            for (let i = 0; i < rec.removedNodes.length; i++) {
              if (!isNodeIgnored(rec.removedNodes[i], ignoreSelector)) {
                validRemoved++;
              }
            }
            if (validAdded === 0 && validRemoved === 0) {
              continue;
            }
            pendingAdded += validAdded;
            pendingRemoved += validRemoved;
          } else if (rec.type === "attributes") {
            pendingAttributes += 1;
          }
          if (rec.target && pendingTargets.size < 10 && privacy.domSelectorMode !== "none") {
            const sel = getSelector(rec.target, privacy.domSelectorMode);
            if (sel && sel !== "Unknown") {
              pendingTargets.add(sel);
            }
          }
        }
        if ((pendingAdded > 0 || pendingRemoved > 0 || pendingAttributes > 0) && mutationTimer === null) {
          const delay = Math.max(20, config.resolution || 500);
          mutationTimer = setTimeout(flushMutationSummary, delay);
        }
      });
      observer.observe(document.documentElement, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ["class", "id", "hidden", "disabled", "aria-expanded"]
      });
    }
    const rageDetector = new RageClickDetector();
    const onClickCapture = (e) => {
      if (!config.on || !e.target) {
        return;
      }
      const privacy = config.getResolvedPrivacy();
      const filterRes = evaluateEventPrivacyFilter(
        e,
        privacy,
        config.isAllowlistSelectorInvalid(),
        ignoreSelector
      );
      if (!filterRes.allowed) {
        return;
      }
      if (!privacy.captureLocation || privacy.domSelectorMode === "none") {
        return;
      }
      const targetSel = getSelector(e.target, privacy.domSelectorMode);
      const now = Date.now();
      const { isRageClick, clickCount } = rageDetector.recordClick({
        target: targetSel,
        timestamp: now,
        x: typeof e.clientX === "number" ? e.clientX : null,
        y: typeof e.clientY === "number" ? e.clientY : null
      });
      if (isRageClick) {
        const rect = privacy.captureTargetRect ? getTargetRect(e.target) : null;
        packager.packageCustomLog(
          {
            logType: "custom",
            type: "rage_click",
            target: targetSel
          },
          () => ({
            clickCount,
            ...rect ? { targetRect: rect } : {}
          }),
          true
        );
        void doFlush("rage_click");
      }
    };
    if (detectRageClicks && typeof document !== "undefined") {
      document.addEventListener("click", onClickCapture, true);
    }
    const onWindowError = () => {
      void doFlush("error");
    };
    const onUnhandledRejection = () => {
      void doFlush("unhandledrejection");
    };
    if (flushOnError && typeof self !== "undefined" && typeof self.addEventListener === "function") {
      self.addEventListener("error", onWindowError);
      self.addEventListener("unhandledrejection", onUnhandledRejection);
    }
    const cleanup = () => {
      if (mutationTimer !== null) {
        clearTimeout(mutationTimer);
        mutationTimer = null;
      }
      if (observer) {
        observer.disconnect();
        observer = null;
      }
      if (detectRageClicks && typeof document !== "undefined") {
        document.removeEventListener("click", onClickCapture, true);
      }
      if (flushOnError && typeof self !== "undefined" && typeof self.removeEventListener === "function") {
        self.removeEventListener("error", onWindowError);
        self.removeEventListener("unhandledrejection", onUnhandledRejection);
      }
      if (typeof stopRecorder === "function") {
        stopRecorder();
        stopRecorder = void 0;
      }
      rageDetector.reset();
      ringBuffer.clear();
      if (activeStopFn === cleanup) {
        activeStopFn = null;
        activeRingBuffer = null;
        activeFlushFn = null;
      }
    };
    activeStopFn = cleanup;
    return cleanup;
  };
  return {
    startSessionReplay: startSessionReplay3,
    stopSessionReplay: stopSessionReplay3,
    flushSessionReplay: flushSessionReplay3,
    getActiveReplayRingBuffer: getActiveReplayRingBuffer3
  };
}
var legacyReplayController = null;
async function flushSessionReplay(trigger = "manual") {
  if (legacyReplayController) {
    return legacyReplayController.flushSessionReplay(trigger);
  }
  return null;
}
function stopSessionReplay() {
  if (legacyReplayController) {
    legacyReplayController.stopSessionReplay();
    legacyReplayController = null;
  }
}
function startSessionReplay(options2 = {}, config = Configuration.getInstance()) {
  stopSessionReplay();
  legacyReplayController = createReplayController(config, {
    packageCustomLog
  });
  return legacyReplayController.startSessionReplay(options2);
}
function getActiveReplayRingBuffer() {
  return legacyReplayController ? legacyReplayController.getActiveReplayRingBuffer() : null;
}

// src/attachHandlers.ts
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
function isPasswordInput(target) {
  if (!isElementNode(target)) {
    return false;
  }
  if (safeGetLocalName(target).toLowerCase() !== "input") {
    return false;
  }
  const typeAttr = safeGetAttribute(target, "type");
  return typeof typeAttr === "string" && typeAttr.toLowerCase() === "password";
}
function isRedactedElement(target) {
  return isElementRedacted(target);
}
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
  if (isPasswordInput(e.target)) {
    return null;
  }
  if (isRedactedElement(e.target)) {
    return {
      key: "[REDACTED]",
      code: "[REDACTED]",
      ctrl: e.ctrlKey,
      alt: e.altKey,
      shift: e.shiftKey,
      meta: e.metaKey
    };
  }
  return {
    key: e.key,
    code: e.code,
    ctrl: e.ctrlKey,
    alt: e.altKey,
    shift: e.shiftKey,
    meta: e.metaKey
  };
}
function extractInputDetails(e) {
  if (isPasswordInput(e.target)) {
    return null;
  }
  if (isRedactedElement(e.target)) {
    return {
      value: "[REDACTED]"
    };
  }
  return {
    value: e.target?.value
  };
}
function extractChangeDetails(e) {
  if (isPasswordInput(e.target)) {
    return null;
  }
  if (isRedactedElement(e.target)) {
    return {
      value: "[REDACTED]"
    };
  }
  return {
    value: e.target?.value
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
function buildDetailMaps(config) {
  const events = {
    click: extractMouseDetails,
    dblclick: extractMouseDetails,
    mousedown: extractMouseDetails,
    mouseup: extractMouseDetails,
    focus: null,
    blur: null,
    input: config.logDetails ? extractInputDetails : null,
    change: config.logDetails ? extractChangeDetails : null,
    dragstart: null,
    dragend: null,
    drag: null,
    drop: null,
    keydown: config.logDetails ? extractKeyboardDetails : null,
    mouseover: null
  };
  const bufferedEvents = {
    wheel: extractWheelDetails,
    scroll: extractScrollDetails,
    resize: extractResizeDetails
  };
  const refreshEvents = {
    submit: null
  };
  return { events, bufferedEvents, refreshEvents };
}
function defineCustomDetails(options2, type) {
  if (options2 instanceof Configuration && (options2.isPrivacyLocked() || !options2.getResolvedPrivacy().captureDetails)) {
    return null;
  }
  const rawPrivacy = options2?.privacy;
  if (rawPrivacy && typeof rawPrivacy === "object" && (rawPrivacy.captureDetails === false || rawPrivacy.preset === "strict")) {
    return null;
  }
  const eventType = {
    click: extractMouseDetails,
    dblclick: extractMouseDetails,
    mousedown: extractMouseDetails,
    mouseup: extractMouseDetails,
    focus: null,
    blur: null,
    load: null,
    input: options2.logDetails ? extractInputDetails : null,
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
function createHandlerManager(packager) {
  let events = {};
  let bufferBools = {};
  let bufferedEvents = {};
  let refreshEvents = {};
  let handlerAbortController = null;
  const debounceTimers = /* @__PURE__ */ new Set();
  const detachHandlers2 = () => {
    if (handlerAbortController) {
      handlerAbortController.abort();
      handlerAbortController = null;
    }
    for (const timerId of debounceTimers) {
      clearTimeout(timerId);
    }
    debounceTimers.clear();
  };
  const attachHandlers2 = (config) => {
    try {
      detachHandlers2();
      const maps = buildDetailMaps(config);
      events = maps.events;
      bufferedEvents = maps.bufferedEvents;
      refreshEvents = maps.refreshEvents;
      bufferBools = {};
      handlerAbortController = typeof AbortController !== "undefined" ? new AbortController() : null;
      const signal = handlerAbortController?.signal;
      const configuredEvents = Array.isArray(config.events) ? new Set(config.events) : null;
      const docEventsToAttach = Object.keys(events).filter(
        (ev) => !configuredEvents || configuredEvents.has(ev)
      );
      if (configuredEvents) {
        const knownBuckets = /* @__PURE__ */ new Set([
          ...Object.keys(events),
          ...Object.keys(bufferedEvents),
          ...Object.keys(refreshEvents),
          ...windowEvents
        ]);
        for (const ev of configuredEvents) {
          if (!knownBuckets.has(ev)) {
            docEventsToAttach.push(ev);
          }
        }
      }
      docEventsToAttach.forEach(function(ev) {
        document.addEventListener(
          ev,
          function(e) {
            packager.packageLog(
              e,
              defineCustomDetails(config, ev)
            );
          },
          signal ? { capture: true, signal } : true
        );
      });
      intervalEvents.filter((ev) => !configuredEvents || configuredEvents.has(ev)).forEach(function(ev) {
        document.addEventListener(
          ev,
          function(e) {
            packager.packageIntervalLog(e);
          },
          signal ? { capture: true, signal } : true
        );
      });
      Object.keys(bufferedEvents).filter((ev) => !configuredEvents || configuredEvents.has(ev)).forEach(function(ev) {
        bufferBools[ev] = true;
        const passive = ev === "wheel" || ev === "scroll";
        self.addEventListener(
          ev,
          function(e) {
            if (bufferBools[ev]) {
              bufferBools[ev] = false;
              packager.packageLog(e, defineCustomDetails(config, ev));
              const timerId = setTimeout(function() {
                debounceTimers.delete(timerId);
                bufferBools[ev] = true;
              }, config.resolution);
              debounceTimers.add(timerId);
            }
          },
          signal ? { capture: true, passive, signal } : passive ? { capture: true, passive: true } : true
        );
      });
      Object.keys(refreshEvents).filter((ev) => !configuredEvents || configuredEvents.has(ev)).forEach(function(ev) {
        document.addEventListener(
          ev,
          function(e) {
            packager.packageLog(e, defineCustomDetails(config, ev));
          },
          signal ? { capture: true, signal } : true
        );
      });
      windowEvents.filter((ev) => !configuredEvents || configuredEvents.has(ev)).forEach(function(ev) {
        self.addEventListener(
          ev,
          function(e) {
            packager.packageLog(e, function() {
              return { window: true };
            });
          },
          signal ? { capture: true, signal } : true
        );
      });
      return true;
    } catch {
      return false;
    }
  };
  return {
    attachHandlers: attachHandlers2,
    detachHandlers: detachHandlers2
  };
}
var defaultHandlers = createHandlerManager({
  packageLog: (e, detailFcn) => packageLog(e, detailFcn),
  packageIntervalLog: (e) => packageIntervalLog(e)
});
function detachHandlers() {
  defaultHandlers.detachHandlers();
}
function attachHandlers(config) {
  return defaultHandlers.attachHandlers(config);
}

// src/sendLogs.ts
function isWebSocketMode(config) {
  return Boolean(
    config.websocketsEnabled || typeof config.url === "string" && /^wss?:/i.test(config.url)
  );
}
function buildExporterCacheKey(config) {
  return [
    config.url,
    config.otlpEndpoint ?? "",
    config.exporterFormat ?? "",
    config.exporterType ?? "http-json",
    String(Boolean(config.websocketsEnabled)),
    config.apiKey ?? "",
    typeof config.authHeader === "string" ? config.authHeader : ""
  ].join("|");
}
function warnPlaintextCredentials(config) {
  try {
    const url = new URL(config.url);
    if ((config.apiKey || config.authHeader) && url.protocol === "http:" && !["localhost", "127.0.0.1", "[::1]"].includes(url.hostname)) {
      console.warn(
        "[UserALE] Sending credentials over plaintext HTTP. Use HTTPS in production."
      );
    }
  } catch {
  }
}
function createSender(config, logs2) {
  let sendIntervalId2;
  let pagehideHandler2 = null;
  let pageshowHandler2 = null;
  let activeExporter2 = null;
  let activeExporterKey2 = null;
  let activeCustomExporter2 = null;
  let activeOtelLogger2 = null;
  const inFlightExports2 = /* @__PURE__ */ new Set();
  const trackExport2 = (promise) => {
    const tracked = promise.then(
      () => void 0,
      (error) => {
        console.error(error);
      }
    );
    inFlightExports2.add(tracked);
    tracked.finally(() => {
      inFlightExports2.delete(tracked);
    });
    return tracked;
  };
  const resolveExporter = () => {
    const key = buildExporterCacheKey(config);
    if (activeExporter2 && activeExporterKey2 === key && activeCustomExporter2 === (config.exporter ?? null) && activeOtelLogger2 === (config.otelLogger ?? null)) {
      return activeExporter2;
    }
    activeExporter2 = createExporter(config);
    activeExporterKey2 = key;
    activeCustomExporter2 = config.exporter ?? null;
    activeOtelLogger2 = config.otelLogger ?? null;
    return activeExporter2;
  };
  const registerExporter3 = (exporter) => {
    if (config.isPrivacyLocked()) {
      return false;
    }
    if (exporter !== null && typeof exporter?.export !== "function") {
      return false;
    }
    config.update({ exporter });
    activeExporter2 = null;
    activeExporterKey2 = null;
    activeCustomExporter2 = null;
    activeOtelLogger2 = null;
    return true;
  };
  const sendLogs2 = async (batch, retries) => {
    const exporter = resolveExporter();
    const result = await exporter.export(batch, { retries });
    if (result && result.success === false && result.error) {
      console.error(result.error);
    }
  };
  const removeLifecycleListeners = () => {
    if (typeof self !== "undefined" && typeof self.removeEventListener === "function") {
      if (pagehideHandler2) {
        self.removeEventListener("pagehide", pagehideHandler2);
        pagehideHandler2 = null;
      }
      if (pageshowHandler2) {
        self.removeEventListener("pageshow", pageshowHandler2);
        pageshowHandler2 = null;
      }
    }
  };
  const initSender2 = () => {
    if (sendIntervalId2 !== void 0) {
      clearInterval(sendIntervalId2);
      sendIntervalId2 = void 0;
    }
    warnPlaintextCredentials(config);
    activeExporter2 = null;
    activeExporterKey2 = null;
    resolveExporter();
    sendIntervalId2 = setInterval(() => {
      if (!config.on) {
        return;
      }
      if (logs2.length >= config.logCountThreshold) {
        const batch = logs2.splice(0);
        trackExport2(sendLogs2(batch, 0));
      }
    }, config.transmitInterval);
    removeLifecycleListeners();
    if (typeof self !== "undefined" && typeof self.addEventListener === "function") {
      const hideListener = () => {
        if (!config.on) {
          return;
        }
        if (logs2.length > 0) {
          const batch = logs2.splice(0);
          const exporter = resolveExporter();
          trackExport2(
            exporter.export(batch, { keepalive: true }).catch((error) => {
              console.error(error);
            })
          );
        }
        if (activeExporter2 && isWebSocketMode(config) && typeof activeExporter2.shutdown === "function") {
          const wsExporter = activeExporter2;
          activeExporter2 = null;
          activeExporterKey2 = null;
          void wsExporter.shutdown?.().catch((error) => {
            console.error(error);
          });
        }
      };
      const showListener = (event) => {
        const persisted = Boolean(event.persisted);
        if (persisted && config.on && isWebSocketMode(config) && !activeExporter2) {
          resolveExporter();
        }
      };
      pagehideHandler2 = hideListener;
      pageshowHandler2 = showListener;
      self.addEventListener("pagehide", hideListener);
      self.addEventListener("pageshow", showListener);
    }
  };
  const stopSender2 = async () => {
    if (sendIntervalId2 !== void 0) {
      clearInterval(sendIntervalId2);
      sendIntervalId2 = void 0;
    }
    removeLifecycleListeners();
    const exporter = activeExporter2;
    activeExporter2 = null;
    activeExporterKey2 = null;
    activeCustomExporter2 = null;
    activeOtelLogger2 = null;
    if (exporter && typeof exporter.shutdown === "function") {
      try {
        await exporter.shutdown();
      } catch (error) {
        console.error(error);
      }
    }
  };
  const flushLogs2 = async () => {
    if (logs2.length > 0) {
      const batch = logs2.splice(0);
      await trackExport2(sendLogs2(batch, 0));
    }
    if (inFlightExports2.size > 0) {
      await Promise.allSettled(Array.from(inFlightExports2));
    }
    if (activeExporter2 && typeof activeExporter2.flush === "function") {
      await activeExporter2.flush();
    }
  };
  return {
    registerExporter: registerExporter3,
    resolveExporter,
    initSender: initSender2,
    stopSender: stopSender2,
    flushLogs: flushLogs2,
    sendLogs: sendLogs2
  };
}
var sendIntervalId;
var pagehideHandler = null;
var pageshowHandler = null;
var activeExporter = null;
var activeExporterKey = null;
var activeCustomExporter = null;
var activeOtelLogger = null;
var inFlightExports = /* @__PURE__ */ new Set();
function trackExport(promise) {
  const tracked = promise.then(
    () => void 0,
    (error) => {
      console.error(error);
    }
  );
  inFlightExports.add(tracked);
  tracked.finally(() => {
    inFlightExports.delete(tracked);
  });
  return tracked;
}
function registerExporter(exporter, targetConfig) {
  const target = targetConfig ?? Configuration.getInstance();
  if (target.isPrivacyLocked()) {
    return false;
  }
  if (exporter !== null && typeof exporter?.export !== "function") {
    return false;
  }
  target.update({ exporter });
  activeExporter = null;
  activeExporterKey = null;
  activeCustomExporter = null;
  activeOtelLogger = null;
  return true;
}
function resolveActiveExporter(config) {
  const key = buildExporterCacheKey(config);
  if (activeExporter && activeExporterKey === key && activeCustomExporter === (config.exporter ?? null) && activeOtelLogger === (config.otelLogger ?? null)) {
    return activeExporter;
  }
  activeExporter = createExporter(config);
  activeExporterKey = key;
  activeCustomExporter = config.exporter ?? null;
  activeOtelLogger = config.otelLogger ?? null;
  return activeExporter;
}
function initSender(logs2, config) {
  if (sendIntervalId !== void 0) {
    clearInterval(sendIntervalId);
    sendIntervalId = void 0;
  }
  warnPlaintextCredentials(config);
  activeExporter = null;
  activeExporterKey = null;
  resolveActiveExporter(config);
  sendIntervalId = sendOnInterval(logs2, config);
  if (typeof self !== "undefined") {
    if (pagehideHandler && typeof self.removeEventListener === "function") {
      self.removeEventListener("pagehide", pagehideHandler);
      pagehideHandler = null;
    }
    if (pageshowHandler && typeof self.removeEventListener === "function") {
      self.removeEventListener("pageshow", pageshowHandler);
      pageshowHandler = null;
    }
  }
  sendOnClose(logs2, config);
}
async function stopSender() {
  if (sendIntervalId !== void 0) {
    clearInterval(sendIntervalId);
    sendIntervalId = void 0;
  }
  if (typeof self !== "undefined" && typeof self.removeEventListener === "function") {
    if (pagehideHandler) {
      self.removeEventListener("pagehide", pagehideHandler);
      pagehideHandler = null;
    }
    if (pageshowHandler) {
      self.removeEventListener("pageshow", pageshowHandler);
      pageshowHandler = null;
    }
  }
  const exporter = activeExporter;
  activeExporter = null;
  activeExporterKey = null;
  activeCustomExporter = null;
  activeOtelLogger = null;
  if (exporter && typeof exporter.shutdown === "function") {
    try {
      await exporter.shutdown();
    } catch (error) {
      console.error(error);
    }
  }
}
async function flushLogs(logs2, config) {
  if (logs2.length > 0) {
    const batch = logs2.splice(0);
    await trackExport(sendLogs(batch, config, 0));
  }
  if (inFlightExports.size > 0) {
    await Promise.allSettled(Array.from(inFlightExports));
  }
  if (activeExporter && typeof activeExporter.flush === "function") {
    await activeExporter.flush();
  }
}
function sendOnInterval(logs2, config) {
  return setInterval(function() {
    if (!config.on) {
      return;
    }
    if (logs2.length >= config.logCountThreshold) {
      const batch = logs2.splice(0);
      trackExport(sendLogs(batch, config, 0));
    }
  }, config.transmitInterval);
}
function sendOnClose(logs2, config) {
  if (typeof self === "undefined" || typeof self.addEventListener !== "function") {
    return;
  }
  const hideListener = function() {
    if (!config.on) {
      return;
    }
    if (logs2.length > 0) {
      const batch = logs2.splice(0);
      const exporter = resolveActiveExporter(config);
      trackExport(
        exporter.export(batch, { keepalive: true }).catch((error) => {
          console.error(error);
        })
      );
    }
    if (activeExporter && isWebSocketMode(config) && typeof activeExporter.shutdown === "function") {
      const wsExporter = activeExporter;
      activeExporter = null;
      activeExporterKey = null;
      void wsExporter.shutdown?.().catch((error) => {
        console.error(error);
      });
    }
  };
  const showListener = function(event) {
    const persisted = Boolean(event.persisted);
    if (persisted && config.on && isWebSocketMode(config) && !activeExporter) {
      resolveActiveExporter(config);
    }
  };
  pagehideHandler = hideListener;
  pageshowHandler = showListener;
  self.addEventListener("pagehide", hideListener);
  self.addEventListener("pageshow", showListener);
}
async function sendLogs(logs2, config, retries) {
  const exporter = resolveActiveExporter(config);
  const result = await exporter.export(logs2, { retries });
  if (result && result.success === false && result.error) {
    console.error(result.error);
  }
}

// src/runtime.ts
var INTERNAL_CONFIG_KEYS = /* @__PURE__ */ new Set(["initialized"]);
var FORBIDDEN_CUSTOM_KEYS = /* @__PURE__ */ new Set([
  "__proto__",
  "constructor",
  "prototype"
]);
function snapshotConfig(config) {
  const snapshot = {};
  for (const key of Object.keys(config)) {
    if (INTERNAL_CONFIG_KEYS.has(key)) {
      continue;
    }
    const val = config[key];
    if (key === "headers" && val && typeof val === "object" && !Array.isArray(val)) {
      snapshot[key] = { ...val };
    } else if (key === "privacy") {
      snapshot[key] = clonePrivacyOptions(config.getResolvedPrivacy());
    } else if (key === "events" && Array.isArray(val)) {
      snapshot[key] = [...val];
    } else {
      snapshot[key] = val;
    }
  }
  return snapshot;
}
function createIsolatedCredentials(config) {
  let instanceAuthCb = null;
  let instanceHeadersCb = null;
  registerConfigCredentialResolver(config, {
    resolveAuthHeader: () => {
      if (!instanceAuthCb) {
        return void 0;
      }
      try {
        const res = instanceAuthCb();
        return typeof res === "string" ? res : null;
      } catch (e) {
        console.error(`Error encountered while setting the auth header: ${e}`);
        return null;
      }
    },
    resolveCustomHeaders: () => {
      if (!instanceHeadersCb) {
        return void 0;
      }
      try {
        const res = instanceHeadersCb();
        if (!res || typeof res !== "object" || Array.isArray(res)) {
          return null;
        }
        const valid = {};
        for (const [k, v] of Object.entries(res)) {
          if (typeof k !== "string" || typeof v !== "string") {
            return null;
          }
          valid[k] = v;
        }
        return valid;
      } catch (e) {
        console.error(`Error encountered while setting the headers: ${e}`);
        return null;
      }
    }
  });
  return {
    registerAuthCallback: (callback) => {
      try {
        verifyCallback(callback);
        instanceAuthCb = callback;
        return true;
      } catch {
        return false;
      }
    },
    resetAuthCallback: () => {
      instanceAuthCb = null;
    },
    registerHeadersCallback: (callback) => {
      try {
        verifyCallback2(callback);
        instanceHeadersCb = callback;
        return true;
      } catch {
        return false;
      }
    },
    resetHeadersCallback: () => {
      instanceHeadersCb = null;
    }
  };
}
function buildRuntime({
  useSingletonControllers,
  attachLoadListener,
  autoInitDefault,
  config
}) {
  const logs2 = [];
  let isStarted = false;
  let setupTimerId = null;
  let startedChangeListener = null;
  const startLoadTimestamp = Date.now();
  let endLoadTimestamp;
  if (attachLoadListener) {
    if (typeof self !== "undefined" && typeof self.addEventListener === "function") {
      self.addEventListener("load", function() {
        endLoadTimestamp = Date.now();
      });
    }
    config.update({ useraleVersion: version });
  }
  let packager;
  let handlers;
  let sender;
  let replay;
  let creds;
  if (useSingletonControllers) {
    initPackager(logs2, config);
    packager = {
      packageLog,
      packageCustomLog,
      packageIntervalLog,
      addCallbacks,
      removeCallbacks,
      enqueueLog,
      resetIntervalState,
      log: (customLog) => {
        if (!customLog || typeof customLog !== "object" || Array.isArray(customLog)) {
          return false;
        }
        const cloned = {};
        for (const [k, v] of Object.entries(customLog)) {
          if (!FORBIDDEN_CUSTOM_KEYS.has(k) && v !== void 0) {
            cloned[k] = v;
          }
        }
        const enforced = enforcePrivacyOnLog(
          cloned,
          config.getResolvedPrivacy(),
          { isPackaged: false }
        );
        enqueueLog(enforced);
        return true;
      }
    };
    handlers = {
      attachHandlers,
      detachHandlers
    };
    sender = {
      registerExporter: (exporter) => registerExporter(exporter, config),
      resolveExporter: () => resolveActiveExporter(config),
      initSender: () => initSender(logs2, config),
      stopSender,
      flushLogs: () => flushLogs(logs2, config),
      sendLogs: (batch, retries) => sendLogs(batch, config, retries)
    };
    replay = {
      startSessionReplay: (opts) => startSessionReplay(opts, config),
      stopSessionReplay,
      flushSessionReplay,
      getActiveReplayRingBuffer
    };
    creds = {
      registerAuthCallback,
      resetAuthCallback,
      registerHeadersCallback,
      resetHeadersCallback
    };
  } else {
    packager = createPackager(logs2, config);
    handlers = createHandlerManager(packager);
    sender = createSender(config, logs2);
    replay = createReplayController(
      config,
      packager,
      () => sender.resolveExporter()
    );
    creds = createIsolatedCredentials(config);
  }
  const setStarted = (value) => {
    isStarted = value;
    startedChangeListener?.(value);
  };
  const clearSetupTimer = () => {
    if (setupTimerId !== null) {
      clearTimeout(setupTimerId);
      setupTimerId = null;
    }
  };
  const ensureInitialized = (newConfig) => {
    if (!config.isInitialized() && !config.isPrivacyLocked()) {
      const pendingExporter = config.exporter;
      config.initialize({
        autostart: autoInitDefault,
        persistSession: newConfig?.persistSession,
        sessionId: newConfig?.sessionId
      });
      config.update({ useraleVersion: version });
      if (pendingExporter && newConfig?.exporter === void 0) {
        config.update({ exporter: pendingExporter });
      }
    }
  };
  const start2 = () => {
    ensureInitialized();
    clearSetupTimer();
    if (!isStarted || config.autostart === false) {
      const wasStarted = isStarted;
      setStarted(true);
      config.on = true;
      config.update({ autostart: true });
      if (!wasStarted) {
        handlers.attachHandlers(config);
        sender.initSender();
        if (config.observeMutations && !replay.getActiveReplayRingBuffer() && !config.isPrivacyLocked()) {
          replay.startSessionReplay({ observeMutations: true });
        }
      }
    }
  };
  const stop2 = () => {
    clearSetupTimer();
    setStarted(false);
    config.on = false;
    config.update({ autostart: false });
    handlers.detachHandlers();
    packager.resetIntervalState();
    replay.stopSessionReplay();
    void sender.stopSender();
  };
  const flush2 = async () => {
    ensureInitialized();
    await sender.flushLogs();
  };
  const reset2 = () => {
    logs2.splice(0);
    packager.resetIntervalState();
  };
  const options2 = (newConfig) => {
    ensureInitialized(newConfig);
    if (newConfig) {
      config.update(newConfig);
      if (newConfig.autostart === false) {
        clearSetupTimer();
      }
      if (isStarted && !config.isPrivacyLocked() && newConfig.events !== void 0) {
        handlers.attachHandlers(config);
        packager.resetIntervalState();
      }
      if (isStarted && newConfig.observeMutations !== void 0 && !config.isPrivacyLocked()) {
        if (newConfig.observeMutations && !replay.getActiveReplayRingBuffer()) {
          replay.startSessionReplay({ observeMutations: true });
        } else if (!newConfig.observeMutations && replay.getActiveReplayRingBuffer()) {
          replay.stopSessionReplay();
        }
      }
    }
    return snapshotConfig(config);
  };
  const scheduleSetup = () => {
    if (isStarted || !config.autostart) {
      return;
    }
    if (typeof document === "undefined" && typeof self === "undefined") {
      return;
    }
    clearSetupTimer();
    setupTimerId = setTimeout(function() {
      setupTimerId = null;
      if (isStarted || !config.autostart) {
        return;
      }
      let state;
      try {
        state = document.readyState;
      } catch {
        state = "complete";
      }
      if (state === "interactive" || state === "complete") {
        start2();
        if (typeof window !== "undefined" && typeof document !== "undefined") {
          const loadDuration = Math.max(
            1,
            (endLoadTimestamp ?? Date.now()) - startLoadTimestamp
          );
          packager.packageCustomLog(
            {
              type: "load",
              details: { pageLoadTime: loadDuration }
            },
            () => ({}),
            false
          );
        }
      } else {
        scheduleSetup();
      }
    }, 100);
  };
  const lockPrivacy2 = () => {
    config.lockPrivacy();
  };
  const isPrivacyLocked2 = () => {
    return config.isPrivacyLocked();
  };
  return {
    config,
    logs: logs2,
    version,
    get started() {
      return isStarted;
    },
    getStarted: () => isStarted,
    start: start2,
    stop: stop2,
    flush: flush2,
    reset: reset2,
    options: options2,
    log: packager.log,
    details: (opts, type) => {
      if (config.isPrivacyLocked()) {
        return null;
      }
      return defineCustomDetails(opts, type);
    },
    addCallbacks: packager.addCallbacks,
    removeCallbacks: packager.removeCallbacks,
    packageLog: packager.packageLog,
    packageCustomLog: packager.packageCustomLog,
    registerAuthCallback: creds.registerAuthCallback,
    resetAuthCallback: creds.resetAuthCallback,
    registerHeadersCallback: creds.registerHeadersCallback,
    resetHeadersCallback: creds.resetHeadersCallback,
    registerExporter: sender.registerExporter,
    startSessionReplay: replay.startSessionReplay,
    stopSessionReplay: replay.stopSessionReplay,
    flushSessionReplay: replay.flushSessionReplay,
    getActiveReplayRingBuffer: replay.getActiveReplayRingBuffer,
    getSelector,
    buildPath,
    detectBrowser,
    getTargetRect,
    lockPrivacy: lockPrivacy2,
    isPrivacyLocked: isPrivacyLocked2,
    scheduleSetup,
    notifyOnStartedChange: (fn) => {
      startedChangeListener = fn;
    }
  };
}
function createRuntime(autoInit) {
  const config = autoInit ? Configuration.getInstance() : Configuration.createUninitialized();
  return buildRuntime({
    useSingletonControllers: autoInit,
    attachLoadListener: autoInit,
    autoInitDefault: autoInit,
    config
  });
}
function createUserAle(initialOptions) {
  const config = Configuration.create({
    autostart: initialOptions?.autostart ?? false,
    persistSession: initialOptions?.persistSession,
    sessionId: initialOptions?.sessionId,
    skipScriptTag: true
  });
  config.update({ useraleVersion: version });
  if (initialOptions) {
    config.update(initialOptions);
  }
  const runtime2 = buildRuntime({
    useSingletonControllers: false,
    attachLoadListener: Boolean(initialOptions?.autostart),
    autoInitDefault: Boolean(initialOptions?.autostart),
    config
  });
  if (config.autostart) {
    runtime2.scheduleSetup();
  }
  return {
    version: runtime2.version,
    get started() {
      return runtime2.started;
    },
    start: runtime2.start,
    stop: runtime2.stop,
    flush: runtime2.flush,
    reset: runtime2.reset,
    options: runtime2.options,
    log: runtime2.log,
    details: runtime2.details,
    addCallbacks: runtime2.addCallbacks,
    removeCallbacks: runtime2.removeCallbacks,
    packageLog: runtime2.packageLog,
    packageCustomLog: runtime2.packageCustomLog,
    registerAuthCallback: runtime2.registerAuthCallback,
    resetAuthCallback: runtime2.resetAuthCallback,
    registerHeadersCallback: runtime2.registerHeadersCallback,
    resetHeadersCallback: runtime2.resetHeadersCallback,
    registerExporter: runtime2.registerExporter,
    startSessionReplay: runtime2.startSessionReplay,
    stopSessionReplay: runtime2.stopSessionReplay,
    flushSessionReplay: runtime2.flushSessionReplay,
    getActiveReplayRingBuffer: runtime2.getActiveReplayRingBuffer,
    getSelector: runtime2.getSelector,
    buildPath: runtime2.buildPath,
    detectBrowser: runtime2.detectBrowser,
    getTargetRect: runtime2.getTargetRect,
    lockPrivacy: runtime2.lockPrivacy,
    isPrivacyLocked: runtime2.isPrivacyLocked
  };
}

// src/manual.ts
var runtime = createRuntime(false);
var started = false;
runtime.notifyOnStartedChange((val) => {
  started = val;
});
function details(opts, type) {
  return runtime.details(opts, type);
}
function registerAuthCallback2(callback) {
  return runtime.registerAuthCallback(callback);
}
function resetAuthCallback2() {
  runtime.resetAuthCallback();
}
function registerHeadersCallback2(callback) {
  return runtime.registerHeadersCallback(callback);
}
function resetHeadersCallback2() {
  runtime.resetHeadersCallback();
}
function addCallbacks2(...newCallbacks) {
  return runtime.addCallbacks(...newCallbacks);
}
function removeCallbacks2(targetKeys) {
  runtime.removeCallbacks(targetKeys);
}
function packageLog2(e, detailFcn) {
  return runtime.packageLog(e, detailFcn);
}
function packageCustomLog2(customLog, detailFcn, userAction) {
  return runtime.packageCustomLog(customLog, detailFcn, userAction);
}
function registerExporter2(exporter) {
  return runtime.registerExporter(exporter);
}
function startSessionReplay2(options2) {
  return runtime.startSessionReplay(options2);
}
function stopSessionReplay2() {
  runtime.stopSessionReplay();
}
function flushSessionReplay2(trigger) {
  return runtime.flushSessionReplay(trigger);
}
function getActiveReplayRingBuffer2() {
  return runtime.getActiveReplayRingBuffer();
}
var version2 = version;
function start() {
  runtime.start();
}
function stop() {
  runtime.stop();
}
function flush() {
  return runtime.flush();
}
function reset() {
  runtime.reset();
}
function options(newConfig) {
  return runtime.options(newConfig);
}
function log(customLog) {
  return runtime.log(customLog);
}
function lockPrivacy() {
  runtime.lockPrivacy();
}
function isPrivacyLocked() {
  return runtime.isPrivacyLocked();
}
export {
  HttpJsonExporter,
  OtelSdkExporter,
  OtlpJsonExporter,
  ProtoJsonExporter,
  RageClickDetector,
  ReplayRingBuffer,
  WebSocketExporter,
  addCallbacks2 as addCallbacks,
  buildHeaders,
  buildOtlpResourceAttributes,
  buildPath,
  createExporter,
  createUserAle,
  details,
  detectBrowser,
  flush,
  flushSessionReplay2 as flushSessionReplay,
  getActiveReplayRingBuffer2 as getActiveReplayRingBuffer,
  getSelector,
  getTargetRect,
  isPrivacyLocked,
  lockPrivacy,
  log,
  options,
  packageCustomLog2 as packageCustomLog,
  packageLog2 as packageLog,
  registerAuthCallback2 as registerAuthCallback,
  registerExporter2 as registerExporter,
  registerHeadersCallback2 as registerHeadersCallback,
  removeCallbacks2 as removeCallbacks,
  reset,
  resetAuthCallback2 as resetAuthCallback,
  resetHeadersCallback2 as resetHeadersCallback,
  resolveOtlpLogsEndpoint,
  start,
  startSessionReplay2 as startSessionReplay,
  started,
  stop,
  stopSessionReplay2 as stopSessionReplay,
  toOtlpAnyValue,
  toOtlpExportLogsServiceRequest,
  toOtlpLogRecord,
  toProtoLogBatch,
  toProtoUserALELog,
  toUnixNanoString,
  version2 as version
};
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
//# sourceMappingURL=manual.mjs.map
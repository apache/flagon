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
// package.json
var version = "2.4.0";

// src/getInitialSettings.ts
var sessionId = null;
var httpSessionId = null;
function getInitialSettings() {
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
  if (window.sessionStorage.getItem(sessionKey) === null) {
    window.sessionStorage.setItem(sessionKey, JSON.stringify(value));
    return value;
  }
  return JSON.parse(window.sessionStorage.getItem(sessionKey) || "");
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

// ../../node_modules/.pnpm/detect-browser@5.3.0/node_modules/detect-browser/es/index.js
var __spreadArray = function(to, from, pack) {
  if (pack || arguments.length === 2)
    for (var i = 0, l = from.length, ar; i < l; i++) {
      if (ar || !(i in from)) {
        if (!ar)
          ar = Array.prototype.slice.call(from, 0, i);
        ar[i] = from[i];
      }
    }
  return to.concat(ar || Array.prototype.slice.call(from));
};
var BrowserInfo = function() {
  function BrowserInfo2(name, version3, os) {
    this.name = name;
    this.version = version3;
    this.os = os;
    this.type = "browser";
  }
  return BrowserInfo2;
}();
var NodeInfo = function() {
  function NodeInfo2(version3) {
    this.version = version3;
    this.type = "node";
    this.name = "node";
    this.os = process.platform;
  }
  return NodeInfo2;
}();
var SearchBotDeviceInfo = function() {
  function SearchBotDeviceInfo2(name, version3, os, bot) {
    this.name = name;
    this.version = version3;
    this.os = os;
    this.bot = bot;
    this.type = "bot-device";
  }
  return SearchBotDeviceInfo2;
}();
var BotInfo = function() {
  function BotInfo2() {
    this.type = "bot";
    this.bot = true;
    this.name = "bot";
    this.version = null;
    this.os = null;
  }
  return BotInfo2;
}();
var ReactNativeInfo = function() {
  function ReactNativeInfo2() {
    this.type = "react-native";
    this.name = "react-native";
    this.version = null;
    this.os = null;
  }
  return ReactNativeInfo2;
}();
var SEARCHBOX_UA_REGEX = /alexa|bot|crawl(er|ing)|facebookexternalhit|feedburner|google web preview|nagios|postrank|pingdom|slurp|spider|yahoo!|yandex/;
var SEARCHBOT_OS_REGEX = /(nuhk|curl|Googlebot|Yammybot|Openbot|Slurp|MSNBot|Ask\ Jeeves\/Teoma|ia_archiver)/;
var REQUIRED_VERSION_PARTS = 3;
var userAgentRules = [
  ["aol", /AOLShield\/([0-9\._]+)/],
  ["edge", /Edge\/([0-9\._]+)/],
  ["edge-ios", /EdgiOS\/([0-9\._]+)/],
  ["yandexbrowser", /YaBrowser\/([0-9\._]+)/],
  ["kakaotalk", /KAKAOTALK\s([0-9\.]+)/],
  ["samsung", /SamsungBrowser\/([0-9\.]+)/],
  ["silk", /\bSilk\/([0-9._-]+)\b/],
  ["miui", /MiuiBrowser\/([0-9\.]+)$/],
  ["beaker", /BeakerBrowser\/([0-9\.]+)/],
  ["edge-chromium", /EdgA?\/([0-9\.]+)/],
  [
    "chromium-webview",
    /(?!Chrom.*OPR)wv\).*Chrom(?:e|ium)\/([0-9\.]+)(:?\s|$)/
  ],
  ["chrome", /(?!Chrom.*OPR)Chrom(?:e|ium)\/([0-9\.]+)(:?\s|$)/],
  ["phantomjs", /PhantomJS\/([0-9\.]+)(:?\s|$)/],
  ["crios", /CriOS\/([0-9\.]+)(:?\s|$)/],
  ["firefox", /Firefox\/([0-9\.]+)(?:\s|$)/],
  ["fxios", /FxiOS\/([0-9\.]+)/],
  ["opera-mini", /Opera Mini.*Version\/([0-9\.]+)/],
  ["opera", /Opera\/([0-9\.]+)(?:\s|$)/],
  ["opera", /OPR\/([0-9\.]+)(:?\s|$)/],
  ["pie", /^Microsoft Pocket Internet Explorer\/(\d+\.\d+)$/],
  ["pie", /^Mozilla\/\d\.\d+\s\(compatible;\s(?:MSP?IE|MSInternet Explorer) (\d+\.\d+);.*Windows CE.*\)$/],
  ["netfront", /^Mozilla\/\d\.\d+.*NetFront\/(\d.\d)/],
  ["ie", /Trident\/7\.0.*rv\:([0-9\.]+).*\).*Gecko$/],
  ["ie", /MSIE\s([0-9\.]+);.*Trident\/[4-7].0/],
  ["ie", /MSIE\s(7\.0)/],
  ["bb10", /BB10;\sTouch.*Version\/([0-9\.]+)/],
  ["android", /Android\s([0-9\.]+)/],
  ["ios", /Version\/([0-9\._]+).*Mobile.*Safari.*/],
  ["safari", /Version\/([0-9\._]+).*Safari/],
  ["facebook", /FB[AS]V\/([0-9\.]+)/],
  ["instagram", /Instagram\s([0-9\.]+)/],
  ["ios-webview", /AppleWebKit\/([0-9\.]+).*Mobile/],
  ["ios-webview", /AppleWebKit\/([0-9\.]+).*Gecko\)$/],
  ["curl", /^curl\/([0-9\.]+)$/],
  ["searchbot", SEARCHBOX_UA_REGEX]
];
var operatingSystemRules = [
  ["iOS", /iP(hone|od|ad)/],
  ["Android OS", /Android/],
  ["BlackBerry OS", /BlackBerry|BB10/],
  ["Windows Mobile", /IEMobile/],
  ["Amazon OS", /Kindle/],
  ["Windows 3.11", /Win16/],
  ["Windows 95", /(Windows 95)|(Win95)|(Windows_95)/],
  ["Windows 98", /(Windows 98)|(Win98)/],
  ["Windows 2000", /(Windows NT 5.0)|(Windows 2000)/],
  ["Windows XP", /(Windows NT 5.1)|(Windows XP)/],
  ["Windows Server 2003", /(Windows NT 5.2)/],
  ["Windows Vista", /(Windows NT 6.0)/],
  ["Windows 7", /(Windows NT 6.1)/],
  ["Windows 8", /(Windows NT 6.2)/],
  ["Windows 8.1", /(Windows NT 6.3)/],
  ["Windows 10", /(Windows NT 10.0)/],
  ["Windows ME", /Windows ME/],
  ["Windows CE", /Windows CE|WinCE|Microsoft Pocket Internet Explorer/],
  ["Open BSD", /OpenBSD/],
  ["Sun OS", /SunOS/],
  ["Chrome OS", /CrOS/],
  ["Linux", /(Linux)|(X11)/],
  ["Mac OS", /(Mac_PowerPC)|(Macintosh)/],
  ["QNX", /QNX/],
  ["BeOS", /BeOS/],
  ["OS/2", /OS\/2/]
];
function detect(userAgent) {
  if (!!userAgent) {
    return parseUserAgent(userAgent);
  }
  if (typeof document === "undefined" && typeof navigator !== "undefined" && navigator.product === "ReactNative") {
    return new ReactNativeInfo();
  }
  if (typeof navigator !== "undefined") {
    return parseUserAgent(navigator.userAgent);
  }
  return getNodeVersion();
}
function matchUserAgent(ua) {
  return ua !== "" && userAgentRules.reduce(function(matched, _a) {
    var browser = _a[0], regex = _a[1];
    if (matched) {
      return matched;
    }
    var uaMatch = regex.exec(ua);
    return !!uaMatch && [browser, uaMatch];
  }, false);
}
function parseUserAgent(ua) {
  var matchedRule = matchUserAgent(ua);
  if (!matchedRule) {
    return null;
  }
  var name = matchedRule[0], match = matchedRule[1];
  if (name === "searchbot") {
    return new BotInfo();
  }
  var versionParts = match[1] && match[1].split(".").join("_").split("_").slice(0, 3);
  if (versionParts) {
    if (versionParts.length < REQUIRED_VERSION_PARTS) {
      versionParts = __spreadArray(__spreadArray([], versionParts, true), createVersionParts(REQUIRED_VERSION_PARTS - versionParts.length), true);
    }
  } else {
    versionParts = [];
  }
  var version3 = versionParts.join(".");
  var os = detectOS(ua);
  var searchBotMatch = SEARCHBOT_OS_REGEX.exec(ua);
  if (searchBotMatch && searchBotMatch[1]) {
    return new SearchBotDeviceInfo(name, version3, os, searchBotMatch[1]);
  }
  return new BrowserInfo(name, version3, os);
}
function detectOS(ua) {
  for (var ii = 0, count = operatingSystemRules.length; ii < count; ii++) {
    var _a = operatingSystemRules[ii], os = _a[0], regex = _a[1];
    var match = regex.exec(ua);
    if (match) {
      return os;
    }
  }
  return null;
}
function getNodeVersion() {
  var isNode = typeof process !== "undefined" && process.version;
  return isNode ? new NodeInfo(process.version.slice(1)) : null;
}
function createVersionParts(count) {
  var output = [];
  for (var ii = 0; ii < count; ii++) {
    output.push("0");
  }
  return output;
}

// src/packageLogs.ts
var browserInfo = detect();
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
    pageUrl: window.location.href,
    pageTitle: document.title,
    pageReferrer: document.referrer,
    browser: detectBrowser(),
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
    pageUrl: window.location.href,
    pageTitle: document.title,
    pageReferrer: document.referrer,
    browser: detectBrowser(),
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
        pageUrl: window.location.href,
        pageTitle: document.title,
        pageReferrer: document.referrer,
        browser: detectBrowser(),
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
  return { width: window.innerWidth, height: window.innerHeight };
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
function detectBrowser() {
  return {
    browser: browserInfo ? browserInfo.name : "",
    version: browserInfo ? browserInfo.version : ""
  };
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
      } catch (error) {
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
        window.addEventListener(
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
      window.addEventListener(
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
  } catch (e) {
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

// src/sendLogs.ts
var sendIntervalId;
function initSender(logs3, config3) {
  if (sendIntervalId) {
    clearInterval(sendIntervalId);
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
  window.addEventListener("pagehide", function() {
    if (!config3.on) {
      return;
    }
    if (logs3.length > 0) {
      if (config3.websocketsEnabled) {
        const data = JSON.stringify(logs3);
        wsock.send(data);
      } else {
        const headers = new Headers();
        headers.set("Content-Type", "applicaiton/json;charset=UTF-8");
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
function sendLogs(logs3, config3, retries) {
  const data = JSON.stringify(logs3);
  if (config3.websocketsEnabled) {
    wsock.send(data);
  } else {
    const req = new XMLHttpRequest();
    req.open("POST", config3.url);
    updateAuthHeader(config3);
    if (config3.authHeader) {
      req.setRequestHeader(
        "Authorization",
        typeof config3.authHeader === "function" ? config3.authHeader() : config3.authHeader
      );
    }
    req.setRequestHeader("Content-type", "application/json;charset=UTF-8");
    updateCustomHeaders(config3);
    if (config3.headers) {
      Object.entries(config3.headers).forEach(([header, value]) => {
        req.setRequestHeader(header, value);
      });
    }
    req.onreadystatechange = function() {
      if (req.readyState === 4 && req.status !== 200) {
        if (retries > 0) {
          sendLogs(logs3, config3, retries--);
        }
      }
    };
    req.send(data);
  }
}

// src/main.ts
var config2 = Configuration.getInstance();
var logs2 = [];
var startLoadTimestamp = Date.now();
var endLoadTimestamp;
try {
  window.onload = function() {
    endLoadTimestamp = Date.now();
  };
} catch (error) {
  endLoadTimestamp = Date.now();
}
var started = false;
var wsock;
config2.update({
  useraleVersion: version
});
initPackager(logs2, config2);
getWebsocketsEnabled(config2);
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
        initSender(logs2, config3);
      }
      if (config3.autostart && (state === "interactive" || state === "complete")) {
        attachHandlers(config3);
        initSender(logs2, config3);
        started = config3.on = true;
        packageCustomLog(
          {
            type: "load",
            details: { pageLoadTime: endLoadTimestamp - startLoadTimestamp }
          },
          () => ({}),
          false
        );
      } else {
        setup(config3);
      }
    }, 100);
  }
}
function getWebsocketsEnabled(config3) {
  wsock = new WebSocket(config3.url.replace("http://", "ws://"));
  wsock.onerror = () => {
    console.log("no websockets detected");
  };
  wsock.onopen = () => {
    console.log("connection established with websockets");
    config3.websocketsEnabled = true;
  };
  wsock.onclose = () => {
    sendOnClose(logs2, config3);
  };
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
export {
  addCallbacks,
  buildPath,
  defineCustomDetails as details,
  getSelector,
  log,
  options,
  packageCustomLog,
  packageLog,
  registerAuthCallback,
  removeCallbacks,
  start,
  started,
  stop,
  version2 as version,
  wsock
};
//# sourceMappingURL=main.mjs.map
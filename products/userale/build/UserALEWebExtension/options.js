/*
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
var messageTypes;
(function (messageTypes) {
    messageTypes["CONFIG_CHANGE"] = "USERALE_CONFIG_CHANGE";
    messageTypes["ADD_LOG"] = "USERALE_ADD_LOG";
    messageTypes["HTTP_SESSION"] = "USERALE_HTTP_SESSION";
    messageTypes["ISSUE_REPORT"] = "USERALE_ISSUE_REPORT";
})(messageTypes || (messageTypes = {}));

var version = "2.4.0";

/*
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
let sessionId = null;
let httpSessionId = null;
/**
 * Extracts the initial configuration settings from the
 * currently executing script tag.
 * @return {Object} The extracted configuration object
 */
function getInitialSettings() {
    if (sessionId === null) {
        sessionId = getsessionId("userAlesessionId", "session_" + String(Date.now()));
    }
    if (httpSessionId === null) {
        httpSessionId = getsessionId("userAleHttpSessionId", generatehttpSessionId());
    }
    const script = document.currentScript ||
        (function () {
            const scripts = document.getElementsByTagName("script");
            return scripts[scripts.length - 1];
        })();
    const get = script
        ? script.getAttribute.bind(script)
        : function () {
            return null;
        };
    const headers = get("data-headers");
    const settings = {
        authHeader: get("data-auth") || null,
        autostart: get("data-autostart") === "false" ? false : true,
        browserSessionId: null,
        custIndex: get("data-index") || null,
        headers: headers ? JSON.parse(headers) : null,
        httpSessionId: httpSessionId,
        logCountThreshold: +(get("data-threshold") || 5),
        logDetails: get("data-log-details") === "true" ? true : false,
        resolution: +(get("data-resolution") || 500),
        sessionId: get("data-session") || sessionId,
        time: timeStampScale(document.createEvent("CustomEvent")),
        toolName: get("data-tool") || null,
        toolVersion: get("data-version") || null,
        transmitInterval: +(get("data-interval") || 5000),
        url: get("data-url") || "http://localhost:8000",
        useraleVersion: get("data-userale-version") || null,
        userFromParams: get("data-user-from-params") || null,
        userId: get("data-user") || null,
    };
    return settings;
}
/**
 * defines sessionId, stores it in sessionStorage, checks to see if there is a sessionId in
 * storage when script is started. This prevents events like 'submit', which refresh page data
 * from refreshing the current user session
 *
 */
function getsessionId(sessionKey, value) {
    if (window.sessionStorage.getItem(sessionKey) === null) {
        window.sessionStorage.setItem(sessionKey, JSON.stringify(value));
        return value;
    }
    return JSON.parse(window.sessionStorage.getItem(sessionKey) || "");
}
/**
 * Creates a function to normalize the timestamp of the provided event.
 * @param  {Event} e An event containing a timeStamp property.
 * @return {typeof timeStampScale~tsScaler}   The timestamp normalizing function.
 */
function timeStampScale(e) {
    let tsScaler;
    if (e.timeStamp && e.timeStamp > 0) {
        const delta = Date.now() - e.timeStamp;
        /**
         * Returns a timestamp depending on various browser quirks.
         * @param  {?Number} ts A timestamp to use for normalization.
         * @return {Number} A normalized timestamp.
         */
        if (delta < 0) {
            tsScaler = function () {
                return e.timeStamp / 1000;
            };
        }
        else if (delta > e.timeStamp) {
            const navStart = performance.timeOrigin;
            tsScaler = function (ts) {
                return ts + navStart;
            };
        }
        else {
            tsScaler = function (ts) {
                return ts;
            };
        }
    }
    else {
        tsScaler = function () {
            return Date.now();
        };
    }
    return tsScaler;
}
/**
 * Creates a cryptographiclly random string to represent this http session.
 * @return {String}   A random 32 digit hex string
 */
function generatehttpSessionId() {
    // 32 digit hex -> 128 bits of info -> 2^64 ~= 10^19 sessions needed for 50% chance of collison
    const len = 32;
    const arr = new Uint8Array(len / 2);
    window.crypto.getRandomValues(arr);
    return Array.from(arr, (dec) => {
        return dec.toString(16).padStart(2, "0");
    }).join("");
}

/*
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
// Singleton Configuration class
class Configuration {
    // Private constructor to prevent external instantiation
    constructor() {
        // Public properties corresponding to fields in the Config interface
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
        // Call the initialization method only if it's the first time instantiating
        if (Configuration.instance === null) {
            this.initialize();
        }
    }
    // Static method to get the singleton instance
    static getInstance() {
        if (Configuration.instance === null) {
            Configuration.instance = new Configuration();
        }
        return Configuration.instance;
    }
    initialize() {
        const settings = getInitialSettings();
        this.update(settings);
    }
    /**
     * Resets the configuration to its initial state.
     */
    reset() {
        this.initialize();
    }
    /**
     * Shallow merges a newConfig with the configuration class, updating it.
     * Retrieves/updates the userid if userFromParams is provided.
     * @param  {Partial<Settings.Config>} newConfig Configuration object to merge into the current config.
     */
    update(newConfig) {
        Object.keys(newConfig).forEach((option) => {
            if (option === "userFromParams") {
                const userParamString = newConfig[option];
                const userId = userParamString
                    ? Configuration.getUserIdFromParams(userParamString)
                    : null;
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
            if (newOption !== undefined) {
                this[option] = newOption;
            }
        });
    }
    /**
     * Attempts to extract the userid from the query parameters of the URL.
     * @param  {string} param The name of the query parameter containing the userid.
     * @return {string | null}       The extracted/decoded userid, or null if none is found.
     */
    static getUserIdFromParams(param) {
        const userField = param;
        const regex = new RegExp("[?&]" + userField + "(=([^&#]*)|&|#|$)");
        const results = window.location.href.match(regex);
        if (results && results[2]) {
            return decodeURIComponent(results[2].replace(/\+/g, " "));
        }
        return null;
    }
}
// Private static property to hold the singleton instance
Configuration.instance = null;

var __spreadArray = (undefined && undefined.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
var BrowserInfo = /** @class */ (function () {
    function BrowserInfo(name, version, os) {
        this.name = name;
        this.version = version;
        this.os = os;
        this.type = 'browser';
    }
    return BrowserInfo;
}());
var NodeInfo = /** @class */ (function () {
    function NodeInfo(version) {
        this.version = version;
        this.type = 'node';
        this.name = 'node';
        this.os = process.platform;
    }
    return NodeInfo;
}());
var SearchBotDeviceInfo = /** @class */ (function () {
    function SearchBotDeviceInfo(name, version, os, bot) {
        this.name = name;
        this.version = version;
        this.os = os;
        this.bot = bot;
        this.type = 'bot-device';
    }
    return SearchBotDeviceInfo;
}());
var BotInfo = /** @class */ (function () {
    function BotInfo() {
        this.type = 'bot';
        this.bot = true; // NOTE: deprecated test name instead
        this.name = 'bot';
        this.version = null;
        this.os = null;
    }
    return BotInfo;
}());
var ReactNativeInfo = /** @class */ (function () {
    function ReactNativeInfo() {
        this.type = 'react-native';
        this.name = 'react-native';
        this.version = null;
        this.os = null;
    }
    return ReactNativeInfo;
}());
// tslint:disable-next-line:max-line-length
var SEARCHBOX_UA_REGEX = /alexa|bot|crawl(er|ing)|facebookexternalhit|feedburner|google web preview|nagios|postrank|pingdom|slurp|spider|yahoo!|yandex/;
var SEARCHBOT_OS_REGEX = /(nuhk|curl|Googlebot|Yammybot|Openbot|Slurp|MSNBot|Ask\ Jeeves\/Teoma|ia_archiver)/;
var REQUIRED_VERSION_PARTS = 3;
var userAgentRules = [
    ['aol', /AOLShield\/([0-9\._]+)/],
    ['edge', /Edge\/([0-9\._]+)/],
    ['edge-ios', /EdgiOS\/([0-9\._]+)/],
    ['yandexbrowser', /YaBrowser\/([0-9\._]+)/],
    ['kakaotalk', /KAKAOTALK\s([0-9\.]+)/],
    ['samsung', /SamsungBrowser\/([0-9\.]+)/],
    ['silk', /\bSilk\/([0-9._-]+)\b/],
    ['miui', /MiuiBrowser\/([0-9\.]+)$/],
    ['beaker', /BeakerBrowser\/([0-9\.]+)/],
    ['edge-chromium', /EdgA?\/([0-9\.]+)/],
    [
        'chromium-webview',
        /(?!Chrom.*OPR)wv\).*Chrom(?:e|ium)\/([0-9\.]+)(:?\s|$)/,
    ],
    ['chrome', /(?!Chrom.*OPR)Chrom(?:e|ium)\/([0-9\.]+)(:?\s|$)/],
    ['phantomjs', /PhantomJS\/([0-9\.]+)(:?\s|$)/],
    ['crios', /CriOS\/([0-9\.]+)(:?\s|$)/],
    ['firefox', /Firefox\/([0-9\.]+)(?:\s|$)/],
    ['fxios', /FxiOS\/([0-9\.]+)/],
    ['opera-mini', /Opera Mini.*Version\/([0-9\.]+)/],
    ['opera', /Opera\/([0-9\.]+)(?:\s|$)/],
    ['opera', /OPR\/([0-9\.]+)(:?\s|$)/],
    ['pie', /^Microsoft Pocket Internet Explorer\/(\d+\.\d+)$/],
    ['pie', /^Mozilla\/\d\.\d+\s\(compatible;\s(?:MSP?IE|MSInternet Explorer) (\d+\.\d+);.*Windows CE.*\)$/],
    ['netfront', /^Mozilla\/\d\.\d+.*NetFront\/(\d.\d)/],
    ['ie', /Trident\/7\.0.*rv\:([0-9\.]+).*\).*Gecko$/],
    ['ie', /MSIE\s([0-9\.]+);.*Trident\/[4-7].0/],
    ['ie', /MSIE\s(7\.0)/],
    ['bb10', /BB10;\sTouch.*Version\/([0-9\.]+)/],
    ['android', /Android\s([0-9\.]+)/],
    ['ios', /Version\/([0-9\._]+).*Mobile.*Safari.*/],
    ['safari', /Version\/([0-9\._]+).*Safari/],
    ['facebook', /FB[AS]V\/([0-9\.]+)/],
    ['instagram', /Instagram\s([0-9\.]+)/],
    ['ios-webview', /AppleWebKit\/([0-9\.]+).*Mobile/],
    ['ios-webview', /AppleWebKit\/([0-9\.]+).*Gecko\)$/],
    ['curl', /^curl\/([0-9\.]+)$/],
    ['searchbot', SEARCHBOX_UA_REGEX],
];
var operatingSystemRules = [
    ['iOS', /iP(hone|od|ad)/],
    ['Android OS', /Android/],
    ['BlackBerry OS', /BlackBerry|BB10/],
    ['Windows Mobile', /IEMobile/],
    ['Amazon OS', /Kindle/],
    ['Windows 3.11', /Win16/],
    ['Windows 95', /(Windows 95)|(Win95)|(Windows_95)/],
    ['Windows 98', /(Windows 98)|(Win98)/],
    ['Windows 2000', /(Windows NT 5.0)|(Windows 2000)/],
    ['Windows XP', /(Windows NT 5.1)|(Windows XP)/],
    ['Windows Server 2003', /(Windows NT 5.2)/],
    ['Windows Vista', /(Windows NT 6.0)/],
    ['Windows 7', /(Windows NT 6.1)/],
    ['Windows 8', /(Windows NT 6.2)/],
    ['Windows 8.1', /(Windows NT 6.3)/],
    ['Windows 10', /(Windows NT 10.0)/],
    ['Windows ME', /Windows ME/],
    ['Windows CE', /Windows CE|WinCE|Microsoft Pocket Internet Explorer/],
    ['Open BSD', /OpenBSD/],
    ['Sun OS', /SunOS/],
    ['Chrome OS', /CrOS/],
    ['Linux', /(Linux)|(X11)/],
    ['Mac OS', /(Mac_PowerPC)|(Macintosh)/],
    ['QNX', /QNX/],
    ['BeOS', /BeOS/],
    ['OS/2', /OS\/2/],
];
function detect(userAgent) {
    if (typeof document === 'undefined' &&
        typeof navigator !== 'undefined' &&
        navigator.product === 'ReactNative') {
        return new ReactNativeInfo();
    }
    if (typeof navigator !== 'undefined') {
        return parseUserAgent(navigator.userAgent);
    }
    return getNodeVersion();
}
function matchUserAgent(ua) {
    // opted for using reduce here rather than Array#first with a regex.test call
    // this is primarily because using the reduce we only perform the regex
    // execution once rather than once for the test and for the exec again below
    // probably something that needs to be benchmarked though
    return (ua !== '' &&
        userAgentRules.reduce(function (matched, _a) {
            var browser = _a[0], regex = _a[1];
            if (matched) {
                return matched;
            }
            var uaMatch = regex.exec(ua);
            return !!uaMatch && [browser, uaMatch];
        }, false));
}
function parseUserAgent(ua) {
    var matchedRule = matchUserAgent(ua);
    if (!matchedRule) {
        return null;
    }
    var name = matchedRule[0], match = matchedRule[1];
    if (name === 'searchbot') {
        return new BotInfo();
    }
    // Do not use RegExp for split operation as some browser do not support it (See: http://blog.stevenlevithan.com/archives/cross-browser-split)
    var versionParts = match[1] && match[1].split('.').join('_').split('_').slice(0, 3);
    if (versionParts) {
        if (versionParts.length < REQUIRED_VERSION_PARTS) {
            versionParts = __spreadArray(__spreadArray([], versionParts, true), createVersionParts(REQUIRED_VERSION_PARTS - versionParts.length), true);
        }
    }
    else {
        versionParts = [];
    }
    var version = versionParts.join('.');
    var os = detectOS(ua);
    var searchBotMatch = SEARCHBOT_OS_REGEX.exec(ua);
    if (searchBotMatch && searchBotMatch[1]) {
        return new SearchBotDeviceInfo(name, version, os, searchBotMatch[1]);
    }
    return new BrowserInfo(name, version, os);
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
    var isNode = typeof process !== 'undefined' && process.version;
    return isNode ? new NodeInfo(process.version.slice(1)) : null;
}
function createVersionParts(count) {
    var output = [];
    for (var ii = 0; ii < count; ii++) {
        output.push('0');
    }
    return output;
}

/*
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
const browserInfo = detect();
let logs$1;
let config$1;
// Interval Logging Globals
let intervalId;
let intervalType;
let intervalPath;
let intervalTimer;
let intervalCounter;
let intervalLog;
const filterHandler = null;
const mapHandler = null;
let cbHandlers = {};
/**
 * Adds named callbacks to be executed when logging.
 * @param  {Object } newCallbacks An object containing named callback functions.
 */
function addCallbacks(...newCallbacks) {
    newCallbacks.forEach((source) => {
        let descriptors = {};
        descriptors = Object.keys(source).reduce((descriptors, key) => {
            descriptors[key] = Object.getOwnPropertyDescriptor(source, key);
            return descriptors;
        }, descriptors);
        Object.getOwnPropertySymbols(source).forEach((sym) => {
            const descriptor = Object.getOwnPropertyDescriptor(source, sym);
            if (descriptor === null || descriptor === void 0 ? void 0 : descriptor.enumerable) {
                descriptors[sym] = descriptor;
            }
        });
        Object.defineProperties(cbHandlers, descriptors);
    });
    return cbHandlers;
}
/**
 * Assigns the config and log container to be used by the logging functions.
 * @param  {Array<Logging.Log>} newLogs   Log container.
 * @param  {Object} newConfig Configuration to use while logging.
 */
function initPackager(newLogs, newConfig) {
    logs$1 = newLogs;
    config$1 = newConfig;
    cbHandlers = {};
    intervalId = null;
    intervalType = null;
    intervalPath = null;
    intervalTimer = null;
    intervalCounter = 0;
    intervalLog = null;
}
/**
 * Transforms the provided HTML event into a log and appends it to the log queue.
 * @param  {Event} e         The event to be logged.
 * @param  {Function} detailFcn The function to extract additional log parameters from the event.
 * @return {boolean}           Whether the event was logged.
 */
function packageLog(e, detailFcn) {
    if (!config$1.on) {
        return false;
    }
    let details = null;
    if (detailFcn) {
        details = detailFcn(e);
    }
    const timeFields = extractTimeFields(e.timeStamp && e.timeStamp > 0 ? config$1.time(e.timeStamp) : Date.now());
    let log = {
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
        details: details,
        userId: config$1.userId,
        toolVersion: config$1.toolVersion,
        toolName: config$1.toolName,
        useraleVersion: config$1.useraleVersion,
        sessionId: config$1.sessionId,
        httpSessionId: config$1.httpSessionId,
        browserSessionId: config$1.browserSessionId,
        attributes: buildAttrs(e),
        style: buildCSS(e),
    };
    for (const func of Object.values(cbHandlers)) {
        if (typeof func === "function") {
            log = func(log, e);
            if (!log) {
                return false;
            }
        }
    }
    logs$1.push(log);
    return true;
}
/**
 * Packages the provided customLog to include standard meta data and appends it to the log queue.
 * @param  {Logging.CustomLog} customLog        The behavior to be logged.
 * @param  {Logging.DynamicDetailFunction} detailFcn     The function to extract additional log parameters from the event.
 * @param  {boolean} userAction     Indicates user behavior (true) or system behavior (false)
 * @return {boolean}           Whether the event was logged.
 */
function packageCustomLog(customLog, detailFcn, userAction) {
    if (!config$1.on) {
        return false;
    }
    let details = null;
    if (detailFcn.length === 0) {
        // In the case of a union, the type checker will default to the more stringent
        // type, i.e. the DetailFunction that expects an argument for safety purposes.
        // To avoid this, we must explicitly check the type by asserting it receives
        // no arguments (detailFcn.length === 0) and then cast it to the
        // StaticDetailFunction type.
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
        userAction: userAction,
        details: details,
        userId: config$1.userId,
        toolVersion: config$1.toolVersion,
        toolName: config$1.toolName,
        useraleVersion: config$1.useraleVersion,
        sessionId: config$1.sessionId,
        httpSessionId: config$1.httpSessionId,
        browserSessionId: config$1.browserSessionId,
    };
    let log = Object.assign(metaData, customLog);
    for (const func of Object.values(cbHandlers)) {
        if (typeof func === "function") {
            log = func(log, null);
            if (!log) {
                return false;
            }
        }
    }
    logs$1.push(log);
    return true;
}
/**
 * Extract the millisecond and microsecond portions of a timestamp.
 * @param  {Number} timeStamp The timestamp to split into millisecond and microsecond fields.
 * @return {Object}           An object containing the millisecond
 *                            and microsecond portions of the timestamp.
 */
function extractTimeFields(timeStamp) {
    return {
        milli: Math.floor(timeStamp),
        micro: Number((timeStamp % 1).toFixed(3)),
    };
}
/**
 * Track intervals and gather details about it.
 * @param {Object} e
 * @return boolean
 */
function packageIntervalLog(e) {
    try {
        const target = e.target ? getSelector(e.target) : null;
        const path = buildPath(e);
        const type = e.type;
        const timestamp = Math.floor(e.timeStamp && e.timeStamp > 0 ? config$1.time(e.timeStamp) : Date.now());
        // Init - this should only happen once on initialization
        if (intervalId == null) {
            intervalId = target;
            intervalType = type;
            intervalPath = path;
            intervalTimer = timestamp;
            intervalCounter = 0;
        }
        if ((intervalId !== target || intervalType !== type) && intervalTimer) {
            // When to create log? On transition end
            // @todo Possible for intervalLog to not be pushed in the event the interval never ends...
            intervalLog = {
                target: intervalId,
                path: intervalPath,
                pageUrl: window.location.href,
                pageTitle: document.title,
                pageReferrer: document.referrer,
                browser: detectBrowser(),
                count: intervalCounter,
                duration: timestamp - intervalTimer, // microseconds
                startTime: intervalTimer,
                endTime: timestamp,
                type: intervalType,
                logType: "interval",
                targetChange: intervalId !== target,
                typeChange: intervalType !== type,
                userAction: false,
                userId: config$1.userId,
                toolVersion: config$1.toolVersion,
                toolName: config$1.toolName,
                useraleVersion: config$1.useraleVersion,
                sessionId: config$1.sessionId,
                httpSessionId: config$1.httpSessionId,
                browserSessionId: config$1.browserSessionId,
            };
            if (typeof filterHandler === "function" && !filterHandler(intervalLog)) ;
            if (typeof mapHandler === "function") ;
            for (const func of Object.values(cbHandlers)) {
                if (typeof func === "function") {
                    intervalLog = func(intervalLog, null);
                    if (!intervalLog) {
                        return false;
                    }
                }
            }
            if (intervalLog)
                logs$1.push(intervalLog);
            // Reset
            intervalId = target;
            intervalType = type;
            intervalPath = path;
            intervalTimer = timestamp;
            intervalCounter = 0;
        }
        // Interval is still occuring, just update counter
        if (intervalId == target && intervalType == type && intervalCounter) {
            intervalCounter = intervalCounter + 1;
        }
        return true;
    }
    catch (_a) {
        return false;
    }
}
/**
 * Extracts coordinate information from the event
 * depending on a few browser quirks.
 * @param  {Event} e The event to extract coordinate information from.
 * @return {Object}   An object containing nullable x and y coordinates for the event.
 */
function getLocation(e) {
    if (e instanceof MouseEvent) {
        if (e.pageX != null) {
            return { x: e.pageX, y: e.pageY };
        }
        else if (e.clientX != null) {
            return {
                x: document.documentElement.scrollLeft + e.clientX,
                y: document.documentElement.scrollTop + e.clientY,
            };
        }
    }
    else {
        return { x: null, y: null };
    }
}
/**
 * Extracts innerWidth and innerHeight to provide estimates of screen resolution
 * @return {Object} An object containing the innerWidth and InnerHeight
 */
function getScreenRes() {
    return { width: window.innerWidth, height: window.innerHeight };
}
/**
 * Builds a string CSS selector from the provided element
 * @param  {EventTarget} ele The element from which the selector is built.
 * @return {string}     The CSS selector for the element, or Unknown if it can't be determined.
 */
function getSelector(ele) {
    if (ele instanceof HTMLElement || ele instanceof Element) {
        if (ele.localName) {
            return (ele.localName +
                (ele.id ? "#" + ele.id : "") +
                (ele.className ? "." + ele.className : ""));
        }
        else if (ele.nodeName) {
            return (ele.nodeName +
                (ele.id ? "#" + ele.id : "") +
                (ele.className ? "." + ele.className : ""));
        }
    }
    else if (ele instanceof Document) {
        return "#document";
    }
    else if (ele === globalThis) {
        return "Window";
    }
    return "Unknown";
}
/**
 * Builds an array of elements from the provided event target, to the root element.
 * @param  {Event} e Event from which the path should be built.
 * @return {HTMLElement[]}   Array of elements, starting at the event target, ending at the root element.
 */
function buildPath(e) {
    const path = e.composedPath();
    return selectorizePath(path);
}
/**
 * Builds a CSS selector path from the provided list of elements.
 * @param  {EventTarget[]} path Array of HTML Elements from which the path should be built.
 * @return {string[]}      Array of string CSS selectors.
 */
function selectorizePath(path) {
    let i = 0;
    let pathEle;
    const pathSelectors = [];
    while ((pathEle = path[i])) {
        pathSelectors.push(getSelector(pathEle));
        ++i;
        pathEle = path[i];
    }
    return pathSelectors;
}
function detectBrowser() {
    return {
        browser: browserInfo ? browserInfo.name : "",
        version: browserInfo ? browserInfo.version : "",
    };
}
/**
 * Builds an object containing attributes of an element.
 * Attempts to parse all attribute values as JSON text.
 * @param  {Event} e Event from which the target element's attributes should be extracted.
 * @return {Record<string, any>} Object with element attributes as key-value pairs.
 */
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
            }
            catch (error) {
                // Ignore parsing errors, fallback to raw string value
            }
            attributes[attr.name] = val;
        }
    }
    return attributes;
}
/**
 * Builds an object containing all CSS properties of an element.
 * @param  {Event} e Event from which the target element's properties should be extracted.
 * @return {Record<string, string>} Object with all CSS properties as key-value pairs.
 */
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

/*
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
//@todo: Investigate drag events and their behavior
let events;
let bufferBools;
let bufferedEvents;
let refreshEvents;
const intervalEvents = [
    "click",
    "focus",
    "blur",
    "input",
    "change",
    "mouseover",
    "submit",
];
const windowEvents = ["load", "blur", "focus"];
/**
 * Maps a MouseEvent to an object containing useful information.
 * @param  {MouseEvent} e Event to extract data from
 */
function extractMouseDetails(e) {
    return {
        clicks: e.detail,
        ctrl: e.ctrlKey,
        alt: e.altKey,
        shift: e.shiftKey,
        meta: e.metaKey,
        //    'text' : e.target.innerHTML
    };
}
/** Maps a KeyboardEvent to an object containing useful infromation
 * @param {KeyboardEvent} e Event to extract data from
 */
function extractKeyboardDetails(e) {
    return {
        key: e.key,
        code: e.code,
        ctrl: e.ctrlKey,
        alt: e.altKey,
        shift: e.shiftKey,
        meta: e.metaKey,
    };
}
/**
 * Maps a ChangeEvent to an object containing useful information.
 * @param  {Events.ChangeEvent} e Event to extract data from
 */
function extractChangeDetails(e) {
    return {
        value: e.target.value,
    };
}
/**
 * Maps a WheelEvent to an object containing useful information.
 * @param  {WheelEvent} e Event to extract data from
 */
function extractWheelDetails(e) {
    return {
        x: e.deltaX,
        y: e.deltaY,
        z: e.deltaZ,
    };
}
/**
 * Maps a ScrollEvent to an object containing useful information.
 */
function extractScrollDetails() {
    return {
        x: window.scrollX,
        y: window.scrollY,
    };
}
/**
 * Maps a ResizeEvent to an object containing useful information.
 */
function extractResizeDetails() {
    return {
        width: window.outerWidth,
        height: window.outerHeight,
    };
}
/**
 * Defines the way information is extracted from various events.
 * Also defines which events we will listen to.
 * @param  {Settings.Config} config Configuration object to read from.
 */
function defineDetails(config) {
    // Events list
    // Keys are event types
    // Values are functions that return details object if applicable
    events = {
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
        mouseover: null,
    };
    bufferBools = {};
    bufferedEvents = {
        wheel: extractWheelDetails,
        scroll: extractScrollDetails,
        resize: extractResizeDetails,
    };
    refreshEvents = {
        submit: null,
    };
}
/**
 * Hooks the event handlers for each event type of interest.
 * @param  {Configuration} config Configuration singleton to use.
 * @return {boolean}        Whether the operation succeeded
 */
function attachHandlers(config) {
    try {
        defineDetails(config);
        Object.keys(events).forEach(function (ev) {
            document.addEventListener(ev, function (e) {
                packageLog(e, events[ev]);
            }, true);
        });
        intervalEvents.forEach(function (ev) {
            document.addEventListener(ev, function (e) {
                packageIntervalLog(e);
            }, true);
        });
        Object.keys(bufferedEvents).forEach(function (ev) {
            bufferBools[ev] = true;
            window.addEventListener(ev, function (e) {
                if (bufferBools[ev]) {
                    bufferBools[ev] = false;
                    packageLog(e, bufferedEvents[ev]);
                    setTimeout(function () {
                        bufferBools[ev] = true;
                    }, config.resolution);
                }
            }, true);
        });
        Object.keys(refreshEvents).forEach(function (ev) {
            document.addEventListener(ev, function (e) {
                packageLog(e, events[ev]);
            }, true);
        });
        windowEvents.forEach(function (ev) {
            window.addEventListener(ev, function (e) {
                packageLog(e, function () {
                    return { window: true };
                });
            }, true);
        });
        return true;
    }
    catch (_a) {
        return false;
    }
}

/*
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
let sendIntervalId;
/**
 * Initializes the log queue processors.
 * @param  {Array<Logging.Log>} logs   Array of logs to append to.
 * @param  {Configuration} config Configuration object to use when logging.
 */
function initSender(logs, config) {
    if (sendIntervalId) {
        clearInterval(sendIntervalId);
    }
    sendIntervalId = sendOnInterval(logs, config);
    sendOnClose(logs, config);
}
/**
 * Checks the provided log array on an interval, flushing the logs
 * if the queue has reached the threshold specified by the provided config.
 * @param  {Array<Logging.Log>} logs   Array of logs to read from.
 * @param  {Configuration} config Configuration singleton to be read from.
 * @return {Number}        The newly created interval id.
 */
function sendOnInterval(logs, config) {
    return setInterval(function () {
        if (!config.on) {
            return;
        }
        if (logs.length >= config.logCountThreshold) {
            sendLogs(logs.slice(0), config); // Send a copy
            logs.splice(0); // Clear array reference (no reassignment)
        }
    }, config.transmitInterval);
}
/**
 * Attempts to flush the remaining logs when the window is closed.
 * @param  {Array<Logging.Log>} logs   Array of logs to be flushed.
 * @param  {Configuration} config Configuration singleton to be read from.
 */
function sendOnClose(logs, config) {
    window.addEventListener("pagehide", function () {
        if (!config.on) {
            return;
        }
        if (logs.length > 0) {
            if (config.websocketsEnabled) {
                const data = JSON.stringify(logs);
                wsock.send(data);
            }
            else {
                const headers = new Headers();
                headers.set("Content-Type", "applicaiton/json;charset=UTF-8");
                if (config.authHeader) {
                    headers.set("Authorization", config.authHeader.toString());
                }
                fetch(config.url, {
                    keepalive: true,
                    method: "POST",
                    headers: headers,
                    body: JSON.stringify(logs),
                }).catch((error) => {
                    console.error(error);
                });
            }
            logs.splice(0); // clear log queue
        }
    });
}
/**
 * Sends the provided array of logs to the specified url,
 * retrying the request up to the specified number of retries.
 * @param  {Array<Logging.Log>} logs    Array of logs to send.
 * @param  {Configuration} config     configuration singleton.
 * @param  {Number} retries Maximum number of attempts to send the logs.
 */
// @todo expose config object to sendLogs replate url with config.url
function sendLogs(logs, config, retries) {
    const data = JSON.stringify(logs);
    if (config.websocketsEnabled) {
        wsock.send(data);
    }
    else {
        const req = new XMLHttpRequest();
        req.open("POST", config.url);
        if (config.authHeader) {
            req.setRequestHeader("Authorization", typeof config.authHeader === "function"
                ? config.authHeader()
                : config.authHeader);
        }
        req.setRequestHeader("Content-type", "application/json;charset=UTF-8");
        if (config.headers) {
            Object.entries(config.headers).forEach(([header, value]) => {
                req.setRequestHeader(header, value);
            });
        }
        req.onreadystatechange = function () {
            if (req.readyState === 4 && req.status !== 200) ;
        };
        req.send(data);
    }
}

/*
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
const config = Configuration.getInstance();
const logs = [];
const startLoadTimestamp = Date.now();
let endLoadTimestamp;
window.onload = function () {
    endLoadTimestamp = Date.now();
};
let started = false;
let wsock;
config.update({
    useraleVersion: version,
});
initPackager(logs, config);
getWebsocketsEnabled(config);
if (config.autostart) {
    setup(config);
}
/**
 * Hooks the global event listener, and starts up the
 * logging interval.
 * @param  {Configuration} config Configuration settings for the logger
 */
function setup(config) {
    if (!started) {
        setTimeout(function () {
            const state = document.readyState;
            if (config.autostart &&
                (state === "interactive" || state === "complete")) {
                attachHandlers(config);
                initSender(logs, config);
                started = config.on = true;
                packageCustomLog({
                    type: "load",
                    details: { pageLoadTime: endLoadTimestamp - startLoadTimestamp },
                }, () => ({}), false);
            }
            else {
                setup(config);
            }
        }, 100);
    }
}
/**
 * Checks to see if the specified backend URL supporsts Websockets
 * and updates the config accordingly
 */
function getWebsocketsEnabled(config) {
    wsock = new WebSocket(config.url.replace("http://", "ws://"));
    wsock.onerror = () => {
        console.log("no websockets detected");
    };
    wsock.onopen = () => {
        console.log("connection established with websockets");
        config.websocketsEnabled = true;
    };
    wsock.onclose = () => {
        sendOnClose(logs, config);
    };
}
/**
 * Updates the current configuration
 * object with the provided values.
 * @param  {Partial<Settings.Config>} newConfig The configuration options to use.
 * @return {Settings.Config}           Returns the updated configuration.
 */
function options(newConfig) {
    if (newConfig) {
        config.update(newConfig);
    }
    return config;
}

/*
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
/* eslint-disable */
// browser is defined in firefox, but chrome uses the 'chrome' global.
var browser = window.browser || chrome;
const configKey = "useraleConfigPayload";
function rerouteLog(log) {
    browser.runtime.sendMessage({ type: messageTypes.ADD_LOG, payload: log });
    return false;
}
/* eslint-enable */

/*
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
addCallbacks({ rerouteLog });
// TODO: Warn users when setting credentials with unsecured connection.
// const mitmWarning =
//   "Setting credentials with http will expose you to a MITM attack. Are you sure you want to continue?";
function setConfig() {
    const config = Configuration.getInstance();
    config.update({
        url: document.getElementById("url").value,
        userId: document.getElementById("user").value,
        toolName: document.getElementById("tool").value,
        toolVersion: document.getElementById("toolVersion")
            .value,
    });
    // Set a basic auth header if given credentials.
    const password = document.getElementById("password")
        .value;
    if (config.userId && password) {
        config.update({
            authHeader: "Basic " + btoa(`${config.userId}:${password}`),
        });
    }
    const payload = {
        useraleConfig: config,
        pluginConfig: {
            urlWhitelist: document.getElementById("filter")
                .value,
        },
    };
    options(config);
    browser.runtime.sendMessage({ type: messageTypes.CONFIG_CHANGE, payload });
}
function getConfig() {
    // @ts-expect-error Typescript is not aware that firefox's broswer is overloaded
    // to support chromium style MV2 callbacks
    browser.storage.local.get([configKey], (res) => {
        const payload = res[configKey];
        const config = payload.useraleConfig;
        options(config);
        document.getElementById("url").value = config.url;
        document.getElementById("user").value =
            config.userId;
        document.getElementById("tool").value =
            config.toolName;
        document.getElementById("toolVersion").value =
            config.toolVersion;
        document.getElementById("filter").value =
            payload.pluginConfig.urlWhitelist;
    });
    document.getElementById("optionsForm").addEventListener("submit", setConfig);
    const issueForm = document.getElementById("issueForm");
    if (issueForm instanceof HTMLElement) {
        issueForm.addEventListener("submit", reportIssue);
    }
}
function reportIssue() {
    browser.runtime.sendMessage({
        type: messageTypes.ISSUE_REPORT,
        payload: {
            details: {
                issueType: document.querySelector('input[name="issueType"]:checked').value,
                issueDescription: document.getElementById("issueDescription").value,
            },
            type: "issue",
        },
    });
}
document.addEventListener("DOMContentLoaded", getConfig);
browser.runtime.onMessage.addListener(function (message, sender) {
    if (message.type === messageTypes.ISSUE_REPORT) {
        if (window.top === window) {
            packageCustomLog(message.payload, () => {
                return {};
            }, true);
        }
    }
});

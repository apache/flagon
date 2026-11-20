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

import { Callbacks, Logging, type Settings } from "@/types";
import { Configuration } from "@/configure";
import {
  isDocumentNode,
  isElementNode,
  safeComposedPath,
  safeGetAttribute,
  safeGetAttributes,
  safeGetClassName,
  safeGetId,
  safeGetLocalName,
  safeGetStyle,
} from "@/domUtils";
import {
  enforcePrivacyOnLog,
  evaluateEventPrivacyFilter,
  isPrivacySensitiveAttribute,
  safeReadPageReferrer,
  safeReadPageTitle,
  safeReadPageUrl,
  safeReadUserAgent,
} from "@/privacy";

export interface PackagerController {
  packageLog: (
    e: Event,
    detailFcn?: Logging.DynamicDetailFunction | null,
  ) => boolean;
  packageCustomLog: (
    customLog: Logging.CustomLog,
    detailFcn: Logging.DynamicDetailFunction | Logging.StaticDetailFunction,
    userAction: boolean,
  ) => boolean;
  packageIntervalLog: (e: Event) => boolean;
  addCallbacks: (
    ...newCallbacks: Record<symbol | string, CallableFunction>[]
  ) => Callbacks.CallbackMap;
  removeCallbacks: (targetKeys: string[]) => void;
  enqueueLog: (logEntry: Logging.Log) => void;
  resetIntervalState: () => void;
  log: (customLog?: Logging.CustomLog | null) => boolean;
}

const FORBIDDEN_KEYS = new Set(["__proto__", "constructor", "prototype"]);

function mergeSafeCustomFields(
  target: Record<string, unknown>,
  source: Logging.CustomLog,
): Logging.Log {
  for (const [key, val] of Object.entries(source)) {
    if (!FORBIDDEN_KEYS.has(key) && val !== undefined) {
      target[key] = val;
    }
  }
  return target as Logging.Log;
}

/**
 * Creates an encapsulated log packager and callback registry bound to the
 * provided log buffer and Configuration instance.
 */
export function createPackager(
  targetLogs: Array<Logging.Log>,
  targetConfig: Configuration,
  onCallbackRegistryUpdate?: (next: Callbacks.CallbackMap) => void,
): PackagerController {
  let intervalId: string | null = null;
  let intervalType: string | null = null;
  let intervalPath: string[] | null = null;
  let intervalTimer: number | null = null;
  let intervalCounter: number | null = 0;
  let intervalLog: Logging.Log | null = null;
  const cbMap: Callbacks.CallbackMap = {};

  const resetIntervalState = (): void => {
    intervalId = null;
    intervalType = null;
    intervalPath = null;
    intervalTimer = null;
    intervalCounter = 0;
    intervalLog = null;
  };

  const addCallbacks = (
    ...newCallbacks: Record<symbol | string, CallableFunction>[]
  ): Callbacks.CallbackMap => {
    if (targetConfig.isPrivacyLocked()) {
      return {};
    }
    newCallbacks.forEach((source) => {
      if (!source || typeof source !== "object") {
        return;
      }
      const descriptors: Record<string | symbol, PropertyDescriptor> = {};
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

  const removeCallbacks = (targetKeys: string[]): void => {
    targetKeys.forEach((key) => {
      if (Object.prototype.hasOwnProperty.call(cbMap, key)) {
        delete cbMap[key];
      }
    });
    onCallbackRegistryUpdate?.(cbMap);
  };

  const enqueueLog = (logEntry: Logging.Log): void => {
    const cap =
      typeof targetConfig?.maxQueueSize === "number" &&
      targetConfig.maxQueueSize > 0
        ? targetConfig.maxQueueSize
        : 10000;
    if (targetLogs.length >= cap) {
      targetLogs.splice(0, targetLogs.length - cap + 1);
    }
    targetLogs.push(logEntry);
  };

  const packageLog = (
    e: Event,
    detailFcn?: Logging.DynamicDetailFunction | null,
  ): boolean => {
    if (!targetConfig.on) {
      return false;
    }

    const privacy = targetConfig.getResolvedPrivacy();
    const filterResult = evaluateEventPrivacyFilter(
      e,
      privacy,
      targetConfig.isAllowlistSelectorInvalid(),
    );
    if (!filterResult.allowed) {
      return false;
    }

    const details = privacy.captureDetails && detailFcn ? detailFcn(e) : null;

    const timeFields = extractTimeFields(
      e.timeStamp && e.timeStamp > 0
        ? targetConfig.time(e.timeStamp)
        : Date.now(),
    );

    const rawTarget = e.target
      ? getSelector(e.target, privacy.domSelectorMode)
      : privacy.domSelectorMode === "none"
        ? ""
        : null;

    let log: Logging.Log = {
      target: rawTarget,
      path: buildPath(e, privacy.domSelectorMode),
      pageUrl: safeReadPageUrl(privacy),
      pageTitle: safeReadPageTitle(privacy),
      pageReferrer: safeReadPageReferrer(privacy),
      browser: privacy.captureUserAgent
        ? detectBrowser()
        : { browser: null, version: null },
      userAgent: safeReadUserAgent(privacy),
      clientTime: timeFields.milli,
      microTime: privacy.captureMicroTime ? timeFields.micro : null,
      location: privacy.captureLocation ? getLocation(e) : null,
      scrnRes: privacy.captureScreenRes ? getScreenRes() : null,
      type: e.type,
      logType: "raw",
      userAction: true,
      details: details,
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
        privacy.allowedAttributes,
      ),
      style: privacy.allowedAttributes !== null ? {} : buildCSS(e),
    };

    if (
      privacy.captureTargetRect &&
      DISCRETE_RECT_EVENTS.has(e.type) &&
      e.target
    ) {
      const rect = getTargetRect(e.target);
      if (
        rect &&
        (rect.width > 0 || rect.height > 0 || rect.x !== 0 || rect.y !== 0)
      ) {
        log.targetRect = rect as unknown as Logging.JSONObject;
      }
    }

    if (typeof filterHandler === "function" && !filterHandler(log)) {
      return false;
    }

    const redactEventInCallback =
      targetConfig.isPrivacyLocked() ||
      privacy.preset === "strict" ||
      privacy.domSelectorMode === "none" ||
      !privacy.captureDetails;
    const cbEventArg = redactEventInCallback ? null : e;

    if (typeof mapHandler === "function") {
      log = mapHandler(log, cbEventArg);
    }

    for (const func of Object.values(cbMap)) {
      if (typeof func === "function") {
        log = func(log, cbEventArg);
        if (!log) {
          return false;
        }
      }
    }

    log = enforcePrivacyOnLog(log, privacy, { isPackaged: true });
    enqueueLog(log);
    return true;
  };

  const packageCustomLog = (
    customLog: Logging.CustomLog,
    detailFcn: Logging.DynamicDetailFunction | Logging.StaticDetailFunction,
    userAction: boolean,
  ): boolean => {
    if (!targetConfig.on) {
      return false;
    }

    const privacy = targetConfig.getResolvedPrivacy();
    let details = null;
    if (privacy.captureDetails && typeof detailFcn === "function") {
      details = (detailFcn as () => Logging.JSONObject | null)();
    }

    const metaData: Record<string, unknown> = {
      pageUrl: safeReadPageUrl(privacy),
      pageTitle: safeReadPageTitle(privacy),
      pageReferrer: safeReadPageReferrer(privacy),
      browser: privacy.captureUserAgent
        ? detectBrowser()
        : { browser: null, version: null },
      userAgent: safeReadUserAgent(privacy),
      clientTime: Date.now(),
      scrnRes: privacy.captureScreenRes ? getScreenRes() : null,
      logType: "custom",
      userAction: userAction,
      details: details,
      userId: targetConfig.userId,
      toolVersion: targetConfig.toolVersion,
      toolName: targetConfig.toolName,
      useraleVersion: targetConfig.useraleVersion,
      sessionId: targetConfig.sessionId,
      httpSessionId: targetConfig.httpSessionId,
      browserSessionId: targetConfig.browserSessionId,
    };

    let log = mergeSafeCustomFields(metaData, customLog);

    if (typeof filterHandler === "function" && !filterHandler(log)) {
      return false;
    }

    if (typeof mapHandler === "function") {
      log = mapHandler(log);
    }

    for (const func of Object.values(cbMap)) {
      if (typeof func === "function") {
        log = func(log, null);
        if (!log) {
          return false;
        }
      }
    }

    log = enforcePrivacyOnLog(log, privacy, { isPackaged: true });
    enqueueLog(log);
    return true;
  };

  const packageIntervalLog = (e: Event): boolean => {
    try {
      if (!targetConfig || !targetConfig.on) {
        return false;
      }

      const privacy = targetConfig.getResolvedPrivacy();
      const filterResult = evaluateEventPrivacyFilter(
        e,
        privacy,
        targetConfig.isAllowlistSelectorInvalid(),
      );
      if (!filterResult.allowed) {
        return false;
      }

      const target = e.target
        ? getSelector(e.target, privacy.domSelectorMode)
        : privacy.domSelectorMode === "none"
          ? ""
          : null;
      const path = buildPath(e, privacy.domSelectorMode);
      const type = e.type;
      const timestamp = Math.floor(
        e.timeStamp && e.timeStamp > 0
          ? targetConfig.time(e.timeStamp)
          : Date.now(),
      );

      // Init - this should only happen once on initialization
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
            browser: privacy.captureUserAgent
              ? detectBrowser()
              : { browser: null, version: null },
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
            browserSessionId: targetConfig.browserSessionId,
          };

          if (
            typeof filterHandler === "function" &&
            !filterHandler(intervalLog)
          ) {
            dropped = true;
          }

          if (!dropped) {
            const redactEventInCallback =
              targetConfig.isPrivacyLocked() ||
              privacy.preset === "strict" ||
              privacy.domSelectorMode === "none" ||
              !privacy.captureDetails;
            if (typeof mapHandler === "function") {
              intervalLog = mapHandler(
                intervalLog,
                redactEventInCallback ? null : e,
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
              isPackaged: true,
            });
            enqueueLog(intervalLog);
          }
        } finally {
          // Always reset interval state for the new target/type even if filtered
          intervalId = target;
          intervalType = type;
          intervalPath = path;
          intervalTimer = timestamp;
          intervalCounter = 0;
        }
      }

      if (
        intervalId == target &&
        intervalType == type &&
        intervalCounter !== null
      ) {
        intervalCounter = intervalCounter + 1;
      }

      return !dropped;
    } catch {
      return false;
    }
  };

  const log = (customLog?: Logging.CustomLog | null): boolean => {
    if (
      !customLog ||
      typeof customLog !== "object" ||
      Array.isArray(customLog)
    ) {
      return false;
    }
    const cloned = mergeSafeCustomFields({}, customLog);
    const enforced = enforcePrivacyOnLog(
      cloned,
      targetConfig.getResolvedPrivacy(),
      { isPackaged: false },
    );
    enqueueLog(enforced);
    return true;
  };

  return {
    packageLog,
    packageCustomLog,
    packageIntervalLog,
    addCallbacks,
    removeCallbacks,
    enqueueLog,
    resetIntervalState,
    log,
  };
}

export let logs: Array<Logging.Log> = [];
export const filterHandler: CallableFunction | null = null;
export const mapHandler: CallableFunction | null = null;
export let cbHandlers: Callbacks.CallbackMap = {};

let legacyPackager: PackagerController = createPackager(
  logs,
  Configuration.createUninitialized(),
  (next) => {
    cbHandlers = next;
  },
);

export function addCallbacks(
  ...newCallbacks: Record<symbol | string, CallableFunction>[]
) {
  return legacyPackager.addCallbacks(...newCallbacks);
}

export function removeCallbacks(targetKeys: string[]) {
  legacyPackager.removeCallbacks(targetKeys);
}

export function enqueueLog(logEntry: Logging.Log): void {
  legacyPackager.enqueueLog(logEntry);
}

export function resetIntervalState(): void {
  legacyPackager.resetIntervalState();
}

export function initPackager(
  newLogs: Array<Logging.Log>,
  newConfig: Configuration,
) {
  logs = newLogs;
  cbHandlers = {};
  legacyPackager = createPackager(newLogs, newConfig, (next) => {
    cbHandlers = next;
  });
}

/**
 * Zero-dependency browser metadata detection (#108).
 * Uses User-Agent Client Hints (navigator.userAgentData) when available,
 * falling back to lightweight User-Agent string parsing.
 */
export function detectBrowser(): {
  browser: string | null;
  version: string | null;
} {
  try {
    const nav = typeof self !== "undefined" ? (self.navigator as any) : null;
    if (!nav) {
      return { browser: null, version: null };
    }
    const brands: Array<{ brand: string; version: string }> | undefined =
      nav.userAgentData?.brands;
    if (Array.isArray(brands) && brands.length > 0) {
      const meaningful =
        brands.find(
          (b) => b.brand && !/not.?a.?brand|chromium/i.test(b.brand),
        ) ?? brands[0];
      if (meaningful?.brand) {
        return {
          browser: meaningful.brand.toLowerCase(),
          version: meaningful.version || null,
        };
      }
    }
    const ua: string = typeof nav.userAgent === "string" ? nav.userAgent : "";
    if (!ua) {
      return { browser: null, version: null };
    }
    const rules: Array<[string, RegExp]> = [
      ["edge", /Edg(?:e|A|iOS)?\/([\d.]+)/],
      ["opera", /(?:OPR|Opera)\/([\d.]+)/],
      ["chrome", /(?:Chrome|CriOS)\/([\d.]+)/],
      ["firefox", /(?:Firefox|FxiOS)\/([\d.]+)/],
      ["safari", /Version\/([\d.]+).*Safari/],
    ];
    for (const [name, regex] of rules) {
      const match = ua.match(regex);
      if (match) {
        return { browser: name, version: match[1] ?? null };
      }
    }
  } catch {
    // Ignore errors in non-browser or restricted environments
  }
  return { browser: null, version: null };
}

const DISCRETE_RECT_EVENTS = new Set(["click", "dblclick", "change", "submit"]);

export interface TargetRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Safely extracts the bounding client rectangle for an event target on discrete
 * user interactions (click, dblclick, change, submit).
 */
export function getTargetRect(target: EventTarget | null): TargetRect | null {
  try {
    if (
      target &&
      typeof (target as Element).getBoundingClientRect === "function"
    ) {
      const rect = (target as Element).getBoundingClientRect();
      if (
        rect &&
        Number.isFinite(rect.x) &&
        Number.isFinite(rect.y) &&
        Number.isFinite(rect.width) &&
        Number.isFinite(rect.height)
      ) {
        return {
          x: Math.round(rect.x),
          y: Math.round(rect.y),
          width: Math.round(rect.width),
          height: Math.round(rect.height),
        };
      }
    }
  } catch {
    // Ignore errors in non-DOM environments
  }
  return null;
}

export function packageLog(
  e: Event,
  detailFcn?: Logging.DynamicDetailFunction | null,
) {
  return legacyPackager.packageLog(e, detailFcn);
}

export function packageCustomLog(
  customLog: Logging.CustomLog,
  detailFcn: Logging.DynamicDetailFunction | Logging.StaticDetailFunction,
  userAction: boolean,
): boolean {
  return legacyPackager.packageCustomLog(customLog, detailFcn, userAction);
}

/**
 * Extract the millisecond and microsecond portions of a timestamp.
 * @param  {Number} timeStamp The timestamp to split into millisecond and microsecond fields.
 * @return {Object}           An object containing the millisecond
 *                            and microsecond portions of the timestamp.
 */
export function extractTimeFields(timeStamp: number) {
  return {
    milli: Math.floor(timeStamp),
    micro: Number((timeStamp % 1).toFixed(3)),
  };
}

export function packageIntervalLog(e: Event) {
  return legacyPackager.packageIntervalLog(e);
}

/**
 * Extracts coordinate information from the event
 * depending on a few browser quirks.
 * @param  {Event} e The event to extract coordinate information from.
 * @return {Object}   An object containing nullable x and y coordinates for the event.
 */
export function getLocation(e: Event) {
  if (
    e &&
    typeof e === "object" &&
    ((typeof MouseEvent !== "undefined" && e instanceof MouseEvent) ||
      typeof (e as MouseEvent).pageX === "number" ||
      typeof (e as MouseEvent).clientX === "number")
  ) {
    const me = e as MouseEvent;
    if (me.pageX != null) {
      return { x: me.pageX, y: me.pageY };
    } else if (me.clientX != null) {
      return {
        x: document.documentElement.scrollLeft + me.clientX,
        y: document.documentElement.scrollTop + me.clientY,
      };
    }
  }
  return { x: null, y: null };
}

/**
 * Extracts innerWidth and innerHeight to provide estimates of screen resolution
 * @return {Object} An object containing the innerWidth and InnerHeight
 */
export function getScreenRes() {
  return { width: self.innerWidth, height: self.innerHeight };
}

/**
 * Builds a string CSS selector from the provided element.
 */
export function getSelector(
  ele: EventTarget,
  mode: Settings.DomSelectorMode = "full",
): string {
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
  } else if (
    ele === globalThis ||
    (typeof self !== "undefined" && ele === self) ||
    (typeof ele === "object" &&
      ele !== null &&
      (ele as { window?: unknown }).window === ele)
  ) {
    return "Window";
  }
  return "Unknown";
}

/**
 * Builds an array of elements from the provided event target, to the root element.
 */
export function buildPath(
  e: Event,
  mode: Settings.DomSelectorMode = "full",
): string[] {
  if (mode === "none") {
    return [];
  }
  const path = safeComposedPath(e);
  return selectorizePath(path, mode);
}

/**
 * Builds a CSS selector path from the provided list of elements.
 */
export function selectorizePath(
  path: EventTarget[],
  mode: Settings.DomSelectorMode = "full",
): string[] {
  if (mode === "none") {
    return [];
  }
  let i = 0;
  let pathEle;
  const pathSelectors: string[] = [];
  while ((pathEle = path[i])) {
    pathSelectors.push(getSelector(pathEle, mode));
    ++i;
  }
  return pathSelectors;
}

const jsonValuePattern =
  /^(?:\{[\s\S]*\}|\[[\s\S]*\]|"(?:[^"\\]|\\.)*"|-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?|true|false|null)$/;

/**
 * Builds an object containing attributes of an element.
 * When `allowedAttributes` is provided, extracts only explicitly allowlisted
 * non-sensitive attribute names as raw strings (no `JSON.parse`).
 */
export function buildAttrs(
  e: Event,
  targetElement?: Element | null,
  allowedAttributes?: string[] | null,
): Record<string, any> {
  const attributes: Record<string, any> = {};
  const rawTarget = (e as { target?: unknown } | null)?.target;
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
      let val: any = attr.value;
      if (jsonValuePattern.test(val.trim())) {
        try {
          val = JSON.parse(val);
        } catch {
          // Ignore parsing errors, fallback to raw string value
        }
      }
      attributes[attr.name] = val;
    }
  }

  return attributes;
}

/**
 * Builds an object containing all CSS properties of an element.
 */
export function buildCSS(e: Event): Record<string, string> {
  const properties: Record<string, string> = {};
  const target = (e as { target?: unknown }).target;
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

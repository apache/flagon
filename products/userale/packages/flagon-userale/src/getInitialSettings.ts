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

import type { Settings } from "./types";

let sessionId: string | null = null;
let httpSessionId: string | null = null;

/**
 * Extracts the initial configuration settings from the
 * currently executing script tag.
 * @return {Object} The extracted configuration object
 */
export function getInitialSettings(): Settings.Config {
  if (
    typeof WorkerGlobalScope !== "undefined" &&
    self instanceof WorkerGlobalScope
  ) {
    const settings: Settings.Config = {
      authHeader: null,
      autostart: true,
      browserSessionId: null,
      custIndex: null,
      headers: null,
      httpSessionId: null,
      logCountThreshold: +5,
      logDetails: false,
      resolution: +500,
      sessionId: sessionId,
      time: (ts?: number) => (ts !== undefined ? ts : Date.now()),
      toolName: null,
      toolVersion: null,
      transmitInterval: +5000,
      url: "http://localhost:8000",
      useraleVersion: null,
      userFromParams: null,
      userId: null,
    };
    return settings;
  }

  if (sessionId === null) {
    sessionId = getsessionId(
      "userAlesessionId",
      "session_" + String(Date.now()),
    );
  }

  if (httpSessionId === null) {
    httpSessionId = getsessionId(
      "userAleHttpSessionId",
      generatehttpSessionId(),
    );
  }

  const script =
    document.currentScript ||
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
  const settings: Settings.Config = {
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
export function getsessionId(sessionKey: string, value: any) {
  if (self.sessionStorage.getItem(sessionKey) === null) {
    self.sessionStorage.setItem(sessionKey, JSON.stringify(value));
    return value;
  }

  return JSON.parse(self.sessionStorage.getItem(sessionKey) || "");
}

/**
 * Creates a function to normalize the timestamp of the provided event.
 * @param  {Event} e An event containing a timeStamp property.
 * @return {typeof timeStampScale~tsScaler}   The timestamp normalizing function.
 */
export function timeStampScale(e: Event): Settings.TimeFunction {
  let tsScaler: Settings.TimeFunction;
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
    } else if (delta > e.timeStamp) {
      const navStart = performance.timeOrigin;
      tsScaler = function (ts) {
        return ts + navStart;
      };
    } else {
      tsScaler = function (ts) {
        return ts;
      };
    }
  } else {
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
function generatehttpSessionId(): string {
  // 32 digit hex -> 128 bits of info -> 2^64 ~= 10^19 sessions needed for 50% chance of collison
  const len = 32;
  const arr = new Uint8Array(len / 2);
  window.crypto.getRandomValues(arr);
  return Array.from(arr, (dec) => {
    return dec.toString(16).padStart(2, "0");
  }).join("");
}

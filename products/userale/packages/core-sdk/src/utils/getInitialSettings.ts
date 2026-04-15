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

import type { Settings } from "@/types";
import { generateSpanId } from "@/utils/ids";

let sessionId: string | null = null;
let httpSessionId: string | null = null;

/**
 * Extracts the initial configuration settings from the
 * currently executing script tag.
 */
export function getInitialSettings(): Settings.Config {
  if (
    typeof WorkerGlobalScope !== "undefined" &&
    self instanceof WorkerGlobalScope
  ) {
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
      time: (ts?: number) => (ts !== undefined ? ts : Date.now()),
      toolName: null,
      toolVersion: null,
      transmitInterval: 5000,
      url: "http://localhost:4318",
      useraleVersion: null,
      userFromParams: null,
      userId: null,
    };
  }

  if (sessionId === null) {
    sessionId = getOrCreateSessionId(
      "userAlesessionId",
      "session_" + String(Date.now()),
    );
  }

  if (httpSessionId === null) {
    httpSessionId = getOrCreateSessionId(
      "userAleHttpSessionId",
      generateSpanId(),
    );
  }

  const script =
    document.currentScript ??
    ((): Element | null => {
      const scripts = document.getElementsByTagName("script");
      return scripts[scripts.length - 1] ?? null;
    })();

  const get = (attr: string): string | null =>
    script ? script.getAttribute(attr) : null;

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
    transmitInterval: +(get("data-interval") ?? 5000),
    url: get("data-url") ?? "http://localhost:4318",
    useraleVersion: get("data-userale-version"),
    userFromParams: get("data-user-from-params"),
    userId: get("data-user"),
  };
}

/**
 * Retrieves a session ID from sessionStorage, creating and storing it if absent.
 * Preserves the session across page refreshes (e.g. after form submit).
 */
export function getOrCreateSessionId(
  key: string,
  defaultValue: string,
): string {
  const stored = self.sessionStorage.getItem(key);
  if (stored === null) {
    self.sessionStorage.setItem(key, JSON.stringify(defaultValue));
    return defaultValue;
  }
  return JSON.parse(stored) as string;
}

/**
 * Returns a function that normalises a browser event timestamp to Unix ms,
 * accounting for cross-browser quirks in how timeStamp is reported.
 */
export function timeStampScale(e: Event): Settings.TimeFunction {
  if (e.timeStamp && e.timeStamp > 0) {
    const delta = Date.now() - e.timeStamp;
    if (delta < 0) {
      return () => e.timeStamp / 1000;
    } else if (delta > e.timeStamp) {
      const navStart = performance.timeOrigin;
      return (ts: number) => ts + navStart;
    } else {
      return (ts: number) => ts;
    }
  }
  return () => Date.now();
}

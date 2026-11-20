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

import { clonePrivacyOptions, DEFAULT_PRIVACY_OPTIONS } from "@/privacy";
import type { Settings } from "./types";

export const EXPLICIT_EXPORTER_MODE_SYM = Symbol.for(
  "apache.flagon.userale.explicitExporterMode",
);

export interface InitialSettingsOverrides {
  persistSession?: boolean;
  sessionId?: string | null;
  autostart?: boolean;
  skipScriptTag?: boolean;
}

function parseHeadersAttr(raw: string | null): Settings.Headers {
  if (!raw) {
    return null;
  }
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? (parsed as Settings.HeaderObject)
      : null;
  } catch {
    return null;
  }
}

/**
 * Extracts the initial configuration settings from the
 * currently executing script tag.
 * @return {Object} The extracted configuration object
 */
export function getInitialSettings(
  overrides?: InitialSettingsOverrides,
): Settings.Config {
  const isWorker =
    typeof WorkerGlobalScope !== "undefined" &&
    typeof self !== "undefined" &&
    self instanceof WorkerGlobalScope;

  if (
    isWorker ||
    typeof document === "undefined" ||
    typeof window === "undefined"
  ) {
    const settings: Settings.Config = {
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
      logCountThreshold: +5,
      logDetails: false,
      maxQueueSize: 10000,
      observeMutations: false,
      otelLogger: null,
      otlpEndpoint: null,
      persistSession: overrides?.persistSession ?? isWorker,
      privacy: clonePrivacyOptions(DEFAULT_PRIVACY_OPTIONS),
      resolution: +500,
      sessionId:
        overrides?.sessionId !== undefined ? overrides.sessionId : null,
      time: (ts?: number) => (ts !== undefined ? ts : Date.now()),
      toolName: null,
      toolVersion: null,
      traceContext: null,
      transmitInterval: +5000,
      url: "http://localhost:8000",
      useraleVersion: null,
      userFromParams: null,
      userId: null,
    };
    return settings;
  }

  // Only inspect document.currentScript unless skipScriptTag is requested;
  // never scrape an arbitrary last <script> in ESM bundles.
  const script = overrides?.skipScriptTag ? null : document.currentScript;
  const get = script
    ? script.getAttribute.bind(script)
    : function () {
        return null;
      };

  const persistSession =
    overrides?.persistSession !== undefined
      ? overrides.persistSession
      : get("data-persist-session") === "false"
        ? false
        : true;

  let resolvedSessionId: string | null = null;
  let resolvedHttpSessionId: string | null = null;

  if (persistSession) {
    if (overrides?.sessionId !== undefined) {
      resolvedSessionId = overrides.sessionId;
    } else {
      resolvedSessionId =
        get("data-session") ||
        getsessionId("userAlesessionId", "session_" + String(Date.now()));
    }

    resolvedHttpSessionId = getsessionId(
      "userAleHttpSessionId",
      generatehttpSessionId(),
    );
  } else {
    resolvedSessionId =
      overrides?.sessionId !== undefined
        ? overrides.sessionId
        : get("data-session") || null;
    resolvedHttpSessionId = null;
  }

  const headers = get("data-headers");
  const otlpEndpoint = get("data-otlp-endpoint") || null;
  const explicitExporterAttr =
    get("data-exporter-type") ||
    get("data-exporter-format") ||
    get("data-exporter");
  const exporterAttr = (explicitExporterAttr ||
    (otlpEndpoint ? "otlp" : "http-json")) as Settings.ExporterType;
  const defaultAutostart = get("data-autostart") === "false" ? false : true;
  const settings: Settings.Config = {
    apiKey: get("data-api-key") || null,
    authHeader: get("data-auth") || null,
    autostart:
      overrides?.autostart !== undefined
        ? overrides.autostart
        : defaultAutostart,
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
    maxQueueSize: +(get("data-max-queue-size") || 10000),
    observeMutations: get("data-observe-mutations") === "true" ? true : false,
    otelLogger: null,
    otlpEndpoint: otlpEndpoint,
    persistSession: persistSession,
    privacy: clonePrivacyOptions(DEFAULT_PRIVACY_OPTIONS),
    resolution: +(get("data-resolution") || 500),
    sessionId: resolvedSessionId,
    time: timeStampScale(document.createEvent("CustomEvent")),
    toolName: get("data-tool") || null,
    toolVersion: get("data-version") || null,
    traceContext: null,
    transmitInterval: +(get("data-interval") || 5000),
    url: get("data-url") || "http://localhost:8000",
    useraleVersion: get("data-userale-version") || null,
    userFromParams: get("data-user-from-params") || null,
    userId: get("data-user") || null,
  };
  if (explicitExporterAttr) {
    Object.defineProperty(settings, EXPLICIT_EXPORTER_MODE_SYM, {
      value: true,
      enumerable: false,
    });
  }
  return settings;
}

/**
 * defines sessionId, stores it in sessionStorage, checks to see if there is a sessionId in
 * storage when script is started. This prevents events like 'submit', which refresh page data
 * from refreshing the current user session
 *
 */
export function getsessionId(sessionKey: string, value: any) {
  try {
    const storage =
      typeof self !== "undefined" ? self.sessionStorage : undefined;
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
  if (
    typeof globalThis !== "undefined" &&
    globalThis.crypto &&
    typeof globalThis.crypto.getRandomValues === "function"
  ) {
    globalThis.crypto.getRandomValues(arr);
  }
  return Array.from(arr, (dec) => {
    return dec.toString(16).padStart(2, "0");
  }).join("");
}

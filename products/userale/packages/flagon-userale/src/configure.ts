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

import type { OtelLogsApiLogger } from "@/exporters/otel-sdk";
import {
  EXPLICIT_EXPORTER_MODE_SYM,
  getInitialSettings,
  type InitialSettingsOverrides,
} from "@/getInitialSettings";
import {
  clonePrivacyOptions,
  DEFAULT_PRIVACY_OPTIONS,
  freezePrivacyOptions,
  mergePrivacyOptions,
} from "@/privacy";
import type { Settings } from "@/types";

const FORBIDDEN_CONFIG_KEYS = new Set([
  "__proto__",
  "constructor",
  "prototype",
  "initialized",
]);

const ALLOW_CALLABLE_KEYS = new Set(["time", "authHeader", "traceContext"]);

const LOCKED_BLOCKED_KEYS = new Set([
  "userFromParams",
  "events",
  "exporter",
  "url",
  "otlpEndpoint",
  "exporterType",
  "exporterFormat",
  "websocketsEnabled",
  "otelLogger",
]);

interface ConfigInternalState {
  privacyLocked: boolean;
  allowlistSelectorInvalid: boolean;
  resolvedPrivacy: Settings.ResolvedPrivacyOptions;
  hasExplicitExporterMode: boolean;
}

const configInternalStates = new WeakMap<Configuration, ConfigInternalState>();

function getInternalState(cfg: Configuration): ConfigInternalState {
  let state = configInternalStates.get(cfg);
  if (!state) {
    state = {
      privacyLocked: false,
      allowlistSelectorInvalid: false,
      resolvedPrivacy: clonePrivacyOptions(DEFAULT_PRIVACY_OPTIONS),
      hasExplicitExporterMode: false,
    };
    configInternalStates.set(cfg, state);
  }
  return state;
}

// Singleton Configuration class
export class Configuration {
  [key: string]: Settings.ConfigValueTypes;
  // Private static property to hold the singleton instance
  private static instance: Configuration | null = null;
  private initialized: boolean = false;

  // Public properties corresponding to fields in the Config interface
  public apiKey: Settings.ApiKey = null;
  public autostart: boolean = false;
  public authHeader: Settings.AuthHeader = null;
  public browserSessionId: Settings.SessionId = null;
  public custIndex: Settings.CustomIndex = null;
  public events: string[] | null = null;
  public exporter: Settings.CustomExporter = null;
  public exporterFormat: Settings.ExporterType = "http-json";
  public exporterType: Settings.ExporterType = "http-json";
  public headers: Settings.Headers = null;
  public httpSessionId: Settings.SessionId = null;
  public logCountThreshold: number = 0;
  public logDetails: boolean = false;
  public maxQueueSize: number = 10000;
  public observeMutations: boolean = false;
  public on: boolean = false;
  public otelLogger: OtelLogsApiLogger | null = null;
  public otlpEndpoint: Settings.OtlpEndpoint = null;
  public persistSession: boolean = true;
  public privacy: Readonly<Settings.ResolvedPrivacyOptions> =
    freezePrivacyOptions(DEFAULT_PRIVACY_OPTIONS);
  public resolution: number = 0;
  public sessionId: Settings.SessionId = null;
  public time: Settings.TimeFunction = () => Date.now();
  public toolName: Settings.ToolName = null;
  public toolVersion: Settings.Version = null;
  public traceContext: Settings.TraceContextCallback = null;
  public transmitInterval: number = 0;
  public url: string = "";
  public userFromParams: Settings.UserFromParams = null;
  public useraleVersion: Settings.Version = null;
  public userId: Settings.UserId = null;
  public version: Settings.Version = null;
  public websocketsEnabled: boolean = false;

  // Private constructor to prevent external instantiation
  private constructor(
    skipInit: boolean = false,
    overrides?: InitialSettingsOverrides,
  ) {
    if (!skipInit) {
      this.initialize(overrides);
    }
  }

  // Static method to get the singleton instance
  public static getInstance(): Configuration {
    if (Configuration.instance === null) {
      Configuration.instance = new Configuration(false);
    }
    return Configuration.instance;
  }

  // Creates an uninitialized Configuration instance without reading browser storage
  public static createUninitialized(): Configuration {
    return new Configuration(true);
  }

  // Creates an independent initialized Configuration instance
  public static create(overrides?: InitialSettingsOverrides): Configuration {
    return new Configuration(false, overrides);
  }

  public isInitialized(): boolean {
    return this.initialized;
  }

  public lockPrivacy(): void {
    getInternalState(this).privacyLocked = true;
  }

  public isPrivacyLocked(): boolean {
    return getInternalState(this).privacyLocked;
  }

  public getResolvedPrivacy(): Settings.ResolvedPrivacyOptions {
    return clonePrivacyOptions(getInternalState(this).resolvedPrivacy);
  }

  public isAllowlistSelectorInvalid(): boolean {
    return getInternalState(this).allowlistSelectorInvalid;
  }

  public hasExplicitExporterMode(): boolean {
    return getInternalState(this).hasExplicitExporterMode;
  }

  public initialize(overrides?: InitialSettingsOverrides): void {
    const state = getInternalState(this);
    if (state.privacyLocked) {
      return;
    }
    const settings = getInitialSettings(overrides);
    const explicitFromScript = Boolean(
      (settings as unknown as Record<symbol, unknown>)[
        EXPLICIT_EXPORTER_MODE_SYM
      ],
    );
    this.applyUpdate(settings, true);
    state.hasExplicitExporterMode = explicitFromScript;
    this.initialized = true;
  }

  /**
   * Resets the configuration to its initial state.
   */
  public reset(overrides?: InitialSettingsOverrides): void {
    const state = getInternalState(this);
    if (state.privacyLocked) {
      console.warn(
        "[UserALE] Ignoring config.reset() because privacy is locked.",
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
  public update(newConfig: Partial<Settings.Config>): void {
    this.applyUpdate(newConfig, false);
  }

  private applyUpdate(
    newConfig: Partial<Settings.Config>,
    fromInit: boolean,
  ): void {
    if (
      !newConfig ||
      typeof newConfig !== "object" ||
      Array.isArray(newConfig)
    ) {
      return;
    }

    const state = getInternalState(this);

    // Apply privacy options first so subsequent options (like userFromParams) honor updated policy.
    if (
      !state.privacyLocked &&
      Object.prototype.hasOwnProperty.call(newConfig, "privacy")
    ) {
      if (newConfig.privacy === null) {
        state.resolvedPrivacy = clonePrivacyOptions(DEFAULT_PRIVACY_OPTIONS);
        state.allowlistSelectorInvalid = false;
        this.privacy = freezePrivacyOptions(state.resolvedPrivacy);
      } else if (
        newConfig.privacy &&
        typeof newConfig.privacy === "object" &&
        !Array.isArray(newConfig.privacy)
      ) {
        const merged = mergePrivacyOptions(
          state.resolvedPrivacy,
          newConfig.privacy,
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

      if (
        typeof this[option] === "function" &&
        !ALLOW_CALLABLE_KEYS.has(option)
      ) {
        return;
      }

      const newOption = newConfig[option];
      if (newOption === undefined) {
        return;
      }

      if (state.privacyLocked) {
        if (
          LOCKED_BLOCKED_KEYS.has(option) ||
          (option === "logDetails" && newOption === true) ||
          (option === "persistSession" &&
            newOption === true &&
            this.persistSession === false) ||
          (option === "observeMutations" && newOption === true) ||
          (option === "traceContext" &&
            !state.resolvedPrivacy.attachTraceContext)
        ) {
          return;
        }
      }

      if (option === "time" && typeof newOption !== "function") {
        return;
      }

      if (option === "userFromParams") {
        const userParamString = newOption as Settings.UserFromParams;
        const userId =
          userParamString && state.resolvedPrivacy.capturePageUrl !== false
            ? Configuration.getUserIdFromParams(userParamString)
            : null;
        if (userId) {
          this["userId"] = userId;
        }
      }

      const hasNewUserFromParams = newConfig["userFromParams"];
      const willNullifyUserId =
        option === "userId" && newConfig[option] === null;
      if (willNullifyUserId && hasNewUserFromParams) {
        return;
      }

      if (option === "headers") {
        if (newOption === null) {
          this.headers = null;
        } else if (typeof newOption === "object" && !Array.isArray(newOption)) {
          const clonedHeaders: Settings.HeaderObject = {};
          for (const [k, v] of Object.entries(
            newOption as Record<string, unknown>,
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
            (item): item is string => typeof item === "string",
          );
        }
        return;
      }

      this[option] = newOption;
      if (option === "exporterFormat") {
        if (!fromInit) {
          state.hasExplicitExporterMode = true;
        }
        if (newConfig.exporterType === undefined) {
          this.exporterType = newOption as Settings.ExporterType;
        }
      } else if (option === "exporterType") {
        if (!fromInit) {
          state.hasExplicitExporterMode = true;
        }
        if (newConfig.exporterFormat === undefined) {
          this.exporterFormat = newOption as Settings.ExporterType;
        }
      }
    });

    if (newConfig.persistSession === false) {
      if (newConfig.httpSessionId === undefined) {
        this.httpSessionId = null;
      }
      if (newConfig.sessionId === undefined) {
        this.sessionId = null;
      }
    }
  }

  /**
   * Attempts to extract the userid from the query parameters of the URL.
   * @param  {string} param The name of the query parameter containing the userid.
   * @return {string | null}       The extracted/decoded userid, or null if none is found.
   */
  public static getUserIdFromParams(param: string) {
    if (
      !param ||
      typeof param !== "string" ||
      typeof window === "undefined" ||
      !window.location?.href
    ) {
      return null;
    }
    const href = window.location.href;
    const qIdx = href.indexOf("?");
    if (qIdx === -1) {
      return null;
    }
    const hIdx = href.indexOf("#", qIdx);
    const query =
      hIdx === -1 ? href.slice(qIdx + 1) : href.slice(qIdx + 1, hIdx);
    const val = new URLSearchParams(query).get(param);
    return val && val.length > 0 ? val : null;
  }
}

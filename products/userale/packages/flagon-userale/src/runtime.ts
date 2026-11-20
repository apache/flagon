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

import {
  attachHandlers as legacyAttachHandlers,
  defineCustomDetails,
  detachHandlers as legacyDetachHandlers,
  createHandlerManager,
  type HandlerManager,
} from "@/attachHandlers";
import { Configuration } from "@/configure";
import type { LogExporter } from "@/exporters";
import {
  addCallbacks as legacyAddCallbacks,
  buildPath as legacyBuildPath,
  createPackager,
  detectBrowser as legacyDetectBrowser,
  enqueueLog as legacyEnqueueLog,
  getSelector as legacyGetSelector,
  getTargetRect as legacyGetTargetRect,
  initPackager,
  packageCustomLog as legacyPackageCustomLog,
  packageIntervalLog as legacyPackageIntervalLog,
  packageLog as legacyPackageLog,
  removeCallbacks as legacyRemoveCallbacks,
  resetIntervalState as legacyResetIntervalState,
  type PackagerController,
} from "@/packageLogs";
import { clonePrivacyOptions, enforcePrivacyOnLog } from "@/privacy";
import {
  createReplayController,
  flushSessionReplay as legacyFlushSessionReplay,
  getActiveReplayRingBuffer as legacyGetActiveReplayRingBuffer,
  ReplayRingBuffer,
  startSessionReplay as legacyStartSessionReplay,
  stopSessionReplay as legacyStopSessionReplay,
  type ReplayController,
  type ReplayEnvelope,
  type SessionReplayOptions,
} from "@/replay";
import {
  createSender,
  flushLogs as legacyFlushLogs,
  initSender as legacyInitSender,
  registerExporter as legacyRegisterExporter,
  resolveActiveExporter as legacyResolveExporter,
  sendLogs as legacySendLogs,
  stopSender as legacyStopSender,
  type SenderController,
} from "@/sendLogs";
import type { Callbacks, Events, Logging, Settings } from "@/types";
import {
  registerAuthCallback as legacyRegisterAuthCallback,
  registerConfigCredentialResolver,
  registerHeadersCallback as legacyRegisterHeadersCallback,
  resetAuthCallback as legacyResetAuthCallback,
  resetHeadersCallback as legacyResetHeadersCallback,
  verifyAuthCallback,
  verifyHeadersCallback,
} from "@/utils";
import { version as userAleVersion } from "../package.json";

export interface UserAleInstance {
  readonly version: string;
  readonly started: boolean;
  start: () => void;
  stop: () => void;
  flush: () => Promise<void>;
  reset: () => void;
  options: (newConfig?: Partial<Settings.Config>) => Settings.Config;
  log: (customLog?: Logging.CustomLog | null) => boolean;
  details: (
    opts: Settings.DefaultConfig,
    type: Events.AllowedEvents,
  ) => Logging.DynamicDetailFunction | null | undefined;
  addCallbacks: (
    ...newCallbacks: Record<symbol | string, CallableFunction>[]
  ) => Callbacks.CallbackMap;
  removeCallbacks: (targetKeys: string[]) => void;
  packageLog: (
    e: Event,
    detailFcn?: Logging.DynamicDetailFunction | null,
  ) => boolean;
  packageCustomLog: (
    customLog: Logging.CustomLog,
    detailFcn: Logging.DynamicDetailFunction | Logging.StaticDetailFunction,
    userAction: boolean,
  ) => boolean;
  registerAuthCallback: (callback: Callbacks.AuthCallback) => boolean;
  resetAuthCallback: () => void;
  registerHeadersCallback: (callback: Callbacks.HeadersCallback) => boolean;
  resetHeadersCallback: () => void;
  registerExporter: (exporter: LogExporter | null) => boolean;
  startSessionReplay: (options?: SessionReplayOptions) => () => void;
  stopSessionReplay: () => void;
  flushSessionReplay: (trigger?: string) => Promise<ReplayEnvelope | null>;
  getActiveReplayRingBuffer: () => ReplayRingBuffer | null;
  getSelector: typeof legacyGetSelector;
  buildPath: typeof legacyBuildPath;
  detectBrowser: typeof legacyDetectBrowser;
  getTargetRect: typeof legacyGetTargetRect;
  lockPrivacy: () => void;
  isPrivacyLocked: () => boolean;
}

export interface UserAleRuntime extends UserAleInstance {
  config: Configuration;
  logs: Array<Logging.Log>;
  getStarted: () => boolean;
  scheduleSetup: () => void;
  notifyOnStartedChange: (fn: (isStarted: boolean) => void) => void;
}

const INTERNAL_CONFIG_KEYS = new Set(["initialized"]);
const FORBIDDEN_CUSTOM_KEYS = new Set([
  "__proto__",
  "constructor",
  "prototype",
]);

export function snapshotConfig(config: Configuration): Settings.Config {
  const snapshot: Record<string, unknown> = {};
  for (const key of Object.keys(config)) {
    if (INTERNAL_CONFIG_KEYS.has(key)) {
      continue;
    }
    const val = config[key];
    if (
      key === "headers" &&
      val &&
      typeof val === "object" &&
      !Array.isArray(val)
    ) {
      snapshot[key] = { ...(val as Record<string, string>) };
    } else if (key === "privacy") {
      snapshot[key] = clonePrivacyOptions(config.getResolvedPrivacy());
    } else if (key === "events" && Array.isArray(val)) {
      snapshot[key] = [...val];
    } else {
      snapshot[key] = val;
    }
  }
  return snapshot as Settings.Config;
}

function createIsolatedCredentials(config: Configuration) {
  let instanceAuthCb: Callbacks.AuthCallback | null = null;
  let instanceHeadersCb: Callbacks.HeadersCallback | null = null;

  registerConfigCredentialResolver(config, {
    resolveAuthHeader: () => {
      if (!instanceAuthCb) {
        return undefined;
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
        return undefined;
      }
      try {
        const res = instanceHeadersCb();
        if (!res || typeof res !== "object" || Array.isArray(res)) {
          return null;
        }
        const valid: Settings.HeaderObject = {};
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
    },
  });

  return {
    registerAuthCallback: (callback: Callbacks.AuthCallback): boolean => {
      try {
        verifyAuthCallback(callback);
        instanceAuthCb = callback;
        return true;
      } catch {
        return false;
      }
    },
    resetAuthCallback: (): void => {
      instanceAuthCb = null;
    },
    registerHeadersCallback: (callback: Callbacks.HeadersCallback): boolean => {
      try {
        verifyHeadersCallback(callback);
        instanceHeadersCb = callback;
        return true;
      } catch {
        return false;
      }
    },
    resetHeadersCallback: (): void => {
      instanceHeadersCb = null;
    },
  };
}

interface BuildRuntimeOptions {
  useSingletonControllers: boolean;
  attachLoadListener: boolean;
  autoInitDefault: boolean;
  config: Configuration;
}

function buildRuntime({
  useSingletonControllers,
  attachLoadListener,
  autoInitDefault,
  config,
}: BuildRuntimeOptions): UserAleRuntime {
  const logs: Array<Logging.Log> = [];
  let isStarted = false;
  let setupTimerId: ReturnType<typeof setTimeout> | null = null;
  let startedChangeListener: ((val: boolean) => void) | null = null;

  const startLoadTimestamp = Date.now();
  let endLoadTimestamp: number | undefined;

  if (attachLoadListener) {
    if (
      typeof self !== "undefined" &&
      typeof self.addEventListener === "function"
    ) {
      self.addEventListener("load", function () {
        endLoadTimestamp = Date.now();
      });
    }
    config.update({ useraleVersion: userAleVersion });
  }

  let packager: PackagerController;
  let handlers: HandlerManager;
  let sender: SenderController;
  let replay: ReplayController;
  let creds: ReturnType<typeof createIsolatedCredentials>;

  if (useSingletonControllers) {
    initPackager(logs, config);
    packager = {
      packageLog: legacyPackageLog,
      packageCustomLog: legacyPackageCustomLog,
      packageIntervalLog: legacyPackageIntervalLog,
      addCallbacks: legacyAddCallbacks,
      removeCallbacks: legacyRemoveCallbacks,
      enqueueLog: legacyEnqueueLog,
      resetIntervalState: legacyResetIntervalState,
      log: (customLog) => {
        if (
          !customLog ||
          typeof customLog !== "object" ||
          Array.isArray(customLog)
        ) {
          return false;
        }
        const cloned: Record<string, unknown> = {};
        for (const [k, v] of Object.entries(customLog)) {
          if (!FORBIDDEN_CUSTOM_KEYS.has(k) && v !== undefined) {
            cloned[k] = v;
          }
        }
        const enforced = enforcePrivacyOnLog(
          cloned as Logging.Log,
          config.getResolvedPrivacy(),
          { isPackaged: false },
        );
        legacyEnqueueLog(enforced);
        return true;
      },
    };
    handlers = {
      attachHandlers: legacyAttachHandlers,
      detachHandlers: legacyDetachHandlers,
    };
    sender = {
      registerExporter: (exporter) => legacyRegisterExporter(exporter, config),
      resolveExporter: () => legacyResolveExporter(config),
      initSender: () => legacyInitSender(logs, config),
      stopSender: legacyStopSender,
      flushLogs: () => legacyFlushLogs(logs, config),
      sendLogs: (batch, retries) => legacySendLogs(batch, config, retries),
    };
    replay = {
      startSessionReplay: (opts) => legacyStartSessionReplay(opts, config),
      stopSessionReplay: legacyStopSessionReplay,
      flushSessionReplay: legacyFlushSessionReplay,
      getActiveReplayRingBuffer: legacyGetActiveReplayRingBuffer,
    };
    creds = {
      registerAuthCallback: legacyRegisterAuthCallback,
      resetAuthCallback: legacyResetAuthCallback,
      registerHeadersCallback: legacyRegisterHeadersCallback,
      resetHeadersCallback: legacyResetHeadersCallback,
    };
  } else {
    packager = createPackager(logs, config);
    handlers = createHandlerManager(packager);
    sender = createSender(config, logs);
    replay = createReplayController(config, packager, () =>
      sender.resolveExporter(),
    );
    creds = createIsolatedCredentials(config);
  }

  const setStarted = (value: boolean) => {
    isStarted = value;
    startedChangeListener?.(value);
  };

  const clearSetupTimer = () => {
    if (setupTimerId !== null) {
      clearTimeout(setupTimerId);
      setupTimerId = null;
    }
  };

  const ensureInitialized = (newConfig?: Partial<Settings.Config>) => {
    if (!config.isInitialized() && !config.isPrivacyLocked()) {
      const pendingExporter = config.exporter;
      config.initialize({
        autostart: autoInitDefault,
        persistSession: newConfig?.persistSession,
        sessionId: newConfig?.sessionId,
      });
      config.update({ useraleVersion: userAleVersion });
      if (pendingExporter && newConfig?.exporter === undefined) {
        config.update({ exporter: pendingExporter });
      }
    }
  };

  const start = (): void => {
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
        if (
          config.observeMutations &&
          !replay.getActiveReplayRingBuffer() &&
          !config.isPrivacyLocked()
        ) {
          replay.startSessionReplay({ observeMutations: true });
        }
      }
    }
  };

  const stop = (): void => {
    clearSetupTimer();
    setStarted(false);
    config.on = false;
    config.update({ autostart: false });
    handlers.detachHandlers();
    packager.resetIntervalState();
    replay.stopSessionReplay();
    void sender.stopSender();
  };

  const flush = async (): Promise<void> => {
    ensureInitialized();
    await sender.flushLogs();
  };

  const reset = (): void => {
    logs.splice(0);
    packager.resetIntervalState();
  };

  const options = (newConfig?: Partial<Settings.Config>): Settings.Config => {
    ensureInitialized(newConfig);
    if (newConfig) {
      config.update(newConfig);
      if (newConfig.autostart === false) {
        clearSetupTimer();
      }
      if (
        isStarted &&
        !config.isPrivacyLocked() &&
        newConfig.events !== undefined
      ) {
        handlers.attachHandlers(config);
        packager.resetIntervalState();
      }
      if (
        isStarted &&
        newConfig.observeMutations !== undefined &&
        !config.isPrivacyLocked()
      ) {
        if (newConfig.observeMutations && !replay.getActiveReplayRingBuffer()) {
          replay.startSessionReplay({ observeMutations: true });
        } else if (
          !newConfig.observeMutations &&
          replay.getActiveReplayRingBuffer()
        ) {
          replay.stopSessionReplay();
        }
      }
    }
    return snapshotConfig(config);
  };

  const scheduleSetup = (): void => {
    if (isStarted || !config.autostart) {
      return;
    }
    if (typeof document === "undefined" && typeof self === "undefined") {
      return;
    }
    clearSetupTimer();
    setupTimerId = setTimeout(function () {
      setupTimerId = null;
      if (isStarted || !config.autostart) {
        return;
      }
      let state: string;
      try {
        state = document.readyState;
      } catch {
        // No DOM present (e.g., Web Worker context)
        state = "complete";
      }

      if (state === "interactive" || state === "complete") {
        start();
        if (typeof window !== "undefined" && typeof document !== "undefined") {
          const loadDuration = Math.max(
            1,
            (endLoadTimestamp ?? Date.now()) - startLoadTimestamp,
          );
          packager.packageCustomLog(
            {
              type: "load",
              details: { pageLoadTime: loadDuration },
            },
            () => ({}),
            false,
          );
        }
      } else {
        scheduleSetup();
      }
    }, 100);
  };

  const lockPrivacy = (): void => {
    config.lockPrivacy();
  };

  const isPrivacyLocked = (): boolean => {
    return config.isPrivacyLocked();
  };

  return {
    config,
    logs,
    version: userAleVersion,
    get started() {
      return isStarted;
    },
    getStarted: () => isStarted,
    start,
    stop,
    flush,
    reset,
    options,
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
    getSelector: legacyGetSelector,
    buildPath: legacyBuildPath,
    detectBrowser: legacyDetectBrowser,
    getTargetRect: legacyGetTargetRect,
    lockPrivacy,
    isPrivacyLocked,
    scheduleSetup,
    notifyOnStartedChange: (fn) => {
      startedChangeListener = fn;
    },
  };
}

/**
 * Creates a UserALE runtime bound either to auto-initialized settings
 * (`autoInit = true` for default entrypoint using legacy singletons) or
 * a completely isolated closure (`autoInit = false` for `flagon-userale/manual`).
 */
export function createRuntime(autoInit: boolean): UserAleRuntime {
  const config = autoInit
    ? Configuration.getInstance()
    : Configuration.createUninitialized();
  return buildRuntime({
    useSingletonControllers: autoInit,
    attachLoadListener: autoInit,
    autoInitDefault: autoInit,
    config,
  });
}

/**
 * Creates an encapsulated, isolated UserALE client instance safe for
 * multi-instance SPAs, micro-frontends, and strict privacy opt-in workflows.
 */
export function createUserAle(
  initialOptions?: Partial<Settings.Config>,
): UserAleInstance {
  const config = Configuration.create({
    autostart: initialOptions?.autostart ?? false,
    persistSession: initialOptions?.persistSession,
    sessionId: initialOptions?.sessionId,
    skipScriptTag: true,
  });
  config.update({ useraleVersion: userAleVersion });
  if (initialOptions) {
    config.update(initialOptions);
  }

  const runtime = buildRuntime({
    useSingletonControllers: false,
    attachLoadListener: Boolean(initialOptions?.autostart),
    autoInitDefault: Boolean(initialOptions?.autostart),
    config,
  });

  if (config.autostart) {
    runtime.scheduleSetup();
  }

  return {
    version: runtime.version,
    get started() {
      return runtime.started;
    },
    start: runtime.start,
    stop: runtime.stop,
    flush: runtime.flush,
    reset: runtime.reset,
    options: runtime.options,
    log: runtime.log,
    details: runtime.details,
    addCallbacks: runtime.addCallbacks,
    removeCallbacks: runtime.removeCallbacks,
    packageLog: runtime.packageLog,
    packageCustomLog: runtime.packageCustomLog,
    registerAuthCallback: runtime.registerAuthCallback,
    resetAuthCallback: runtime.resetAuthCallback,
    registerHeadersCallback: runtime.registerHeadersCallback,
    resetHeadersCallback: runtime.resetHeadersCallback,
    registerExporter: runtime.registerExporter,
    startSessionReplay: runtime.startSessionReplay,
    stopSessionReplay: runtime.stopSessionReplay,
    flushSessionReplay: runtime.flushSessionReplay,
    getActiveReplayRingBuffer: runtime.getActiveReplayRingBuffer,
    getSelector: runtime.getSelector,
    buildPath: runtime.buildPath,
    detectBrowser: runtime.detectBrowser,
    getTargetRect: runtime.getTargetRect,
    lockPrivacy: runtime.lockPrivacy,
    isPrivacyLocked: runtime.isPrivacyLocked,
  };
}

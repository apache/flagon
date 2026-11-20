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

import type { LogExporter } from "@/exporters";
import { attachHandlers, detachHandlers } from "@/attachHandlers";
import { Configuration } from "@/configure";
import {
  enqueueLog,
  initPackager,
  packageCustomLog,
  resetIntervalState,
} from "@/packageLogs";
import {
  getActiveReplayRingBuffer,
  startSessionReplay,
  stopSessionReplay,
} from "@/replay";
import {
  flushLogs,
  initSender,
  registerExporter as registerSenderExporter,
  stopSender,
} from "@/sendLogs";
import type { Logging, Settings } from "@/types";
import { version as userAleVersion } from "../package.json";

export interface UserAleRuntime {
  config: Configuration;
  logs: Array<Logging.Log>;
  getStarted: () => boolean;
  start: () => void;
  stop: () => void;
  flush: () => Promise<void>;
  reset: () => void;
  options: (newConfig?: Partial<Settings.Config>) => Settings.Config;
  log: (customLog?: Logging.CustomLog | null) => boolean;
  registerExporter: (exporter: LogExporter | null) => boolean;
  scheduleSetup: () => void;
  notifyOnStartedChange: (fn: (isStarted: boolean) => void) => void;
}

const INTERNAL_CONFIG_KEYS = new Set(["initialized"]);

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
    } else {
      snapshot[key] = val;
    }
  }
  return snapshot as Settings.Config;
}

/**
 * Creates a UserALE runtime bound either to auto-initialized settings
 * (`autoInit = true` for default entrypoint) or lazy initialization
 * (`autoInit = false` for zero-side-effect `flagon-userale/manual`).
 */
export function createRuntime(autoInit: boolean): UserAleRuntime {
  const config = autoInit
    ? Configuration.getInstance()
    : Configuration.createUninitialized();
  const logs: Array<Logging.Log> = [];
  let isStarted = false;
  let setupTimerId: ReturnType<typeof setTimeout> | null = null;
  let startedChangeListener: ((val: boolean) => void) | null = null;

  const startLoadTimestamp = Date.now();
  let endLoadTimestamp: number | undefined;

  if (autoInit) {
    if (
      typeof self !== "undefined" &&
      typeof self.addEventListener === "function"
    ) {
      self.addEventListener("load", function () {
        endLoadTimestamp = Date.now();
      });
    }
    config.update({
      useraleVersion: userAleVersion,
    });
  }

  initPackager(logs, config);

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
    if (!config.isInitialized()) {
      const pendingExporter = config.exporter;
      config.initialize({
        autostart: autoInit,
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
        attachHandlers(config);
        initSender(logs, config);
        if (config.observeMutations && !getActiveReplayRingBuffer()) {
          startSessionReplay({ observeMutations: true }, config);
        }
      }
    }
  };

  const stop = (): void => {
    clearSetupTimer();
    setStarted(false);
    config.on = false;
    config.update({ autostart: false });
    detachHandlers();
    resetIntervalState();
    stopSessionReplay();
    void stopSender();
  };

  const flush = async (): Promise<void> => {
    ensureInitialized();
    await flushLogs(logs, config);
  };

  const reset = (): void => {
    logs.splice(0);
    resetIntervalState();
  };

  const options = (newConfig?: Partial<Settings.Config>): Settings.Config => {
    ensureInitialized(newConfig);
    if (newConfig) {
      config.update(newConfig);
      if (newConfig.autostart === false) {
        clearSetupTimer();
      }
      if (isStarted && newConfig.observeMutations !== undefined) {
        if (newConfig.observeMutations && !getActiveReplayRingBuffer()) {
          startSessionReplay({ observeMutations: true }, config);
        } else if (!newConfig.observeMutations && getActiveReplayRingBuffer()) {
          stopSessionReplay();
        }
      }
    }
    return snapshotConfig(config);
  };

  const log = (customLog?: Logging.CustomLog | null): boolean => {
    if (customLog && typeof customLog === "object") {
      enqueueLog(customLog);
      return true;
    }
    return false;
  };

  const registerExporter = (exporter: LogExporter | null): boolean => {
    return registerSenderExporter(exporter, config);
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
          packageCustomLog(
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

  return {
    config,
    logs,
    getStarted: () => isStarted,
    start,
    stop,
    flush,
    reset,
    options,
    log,
    registerExporter,
    scheduleSetup,
    notifyOnStartedChange: (fn) => {
      startedChangeListener = fn;
    },
  };
}

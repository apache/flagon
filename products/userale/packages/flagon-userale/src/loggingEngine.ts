/*
 * Licensed to the Apache Software Foundation (ASF) under one or more
 * contributor license agreements...
 */

const startLoadTimestamp = Date.now();

import { version } from "../package.json";
import { attachHandlers, defineCustomDetails } from "@/attachHandlers";
import { logPackager } from "@/logPackager";
import { logSender } from "@/logSender";
import { registerAuthCallback } from "@/utils";

import type { Settings, Logging } from "@/types";


export class LoggingEngine {
  private config = Configuration.getInstance();
  private logs: Array<Logging.Log> = [];
  private endLoadTimestamp: number;
  public static version = userAleVersion;
  private started = false;

  constructor() {
    this.endLoadTimestamp = Date.now();
    try {
      window.onload = () => {
        this.endLoadTimestamp = Date.now();
      };
    } catch {
      this.endLoadTimestamp = Date.now();
    }

    this.config.update({
      useraleVersion: userAleVersion,
    });
    initPackager(this.logs, this.config);

    if (this.config.autostart) {
      this.setup();
    }
  }

  private setup(): void {
    if (!this.started) {
      setTimeout(() => {
        let state: DocumentReadyState;
        try {
          state = document.readyState;
        } catch {
          return;
        }

        if (this.config.autostart && (state === "interactive" || state === "complete")) {
          attachHandlers(this.config);
          initSender(this.logs, this.config);
          this.started = this.config.on = true;
          packageCustomLog(
            {
              type: "load",
              details: { pageLoadTime: this.endLoadTimestamp - this.startLoadTimestamp },
            },
            () => ({}),
            false
          );
        } else {
          this.setup();
        }
      }, 100);
    }
  }
  /**
   * Used to start the logging process if the
   * autostart configuration option is set to false.
   */
  public start(): void {
    if (!this.started || this.config.autostart === false) {
      this.started = this.config.on = true;
      this.config.update({ autostart: true });
    }
  }
  /**
   * Halts the logging process. Logs will no longer be sent.
   */
  public stop(): void {
    this.started = this.config.on = false;
    this.config.update({ autostart: false });
  }

  /**
   * Updates the current configuration
   * object with the provided values.
   * @param  {Partial<Settings.Config>} newConfig The configuration options to use.
   * @return {Settings.Config}           Returns the updated configuration.
   */
  public options(newConfig?: Partial<Settings.Config>): Settings.Config {
    if (newConfig) {
      this.config.update(newConfig);
    }
    return this.config;
  }

  /**
   * Appends a log to the log queue.
   * @param  {Logging.CustomLog} customLog The log to append.
   * @return {boolean}          Whether the operation succeeded.
   */
  public log(customLog?: Logging.CustomLog): boolean {
    if (customLog) {
      this.logs.push(customLog);
      return true;
    }
    return false;
  }
}

// Export auxiliary utilities
export { 
  defineCustomDetails as details,
  registerAuthCallback,
  addCallbacks,
  removeCallbacks,
  packageLog,
  packageCustomLog,
};

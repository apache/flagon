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

import { version as userAleVersion } from "../package.json";
import { Configuration } from "@/Configuration";
import { Packager } from "@/Packager";
import { Sender } from "@/Sender";
import { attachHandlers } from "@/handlers/attach";

import type { Settings, Logging } from "@/types";

// ---------------------------------------------------------------------------
// Page-load timing — captured at module evaluation time
// ---------------------------------------------------------------------------

const startLoadTimestamp = Date.now();
let endLoadTimestamp: number = startLoadTimestamp;

self.addEventListener("load", () => {
  endLoadTimestamp = Date.now();
});

// ---------------------------------------------------------------------------
// UserALE — composes Configuration, Packager, and Sender into one object
// whose lifetime matches the instrumentation session.
// ---------------------------------------------------------------------------

export class UserALE {
  readonly config: Configuration;
  private readonly packager: Packager;
  private readonly sender: Sender;
  private readonly logs: Array<Logging.Log>;
  private started: boolean = false;

  constructor(config: Configuration) {
    this.config = config;
    this.config.update({ useraleVersion: userAleVersion });
    this.logs = [];
    this.packager = new Packager(this.logs, this.config);
    this.sender = new Sender();
  }

  // -------------------------------------------------------------------------
  // Lifecycle
  // -------------------------------------------------------------------------

  /**
   * Starts capturing events and sending logs.
   * In browser contexts waits for the DOM to be ready.
   * In worker/service-worker contexts starts immediately.
   * Safe to call again after options() — the sender restarts with the new config.
   */
  start(): void {
    this.whenReady(() => {
      this.attach();
      this.sender.start(this.logs, this.config);
    });
  }

  /**
   * Captures events and routes them through callbacks, but does not start the
   * sender. Use this in content-script contexts where a separate background
   * instance owns transport — the rerouteLog callback intercepts every log
   * before it can be queued, so no fetch calls are ever made from the page.
   */
  capture(): void {
    this.whenReady(() => this.attach());
  }

  /**
   * Stops sending logs and clears the sender interval.
   */
  stop(): void {
    this.started = this.config.on = false;
    this.sender.stop();
  }

  private whenReady(fn: () => void): void {
    if (typeof document === "undefined") {
      fn();
      return;
    }
    if (
      document.readyState === "interactive" ||
      document.readyState === "complete"
    ) {
      fn();
    } else {
      document.addEventListener("DOMContentLoaded", fn, { once: true });
    }
  }

  private attach(): void {
    if (!this.started) {
      attachHandlers(this.config, this.packager);
      this.started = this.config.on = true;

      if (typeof window !== "undefined" && typeof document !== "undefined") {
        this.packager.packageCustomLog(
          {
            type: "load",
            details: { pageLoadTime: endLoadTimestamp - startLoadTimestamp },
          },
          () => ({}),
          false,
        );
      }
    } else {
      this.config.on = true;
    }
  }

  // -------------------------------------------------------------------------
  // Public API
  // -------------------------------------------------------------------------

  options(newConfig?: Partial<Settings.Config>): Settings.Config {
    if (newConfig) this.config.update(newConfig);
    return this.config;
  }

  log(customLog: Logging.UserLog | undefined): boolean {
    if (customLog) {
      this.logs.push(customLog as Logging.Log);
      return true;
    }
    return false;
  }

  flush(): Promise<void> {
    return this.sender.flush(this.logs, this.config);
  }

  addCallbacks(
    ...newCallbacks: Record<symbol | string, CallableFunction>[]
  ): void {
    this.packager.addCallbacks(...newCallbacks);
  }

  removeCallbacks(targetKeys: string[]): void {
    this.packager.removeCallbacks(targetKeys);
  }

  packageCustomLog(
    userLog: Logging.UserLog,
    detailFcn: Logging.DynamicDetailFunction | Logging.StaticDetailFunction,
    userAction: boolean,
  ): boolean {
    return this.packager.packageCustomLog(userLog, detailFcn, userAction);
  }
}

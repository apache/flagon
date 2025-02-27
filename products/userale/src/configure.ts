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

import { getInitialSettings } from "@/getInitialSettings";
import type { Settings } from "@/types";

// Singleton Configuration class
export class Configuration {
  [key: string]: Settings.ConfigValueTypes;
  // Private static property to hold the singleton instance
  private static instance: Configuration | null = null;

  // Public properties corresponding to fields in the Config interface
  public autostart: boolean = false;
  public authHeader: Settings.AuthHeader = null;
  public browserSessionId: Settings.SessionId = null;
  public custIndex: Settings.CustomIndex = null;
  public headers: Settings.Headers = null;
  public httpSessionId: Settings.SessionId = null;
  public logCountThreshold: number = 0;
  public logDetails: boolean = false;
  public on: boolean = false;
  public resolution: number = 0;
  public sessionId: Settings.SessionId = null;
  public time: Settings.TimeFunction = () => Date.now();
  public toolName: Settings.ToolName = null;
  public toolVersion: Settings.Version = null;
  public transmitInterval: number = 0;
  public url: string = "";
  public userFromParams: Settings.UserFromParams = null;
  public useraleVersion: Settings.Version = null;
  public userId: Settings.UserId = null;
  public version: Settings.Version = null;
  public websocketsEnabled: boolean = false;

  // Private constructor to prevent external instantiation
  private constructor() {
    // Call the initialization method only if it's the first time instantiating
    if (Configuration.instance === null) {
      this.initialize();
    }
  }

  // Static method to get the singleton instance
  public static getInstance(): Configuration {
    if (Configuration.instance === null) {
      Configuration.instance = new Configuration();
    }
    return Configuration.instance;
  }

  private initialize(): void {
    const settings = getInitialSettings();
    this.update(settings);
  }

  /**
   * Resets the configuration to its initial state.
   */
  public reset(): void {
    this.initialize();
  }

  /**
   * Shallow merges a newConfig with the configuration class, updating it.
   * Retrieves/updates the userid if userFromParams is provided.
   * @param  {Partial<Settings.Config>} newConfig Configuration object to merge into the current config.
   */
  public update(newConfig: Partial<Settings.Config>): void {
    Object.keys(newConfig).forEach((option) => {
      if (option === "userFromParams") {
        const userParamString = newConfig[option] as Settings.UserFromParams;
        const userId = userParamString
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
  public static getUserIdFromParams(param: string) {
    const userField = param;
    const regex = new RegExp("[?&]" + userField + "(=([^&#]*)|&|#|$)");
    const results = window.location.href.match(regex);

    if (results && results[2]) {
      return decodeURIComponent(results[2].replace(/\+/g, " "));
    }
    return null;
  }
}

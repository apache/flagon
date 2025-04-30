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

export class Config {
  public autostart: boolean = false;
  public authHeader: Settings.AuthHeader = null;
  public browserSessionId: Settings.SessionId = null;
  public custIndex: Settings.CustomIndex = null;
  public headers: Settings.Headers = null;
  public httpSessionId: Settings.SessionId = null;
  public logCountThreshold: number = 5;
  public logDetails: boolean = false;
  public on: boolean = false;
  public resolution: number = 500;
  public sessionId: Settings.SessionId = null;
  public time: Settings.TimeFunction = () => Date.now();
  public toolName: Settings.ToolName = null;
  public toolVersion: Settings.Version = null;
  public transmitInterval: number = 0;
  public url: string = "http://localhost:8000";
  public userFromParams: Settings.UserFromParams = null;
  public useraleVersion: Settings.Version = null;
  public userId: Settings.UserId = null;
  public version: Settings.Version = null;

  constructor(config: Partial<Settings.Config>) {
    this.sessionId = this.getSessionId(
      "userAlesessionId",
      "session_" + String(Date.now()),
    );

    this.httpSessionId = this.getSessionId(
      "userAleHttpSessionId",
      this.generateHttpSessionId(),
    );

    this.timeStampScale(document.createEvent("CustomEvent"));

    this.update(config);
  }

  /**
   * Defines sessionId, stores it in sessionStorage, checks to see if there is a sessionId in
   * storage when script is started. This prevents events like 'submit', which refresh page data
   * from refreshing the current user session.
   */
  private getSessionId(sessionKey: string, value: any): string {
    if (window.sessionStorage.getItem(sessionKey) === null) {
      window.sessionStorage.setItem(sessionKey, JSON.stringify(value));
      return value;
    }

    return JSON.parse(window.sessionStorage.getItem(sessionKey) || "");
  }

  /**
   * Creates a function to normalize the timestamp of the provided event.
   * @param  {Event} e An event containing a timeStamp property.
   * @return {Settings.TimeFunction} The timestamp normalizing function.
   */
  private timeStampScale(e: Event): Settings.TimeFunction {
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
   * Creates a cryptographically random string to represent this HTTP session.
   * @return {String} A random 32-digit hex string.
   */
  private generateHttpSessionId(): string {
    // 32 digit hex -> 128 bits of info -> 2^64 ~= 10^19 sessions needed for 50% chance of collision
    const len = 32;
    const arr = new Uint8Array(len / 2);
    window.crypto.getRandomValues(arr);
    return Array.from(arr, (dec) => {
      return dec.toString(16).padStart(2, "0");
    }).join("");
  }

  /**
   * Shallow merges a newConfig with the configuration class, updating it.
   * Retrieves/updates the userid if userFromParams is provided.
   * @param  {Partial<Settings.Config>} newConfig Configuration object to merge into the current config.
   */
  public update(newConfig: Partial<Settings.Config>): void {
    const self = this as unknown as Settings.Config;

    (Object.keys(newConfig) as (keyof Settings.Config)[]).forEach((key) => {
      const value = newConfig[key];
      if (value !== undefined) {
        self[key] = value;
      }
    });
  }

  /**
   * Attempts to extract the userid from the query parameters of the URL.
   * @param  {string} param The name of the query parameter containing the userid.
   * @return {string | null}       The extracted/decoded userid, or null if none is found.
   */
  public getUserId(param?: string) {
    if( this.userFromParams) {
      const userField = param;
      const regex = new RegExp("[?&]" + userField + "(=([^&#]*)|&|#|$)");
      const results = window.location.href.match(regex);
  
      if (results && results[2]) {
        return decodeURIComponent(results[2].replace(/\+/g, " "));
      }
      return null;
    } else {
      return this.userId
    }
  }

}

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
declare namespace Settings {
  type Version = string | null;
  type UserId = string | null;
  type SessionId = string | null;
  type UserFromParams = string | null;
  type ToolName = string | null;
  type AuthHeader = CallableFunction | string | null;
  type CustomIndex = string | null;
  type HeaderObject = { [key: string]: string };
  type Headers = HeaderObject | null;
  type ConfigValueTypes =
    | string
    | number
    | boolean
    | null
    | Version
    | UserId
    | SessionId
    | UserFromParams
    | ToolName
    | AuthHeader
    | CustomIndex
    | Headers;

  type TimeFunction = (() => number) | ((ts: number) => number);

  export interface DefaultConfig {
    [key: string]: ConfigValueTypes;
  }

  export interface Config extends DefaultConfig {
    autostart: boolean;
    authHeader: AuthHeader;
    browserSessionId: SessionId;
    custIndex: CustomIndex;
    headers: Headers;
    httpSessionId: SessionId;
    logCountThreshold: number;
    logDetails: boolean;
    on?: boolean;
    resolution: number;
    sessionId: SessionId;
    time: TimeFunction;
    toolName: ToolName;
    toolVersion?: Version;
    transmitInterval: number;
    url: string;
    userFromParams: UserFromParams;
    useraleVersion: Version;
    userId: UserId;
    version?: Version;
    websocketsEnabled?: boolean;
  }

  export interface IConfiguration extends Config {
    getInstance(): Configuration;
    configure(newConfig: Config): void;
  }
}

// TODO: Switch to protobuf for managing log types
declare namespace Logging {
  type JSONObject = {
    [key: string]:
      | string
      | number
      | boolean
      | null
      | undefined
      | JSONObject
      | Array<string | number | boolean | null | JSONObject>;
  };
  export type Log = JSONObject; // TODO: Intersect this with the default log objects (raw & interval)
  export type CustomLog = JSONObject;

  export type DynamicDetailFunction<E extends Event = Event> = (
    e: E,
  ) => JSONObject;
  export type StaticDetailFunction = () => JSONObject;
}

declare namespace Events {
  type FormElement = HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;
  type ChangeEvent = Event<FormElement>;
  export type RawEvents =
    | "dblclick"
    | "mouseup"
    | "mousedown"
    | "dragstart"
    | "dragend"
    | "drag"
    | "drop"
    | "keydown";
  export type IntervalEvents =
    | "click"
    | "focus"
    | "blur"
    | "input"
    | "change"
    | "mouseover"
    | "submit";
  export type WindowEvents = "load" | "blur" | "focus";
  export type BufferedEvents = "wheel" | "scroll" | "resize";
  export type RefreshEvents = "submit";
  export type AllowedEvents =
    | RawEvents
    | IntervalEvents
    | WindowEvents
    | BufferedEvents
    | RefreshEvents;

  export type EventDetailsMap<T extends string> = Partial<{
    [key in T]:
      | Logging.DynamicDetailFunction<
          | MouseEvent
          | KeyboardEvent
          | InputEvent
          | Events.ChangeEvent
          | WheelEvent
        >
      | Logging.StaticDetailFunction
      | null;
  }>;

  export type EventBoolMap<T extends string> = Partial<{
    [key in T]: boolean;
  }>;
}

declare namespace Callbacks {
  export type AuthCallback = () => string;
  export type HeadersCallback = () => Settings.HeaderObject;

  export type CallbackMap = {
    [key in string]: CallableFunction;
  };
}

/**
 * Defines the way information is extracted from various events.
 * Also defines which events we will listen to.
 * @param  {Settings.Config} options UserALE Configuration object to read from.
 * @param   {Events.AllowedEvents}    type of html event (e.g., 'click', 'mouseover', etc.), such as passed to addEventListener methods.
 */
declare function defineCustomDetails(options: Settings.DefaultConfig, type: Events.AllowedEvents): Logging.DynamicDetailFunction | null | undefined;

/**
 * Registers the provided callback to be used when updating the auth header.
 * @param {Callbacks.AuthCallback} callback Callback used to fetch the newest header. Should return a string.
 * @returns {boolean} Whether the operation succeeded.
 */
declare function registerAuthCallback(callback: Callbacks.AuthCallback): boolean;

/**
 * Adds named callbacks to be executed when logging.
 * @param  {Object } newCallbacks An object containing named callback functions.
 */
declare function addCallbacks(...newCallbacks: Record<symbol | string, CallableFunction>[]): Callbacks.CallbackMap;
/**
 * Removes callbacks by name.
 * @param  {String[]} targetKeys A list of names of functions to remove.
 */
declare function removeCallbacks(targetKeys: string[]): void;
/**
 * Transforms the provided HTML event into a log and appends it to the log queue.
 * @param  {Event} e         The event to be logged.
 * @param  {Function} detailFcn The function to extract additional log parameters from the event.
 * @return {boolean}           Whether the event was logged.
 */
declare function packageLog(e: Event, detailFcn?: Logging.DynamicDetailFunction | null): boolean;
/**
 * Packages the provided customLog to include standard meta data and appends it to the log queue.
 * @param  {Logging.CustomLog} customLog        The behavior to be logged.
 * @param  {Logging.DynamicDetailFunction} detailFcn     The function to extract additional log parameters from the event.
 * @param  {boolean} userAction     Indicates user behavior (true) or system behavior (false)
 * @return {boolean}           Whether the event was logged.
 */
declare function packageCustomLog(customLog: Logging.CustomLog, detailFcn: Logging.DynamicDetailFunction | Logging.StaticDetailFunction, userAction: boolean): boolean;
/**
 * Builds a string CSS selector from the provided element
 * @param  {EventTarget} ele The element from which the selector is built.
 * @return {string}     The CSS selector for the element, or Unknown if it can't be determined.
 */
declare function getSelector(ele: EventTarget): string;
/**
 * Builds an array of elements from the provided event target, to the root element.
 * @param  {Event} e Event from which the path should be built.
 * @return {HTMLElement[]}   Array of elements, starting at the event target, ending at the root element.
 */
declare function buildPath(e: Event): string[];

declare let started: boolean;

declare const version: string;
/**
 * Used to start the logging process if the
 * autostart configuration option is set to false.
 */
declare function start(): void;
/**
 * Halts the logging process. Logs will no longer be sent.
 */
declare function stop(): void;
/**
 * Updates the current configuration
 * object with the provided values.
 * @param  {Partial<Settings.Config>} newConfig The configuration options to use.
 * @return {Settings.Config}           Returns the updated configuration.
 */
declare function options(newConfig: Partial<Settings.Config> | undefined): Settings.Config;
/**
 * Appends a log to the log queue.
 * @param  {Logging.CustomLog} customLog The log to append.
 * @return {boolean}          Whether the operation succeeded.
 */
declare function log(customLog: Logging.CustomLog | undefined): boolean;

export { Logging, addCallbacks, buildPath, defineCustomDetails as details, getSelector, log, options, packageCustomLog, packageLog, registerAuthCallback, removeCallbacks, start, started, stop, version };

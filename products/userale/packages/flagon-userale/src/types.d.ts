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
export declare namespace Settings {
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
export declare namespace Logging {
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

export declare namespace Events {
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

export declare namespace Callbacks {
  export type AuthCallback = () => string;
  export type HeadersCallback = () => Settings.HeaderObject;

  export type CallbackMap = {
    [key in string]: CallableFunction;
  };
}

export declare namespace Extension {
  export type PluginConfig = { urlWhitelist: string };
  export type ConfigPayload = {
    useraleConfig: Partial<Settings.Config>;
    pluginConfig: PluginConfig;
  };
}

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
  type TimeFunction = (() => number) | ((ts: number) => number);

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
    | Headers
    | TimeFunction;

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
  }

  export interface IConfiguration extends Config {
    getInstance(): Configuration;
    configure(newConfig: Config): void;
  }
}

export declare namespace Logging {
  type JSONValue =
    | string
    | number
    | boolean
    | null
    | undefined
    | { [key: string]: JSONValue }
    | JSONValue[];

  type JSONObject = { [key: string]: JSONValue };

  /** Fields shared by all log types. */
  interface BaseLog {
    pageUrl: string;
    pageTitle: string;
    pageReferrer: string;
    userAgent: string;
    clientTime: number;
    scrnRes: { width: number; height: number };
    logType: "raw" | "custom" | "interval";
    userAction: boolean;
    details: JSONObject | null;
    userId: string | null;
    toolVersion: string | null;
    toolName: string | null;
    useraleVersion: string | null;
    sessionId: string | null;
    httpSessionId: string | null;
    browserSessionId: string | null;
  }

  /** A raw log produced by a DOM event. */
  interface RawLog extends BaseLog {
    logType: "raw";
    target: string | null;
    path: string[];
    microTime: number;
    location: { x: number | null; y: number | null };
    type: string;
    attributes: JSONObject;
    style: JSONObject;
  }

  /** A developer-emitted custom log. */
  interface CustomLog extends BaseLog {
    logType: "custom";
    type: string;
    [key: string]: JSONValue;
  }

  /** An interval log summarising a run of repeated events. */
  interface IntervalLog extends BaseLog {
    logType: "interval";
    target: string | null;
    path: string[] | null;
    type: string | null;
    count: number;
    duration: number;
    startTime: number;
    endTime: number;
    targetChange: boolean;
    typeChange: boolean;
  }

  /** Union of all log shapes. Used as the element type of the log queue. */
  export type Log = RawLog | CustomLog | IntervalLog;

  /** Arbitrary log passed directly to the queue via the public log() API. */
  export type UserLog = JSONObject;

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

/**
 * OTLP/HTTP JSON types compliant with OTLP Specification 1.10.0.
 * All 64-bit integer fields (timeUnixNano, etc.) are decimal strings per spec.
 * traceId is a 32-char hex string; spanId is a 16-char hex string.
 */
export declare namespace OTLP {
  export type AnyValue =
    | { stringValue: string }
    | { boolValue: boolean }
    | { intValue: string }
    | { doubleValue: number }
    | { arrayValue: { values: AnyValue[] } }
    | { kvlistValue: { values: KeyValue[] } }
    | { bytesValue: string };

  export type KeyValue = { key: string; value: AnyValue };

  export interface Resource {
    attributes: KeyValue[];
    droppedAttributesCount?: number;
  }

  export interface InstrumentationScope {
    name: string;
    version: string;
    attributes?: KeyValue[];
  }

  export interface LogRecord {
    timeUnixNano: string;
    observedTimeUnixNano: string;
    severityNumber: number;
    severityText: string;
    eventName: string;
    body: AnyValue;
    attributes: KeyValue[];
    droppedAttributesCount?: number;
    traceId: string;
    spanId: string;
    flags?: number;
  }

  export interface ScopeLogs {
    scope: InstrumentationScope;
    logRecords: LogRecord[];
    schemaUrl: string;
  }

  export interface ResourceLogs {
    resource: Resource;
    scopeLogs: ScopeLogs[];
    schemaUrl: string;
  }

  export interface ExportLogsServiceRequest {
    resourceLogs: ResourceLogs[];
  }

  export interface Span {
    traceId: string;
    spanId: string;
    parentSpanId?: string;
    traceState?: string;
    name: string;
    kind: number;
    startTimeUnixNano: string;
    endTimeUnixNano: string;
    attributes: KeyValue[];
    droppedAttributesCount?: number;
    status?: { code: number; message?: string };
  }

  export interface ScopeSpans {
    scope: InstrumentationScope;
    spans: Span[];
    schemaUrl: string;
  }

  export interface ResourceSpans {
    resource: Resource;
    scopeSpans: ScopeSpans[];
    schemaUrl: string;
  }

  export interface ExportTraceServiceRequest {
    resourceSpans: ResourceSpans[];
  }

  export interface Payloads {
    /** POST to /v1/logs — undefined if no log records in batch */
    logs: ExportLogsServiceRequest | undefined;
    /** POST to /v1/traces — undefined if no spans in batch */
    traces: ExportTraceServiceRequest | undefined;
  }
}

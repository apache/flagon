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

type ExporterType =
  | "http-json"
  | "v2-json"
  | "proto-json"
  | "otlp"
  | "otlp-json"
  | "otel-sdk"
  | "websocket"
  | "custom";
interface ExportOptions {
  keepalive?: boolean;
  retries?: number;
}
interface ExportResult {
  success: boolean;
  error?: Error;
}
interface LogExporter {
  export(
    logs: Array<Logging.Log>,
    options?: ExportOptions,
  ): Promise<ExportResult>;
  flush?(): Promise<void>;
  shutdown?(): Promise<void>;
}

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

/**
 * Minimal duck-typed interface matching @opentelemetry/api-logs Logger.
 * Avoids taking a runtime dependency on @opentelemetry/api-logs.
 */
interface OtelLogsApiLogger {
  emit(logRecord: {
    timestamp?: number;
    observedTimestamp?: number;
    severityNumber?: number;
    severityText?: string;
    eventName?: string;
    body?: unknown;
    attributes?: Record<string, unknown>;
  }): void;
}
/**
 * Bridges UserALE logs directly into an existing OpenTelemetry JS Logs SDK
 * Logger instance (`@opentelemetry/api-logs`), allowing applications that
 * already configure an OpenTelemetry LoggerProvider to emit UserALE events
 * through their shared OTel pipeline and processors.
 */
declare class OtelSdkExporter implements LogExporter {
  private logger;
  constructor(logger: OtelLogsApiLogger);
  export(logs: Array<Logging.Log>): Promise<ExportResult>;
}

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

declare namespace Settings {
  type Version = string | null;
  type UserId = string | null;
  type SessionId = string | null;
  type UserFromParams = string | null;
  type ToolName = string | null;
  type AuthHeader = CallableFunction | string | null;
  type ApiKey = string | null;
  type CustomIndex = string | null;
  type HeaderObject = { [key: string]: string };
  type Headers = HeaderObject | null;
  type ExporterType =
    | "http-json"
    | "v2-json"
    | "proto-json"
    | "otlp"
    | "otlp-json"
    | "otel-sdk"
    | "websocket"
    | "custom";
  type CustomExporter = LogExporter | null;
  type OtlpEndpoint = string | null;
  type TraceContextCallback =
    (() => { traceId?: string; spanId?: string } | null) | null;
  type DomSelectorMode = "full" | "structural" | "none";
  type PrivacyPreset = "default" | "strict";

  export interface PrivacyOptions {
    preset?: PrivacyPreset;
    allowlistSelector?: string | null;
    capturePageUrl?: boolean;
    capturePageTitle?: boolean;
    capturePageReferrer?: boolean;
    captureHost?: boolean;
    captureUserAgent?: boolean;
    captureScreenRes?: boolean;
    captureLocation?: boolean;
    captureTargetRect?: boolean;
    captureDetails?: boolean;
    captureMicroTime?: boolean;
    attachTraceContext?: boolean;
    ignoreUntrustedEvents?: boolean;
    domSelectorMode?: DomSelectorMode;
    allowedAttributes?: string[] | null;
  }

  export interface ResolvedPrivacyOptions {
    preset: PrivacyPreset;
    allowlistSelector: string | null;
    capturePageUrl: boolean;
    capturePageTitle: boolean;
    capturePageReferrer: boolean;
    captureHost: boolean;
    captureUserAgent: boolean;
    captureScreenRes: boolean;
    captureLocation: boolean;
    captureTargetRect: boolean;
    captureDetails: boolean;
    captureMicroTime: boolean;
    attachTraceContext: boolean;
    ignoreUntrustedEvents: boolean;
    domSelectorMode: DomSelectorMode;
    allowedAttributes: string[] | null;
  }

  type ConfigValueTypes =
    | string
    | number
    | boolean
    | null
    | undefined
    | string[]
    | Version
    | UserId
    | SessionId
    | UserFromParams
    | ToolName
    | AuthHeader
    | ApiKey
    | CustomIndex
    | Headers
    | ExporterType
    | CustomExporter
    | OtlpEndpoint
    | OtelLogsApiLogger
    | PrivacyOptions
    | ResolvedPrivacyOptions
    | TraceContextCallback;

  type TimeFunction = (() => number) | ((ts: number) => number);

  export interface DefaultConfig {
    [key: string]: ConfigValueTypes;
  }

  export interface Config extends DefaultConfig {
    autostart: boolean;
    apiKey: ApiKey;
    authHeader: AuthHeader;
    browserSessionId: SessionId;
    custIndex: CustomIndex;
    events?: string[] | null;
    exporter?: CustomExporter;
    exporterFormat?: ExporterType;
    exporterType?: ExporterType;
    headers: Headers;
    httpSessionId: SessionId;
    logCountThreshold: number;
    logDetails: boolean;
    maxQueueSize?: number;
    observeMutations?: boolean;
    on?: boolean;
    otelLogger?: OtelLogsApiLogger | null;
    otlpEndpoint?: OtlpEndpoint;
    persistSession?: boolean;
    privacy?: PrivacyOptions | null;
    resolution: number;
    sessionId: SessionId;
    time: TimeFunction;
    toolName: ToolName;
    toolVersion?: Version;
    traceContext?: TraceContextCallback;
    transmitInterval: number;
    url: string;
    userFromParams: UserFromParams;
    useraleVersion: Version;
    userId: UserId;
    version?: Version;
    websocketsEnabled?: boolean;
  }

  export interface IConfiguration extends Config {
    getInstance(): IConfiguration;
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

  export type DynamicDetailFunction<E extends Event = Event> = {
    bivarianceHack(e: E): JSONObject | null;
  }["bivarianceHack"];
  export type StaticDetailFunction = () => JSONObject | null;
}

declare namespace Events {
  type FormElement = HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;
  type ChangeEvent = Event & { readonly target: FormElement };
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
    "click" | "focus" | "blur" | "input" | "change" | "mouseover" | "submit";
  export type WindowEvents = "load" | "blur" | "focus";
  export type BufferedEvents = "wheel" | "scroll" | "resize";
  export type RefreshEvents = "submit";
  export type AllowedEvents =
    RawEvents | IntervalEvents | WindowEvents | BufferedEvents | RefreshEvents;

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

/*!
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

interface InitialSettingsOverrides {
  persistSession?: boolean;
  sessionId?: string | null;
  autostart?: boolean;
  skipScriptTag?: boolean;
}

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

declare class Configuration {
  [key: string]: Settings.ConfigValueTypes;
  private static instance;
  private initialized;
  apiKey: Settings.ApiKey;
  autostart: boolean;
  authHeader: Settings.AuthHeader;
  browserSessionId: Settings.SessionId;
  custIndex: Settings.CustomIndex;
  events: string[] | null;
  exporter: Settings.CustomExporter;
  exporterFormat: Settings.ExporterType;
  exporterType: Settings.ExporterType;
  headers: Settings.Headers;
  httpSessionId: Settings.SessionId;
  logCountThreshold: number;
  logDetails: boolean;
  maxQueueSize: number;
  observeMutations: boolean;
  on: boolean;
  otelLogger: OtelLogsApiLogger | null;
  otlpEndpoint: Settings.OtlpEndpoint;
  persistSession: boolean;
  privacy: Readonly<Settings.ResolvedPrivacyOptions>;
  resolution: number;
  sessionId: Settings.SessionId;
  time: Settings.TimeFunction;
  toolName: Settings.ToolName;
  toolVersion: Settings.Version;
  traceContext: Settings.TraceContextCallback;
  transmitInterval: number;
  url: string;
  userFromParams: Settings.UserFromParams;
  useraleVersion: Settings.Version;
  userId: Settings.UserId;
  version: Settings.Version;
  websocketsEnabled: boolean;
  private constructor();
  static getInstance(): Configuration;
  static createUninitialized(): Configuration;
  static create(overrides?: InitialSettingsOverrides): Configuration;
  isInitialized(): boolean;
  lockPrivacy(): void;
  isPrivacyLocked(): boolean;
  getResolvedPrivacy(): Settings.ResolvedPrivacyOptions;
  isAllowlistSelectorInvalid(): boolean;
  hasExplicitExporterMode(): boolean;
  initialize(overrides?: InitialSettingsOverrides): void;
  /**
   * Resets the configuration to its initial state.
   */
  reset(overrides?: InitialSettingsOverrides): void;
  /**
   * Merges `newConfig` into the configuration instance, updating privacy policy
   * first and enforcing locked-mode and prototype-pollution guards.
   * @param  {Partial<Settings.Config>} newConfig Configuration object to merge into the current config.
   */
  update(newConfig: Partial<Settings.Config>): void;
  private applyUpdate;
  /**
   * Attempts to extract the userid from the query parameters of the URL.
   * @param  {string} param The name of the query parameter containing the userid.
   * @return {string | null}       The extracted/decoded userid, or null if none is found.
   */
  static getUserIdFromParams(param: string): string | null;
}

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

/**
 * Zero-dependency browser metadata detection (#108).
 * Uses User-Agent Client Hints (navigator.userAgentData) when available,
 * falling back to lightweight User-Agent string parsing.
 */
declare function detectBrowser(): {
  browser: string | null;
  version: string | null;
};
interface TargetRect {
  x: number;
  y: number;
  width: number;
  height: number;
}
/**
 * Safely extracts the bounding client rectangle for an event target on discrete
 * user interactions (click, dblclick, change, submit).
 */
declare function getTargetRect(target: EventTarget | null): TargetRect | null;
/**
 * Builds a string CSS selector from the provided element.
 */
declare function getSelector(
  ele: EventTarget,
  mode?: Settings.DomSelectorMode,
): string;
/**
 * Builds an array of elements from the provided event target, to the root element.
 */
declare function buildPath(e: Event, mode?: Settings.DomSelectorMode): string[];

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

/**
 * Builds the HTTP headers for outgoing log requests, unifying
 * Authorization (callback or static), x-api-key, and custom headers
 * without mutating dynamic callback credentials back onto config.
 * @param  {Configuration} config Configuration object.
 * @return {Headers}              Constructed Fetch Headers instance.
 */
declare function buildHeaders(config: Configuration): Headers;

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

declare class HttpJsonExporter implements LogExporter {
  private config;
  constructor(config: Configuration);
  protected serialize(logs: Array<Logging.Log>): string;
  protected getEndpoint(): string;
  export(
    logs: Array<Logging.Log>,
    options?: ExportOptions,
  ): Promise<ExportResult>;
  flush(): Promise<void>;
  shutdown(): Promise<void>;
}

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

interface OtlpKeyValue {
  key: string;
  value: OtlpAnyValue;
}
interface OtlpAnyValue {
  stringValue?: string;
  boolValue?: boolean;
  intValue?: string;
  doubleValue?: number;
  arrayValue?: {
    values: Array<OtlpAnyValue>;
  };
  kvlistValue?: {
    values: Array<OtlpKeyValue>;
  };
}
interface OtlpLogRecord {
  timeUnixNano: string;
  observedTimeUnixNano: string;
  severityNumber: number;
  severityText: string;
  eventName?: string;
  body?: OtlpAnyValue;
  attributes: Array<OtlpKeyValue>;
  traceId?: string;
  spanId?: string;
}
interface OtlpExportLogsServiceRequest {
  resourceLogs: Array<{
    resource: {
      attributes: Array<OtlpKeyValue>;
    };
    scopeLogs: Array<{
      scope: {
        name: string;
        version: string;
      };
      logRecords: Array<OtlpLogRecord>;
    }>;
  }>;
}
/**
 * Normalizes an OTLP HTTP endpoint URL. If the URL has an empty or root ("/")
 * pathname, appends "/v1/logs" automatically. Custom paths are preserved.
 */
declare function resolveOtlpLogsEndpoint(rawUrl: string): string;
/**
 * Converts an arbitrary JavaScript value into an OTLP/JSON AnyValue object.
 */
declare function toOtlpAnyValue(val: unknown): OtlpAnyValue;
/**
 * Computes a base-10 nanosecond UNIX timestamp string using BigInt arithmetic
 * to avoid IEEE-754 double precision loss beyond Number.MAX_SAFE_INTEGER.
 */
declare function toUnixNanoString(
  clientTimeMs: unknown,
  microTime?: unknown,
): string;
/**
 * Builds the OTLP Resource attributes hoisted from the batch and configuration.
 */
declare function buildOtlpResourceAttributes(
  logs: Array<Logging.Log>,
  config?: Configuration,
): Array<OtlpKeyValue>;
/**
 * Converts a single UserALE log entry into an OTLP LogRecord.
 */
declare function toOtlpLogRecord(
  log: Logging.Log,
  config?: Configuration,
): OtlpLogRecord;
/**
 * Converts a batch of UserALE logs into an OTLP/JSON ExportLogsServiceRequest payload.
 */
declare function toOtlpExportLogsServiceRequest(
  logs: Array<Logging.Log>,
  config?: Configuration,
): OtlpExportLogsServiceRequest;
/**
 * Exports UserALE log batches in OpenTelemetry OTLP/JSON (ExportLogsServiceRequest)
 * format over HTTP/HTTPS.
 */
declare class OtlpJsonExporter extends HttpJsonExporter {
  private otlpConfig;
  constructor(config: Configuration);
  protected getEndpoint(): string;
  protected serialize(logs: Array<Logging.Log>): string;
}

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

/**
 * Converts a flat UserALE log entry into the proto3 canonical JSON structure
 * defined by apache.flagon.userale.v1.UserALELog in log.proto (#142, #143).
 */
declare function toProtoUserALELog(
  log: Logging.Log,
  config?: Configuration,
): Logging.JSONObject;
/**
 * Converts an array of UserALE logs into an apache.flagon.userale.v1.LogBatch
 * proto3 JSON object.
 */
declare function toProtoLogBatch(
  logs: Array<Logging.Log>,
  config?: Configuration,
): Logging.JSONObject;
/**
 * Exporter that serializes UserALE logs using the apache.flagon.userale.v1
 * Protobuf JSON schema (#142, #143) with zero runtime protobuf dependencies.
 */
declare class ProtoJsonExporter extends HttpJsonExporter {
  private protoConfig;
  constructor(config: Configuration);
  protected serialize(logs: Array<Logging.Log>): string;
}

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

declare class WebSocketExporter implements LogExporter {
  private wsock;
  private pendingPayloads;
  constructor(config: Configuration);
  private drainPending;
  export(logs: Array<Logging.Log>): Promise<ExportResult>;
  flush(): Promise<void>;
  shutdown(): Promise<void>;
}

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

/**
 * Factory that creates the appropriate LogExporter for the given configuration.
 */
declare function createExporter(config: Configuration): LogExporter;

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

/**
 * Standard rrweb-compatible event frame structure.
 * In rrweb: type 2 = FullSnapshot, type 3 = IncrementalSnapshot, type 4 = Meta.
 */
interface ReplayFrame {
  type: number;
  data: unknown;
  timestamp: number;
  [key: string]: unknown;
}
type ReplayRecorderFn = (options: {
  emit: (event: ReplayFrame, isCheckout?: boolean) => void;
  checkoutEveryNms?: number;
  maskAllInputs?: boolean;
  maskAllText?: boolean;
  blockSelector?: string;
  maskTextSelector?: string;
  [key: string]: unknown;
}) => (() => void) | undefined;
interface ReplayEnvelope {
  logType: "replay";
  type: "session_replay";
  trigger: string;
  sessionId: string | null;
  httpSessionId: string | null;
  browserSessionId: string | null;
  pageUrl: string;
  startTime: number;
  endTime: number;
  frameCount: number;
  frames: Array<ReplayFrame>;
  traceId?: string;
  spanId?: string;
}
interface SessionReplayOptions {
  /**
   * Optional rrweb.record-compatible function for Layer 2 visual DOM replay.
   */
  recorder?: ReplayRecorderFn;
  /**
   * Rolling ring-buffer duration in milliseconds (default: 30000).
   */
  maxDurationMs?: number;
  /**
   * Maximum number of frames retained in the ring buffer (default: 2000).
   */
  maxFrames?: number;
  /**
   * Maximum total serialized UTF-8 byte budget retained in the ring buffer (default: 5 MiB).
   */
  maxBytes?: number;
  /**
   * Enable Layer 1 MutationObserver structural DOM telemetry (default: true).
   */
  observeMutations?: boolean;
  /**
   * Enable automatic rage-click detection and replay trigger (default: true).
   */
  detectRageClicks?: boolean;
  /**
   * Enable automatic window error / unhandledrejection replay trigger (default: true).
   */
  flushOnError?: boolean;
  /**
   * CSS selector for DOM subtrees ignored by MutationObserver and rrweb.
   */
  ignoreSelector?: string;
  /**
   * CSS selector for elements whose text should be masked in rrweb.
   */
  maskTextSelector?: string;
  /**
   * Mask all text nodes in rrweb (`maskTextSelector: "*"`).
   */
  maskAllText?: boolean;
  /**
   * Mask all input values in rrweb (default: true).
   */
  maskAllInputs?: boolean;
  /**
   * Optional custom callback invoked when a replay envelope is flushed.
   */
  onFlush?: (envelope: ReplayEnvelope) => void | Promise<void>;
}
/**
 * Rolling ring buffer for rrweb-compatible DOM replay frames.
 * Preserves the most recent Meta (type 4) and FullSnapshot (type 2) anchor frames
 * so flushed slices are always playable by rrweb-player.
 */
declare class ReplayRingBuffer {
  private maxDurationMs;
  private maxFrames;
  private maxBytes;
  private frames;
  private head;
  private totalBytes;
  private anchorMeta;
  private anchorFullSnapshot;
  constructor(maxDurationMs?: number, maxFrames?: number, maxBytes?: number);
  push(frame: ReplayFrame, isCheckout?: boolean): void;
  prune(now?: number): void;
  getSnapshotFrames(): Array<ReplayFrame>;
  clear(): void;
  size(): number;
}
interface ClickSample {
  target: string;
  timestamp: number;
  x: number | null;
  y: number | null;
}
/**
 * Detects rage clicks (3+ rapid clicks on the same selector within 1000ms and 30px radius).
 */
declare class RageClickDetector {
  private clicks;
  private windowMs;
  private threshold;
  private radiusPx;
  constructor(windowMs?: number, threshold?: number, radiusPx?: number);
  recordClick(sample: ClickSample): {
    isRageClick: boolean;
    clickCount: number;
  };
  reset(): void;
}

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

interface UserAleInstance {
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
  getSelector: typeof getSelector;
  buildPath: typeof buildPath;
  detectBrowser: typeof detectBrowser;
  getTargetRect: typeof getTargetRect;
  lockPrivacy: () => void;
  isPrivacyLocked: () => boolean;
}
/**
 * Creates an encapsulated, isolated UserALE client instance safe for
 * multi-instance SPAs, micro-frontends, and strict privacy opt-in workflows.
 */
declare function createUserAle(
  initialOptions?: Partial<Settings.Config>,
): UserAleInstance;

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

/**
 * Registers the provided callback to be used when updating the auth header.
 * @param {Callbacks.AuthCallback} callback Callback used to fetch the newest header. Should return a string.
 * @returns {boolean} Whether the operation succeeded.
 */
declare function registerAuthCallback(
  callback: Callbacks.AuthCallback,
): boolean;
/**
 * Resets the authCallback to null. Used for primarily for testing, but could be used
 * to remove the callback in production.
 * @returns {void}
 */
declare function resetAuthCallback(): void;

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

/**
 * Registers the provided callback to be used when updating the auth header.
 * @param {Callbacks.HeadersCallback} callback Callback used to fetch the newest headers. Should return an object.
 * @returns {boolean} Whether the operation succeeded.
 */
declare function registerHeadersCallback(
  callback: Callbacks.HeadersCallback,
): boolean;
/**
 * Resets the authCallback to null. Used for primarily for testing, but could be used
 * to remove the callback in production.
 * @returns {void}
 */
declare function resetHeadersCallback(): void;

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

declare let started: boolean;

declare function details(
  opts: Settings.DefaultConfig,
  type: Events.AllowedEvents,
): Logging.DynamicDetailFunction | null | undefined;

declare function addCallbacks(
  ...newCallbacks: Record<symbol | string, CallableFunction>[]
): Callbacks.CallbackMap;
declare function removeCallbacks(targetKeys: string[]): void;
declare function packageLog(
  e: Event,
  detailFcn?: Logging.DynamicDetailFunction | null,
): boolean;
declare function packageCustomLog(
  customLog: Logging.CustomLog,
  detailFcn: Logging.DynamicDetailFunction | Logging.StaticDetailFunction,
  userAction: boolean,
): boolean;

declare function registerExporter(exporter: LogExporter | null): boolean;
declare function startSessionReplay(options?: SessionReplayOptions): () => void;
declare function stopSessionReplay(): void;
declare function flushSessionReplay(
  trigger?: string,
): Promise<ReplayEnvelope | null>;
declare function getActiveReplayRingBuffer(): ReplayRingBuffer | null;

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
 * Flushes all queued logs through the active exporter and resolves on completion.
 */
declare function flush(): Promise<void>;
/**
 * Clears queued logs and resets tracked interval state.
 */
declare function reset(): void;
/**
 * Updates the current configuration
 * object with the provided values.
 * @param  {Partial<Settings.Config>} newConfig The configuration options to use.
 * @return {Settings.Config}           Returns the updated configuration.
 */
declare function options(newConfig?: Partial<Settings.Config>): Settings.Config;
/**
 * Appends a log to the log queue.
 * @param  {Logging.CustomLog} customLog The log to append.
 * @return {boolean}          Whether the operation succeeded.
 */
declare function log(customLog?: Logging.CustomLog | null): boolean;
/**
 * Locks privacy settings on the active runtime to prevent post-init tampering.
 */
declare function lockPrivacy(): void;
/**
 * Returns whether privacy settings are currently locked.
 */
declare function isPrivacyLocked(): boolean;

export {
  type ExportOptions,
  type ExportResult,
  type ExporterType,
  HttpJsonExporter,
  type LogExporter,
  Logging,
  type OtelLogsApiLogger,
  OtelSdkExporter,
  type OtlpAnyValue,
  type OtlpExportLogsServiceRequest,
  OtlpJsonExporter,
  type OtlpKeyValue,
  type OtlpLogRecord,
  ProtoJsonExporter,
  RageClickDetector,
  type ReplayEnvelope,
  type ReplayFrame,
  type ReplayRecorderFn,
  ReplayRingBuffer,
  type SessionReplayOptions,
  Settings,
  type TargetRect,
  type UserAleInstance,
  WebSocketExporter,
  addCallbacks,
  buildHeaders,
  buildOtlpResourceAttributes,
  buildPath,
  createExporter,
  createUserAle,
  details,
  detectBrowser,
  flush,
  flushSessionReplay,
  getActiveReplayRingBuffer,
  getSelector,
  getTargetRect,
  isPrivacyLocked,
  lockPrivacy,
  log,
  options,
  packageCustomLog,
  packageLog,
  registerAuthCallback,
  registerExporter,
  registerHeadersCallback,
  removeCallbacks,
  reset,
  resetAuthCallback,
  resetHeadersCallback,
  resolveOtlpLogsEndpoint,
  start,
  startSessionReplay,
  started,
  stop,
  stopSessionReplay,
  toOtlpAnyValue,
  toOtlpExportLogsServiceRequest,
  toOtlpLogRecord,
  toProtoLogBatch,
  toProtoUserALELog,
  toUnixNanoString,
  version,
};

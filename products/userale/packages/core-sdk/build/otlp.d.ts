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
 * OTLP/HTTP JSON serialization for UserALE logs.
 * Compliant with OTLP Specification 1.10.0.
 *
 * Logs with logType "raw" or "custom" are emitted as OTLP LogRecords (POST /v1/logs).
 * Logs with logType "interval" are emitted as OTLP Spans (POST /v1/traces).
 */
import { Logging, OTLP } from "@/types";
/**
 * Generates a random 16-byte (32 hex char) trace ID using the Web Crypto API.
 */
export declare function generateTraceId(): string;
/**
 * Generates a random 8-byte (16 hex char) span ID using the Web Crypto API.
 */
export declare function generateSpanId(): string;
/**
 * Partitions a UserALE log batch into OTLP ExportLogsServiceRequest and
 * ExportTraceServiceRequest payloads, compliant with OTLP 1.10.0.
 *
 * @param logs     The batch of UserALE logs to serialize.
 * @param traceId  The active page-session trace ID (32 hex chars).
 * @param spanId   The active page-session root span ID (16 hex chars).
 * @param config   The active UserALE configuration (used for resource attributes).
 */
export declare function buildOtlpPayloads(logs: Logging.Log[], traceId: string, spanId: string, config: {
    toolName: string | null;
    toolVersion: string | null;
    useraleVersion: string | null;
    sessionId: string | null;
    userId: string | null;
}): OTLP.Payloads;
//# sourceMappingURL=otlp.d.ts.map
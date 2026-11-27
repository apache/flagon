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

import type { Logging } from "@/types";
import type { ExportResult, LogExporter } from "./types";

/**
 * Minimal duck-typed interface matching @opentelemetry/api-logs Logger.
 * Avoids taking a runtime dependency on @opentelemetry/api-logs.
 */
export interface OtelLogsApiLogger {
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

function isNonEmptyPlainObject(val: unknown): val is Record<string, unknown> {
  return (
    Boolean(val) &&
    typeof val === "object" &&
    !Array.isArray(val) &&
    Object.keys(val as Record<string, unknown>).length > 0
  );
}

/**
 * Bridges UserALE logs directly into an existing OpenTelemetry JS Logs SDK
 * Logger instance (`@opentelemetry/api-logs`), allowing applications that
 * already configure an OpenTelemetry LoggerProvider to emit UserALE events
 * through their shared OTel pipeline and processors.
 */
export class OtelSdkExporter implements LogExporter {
  private logger: OtelLogsApiLogger;

  constructor(logger: OtelLogsApiLogger) {
    this.logger = logger;
  }

  public async export(logs: Array<Logging.Log>): Promise<ExportResult> {
    try {
      for (const log of logs) {
        const logType = typeof log.logType === "string" ? log.logType : "raw";
        const eventType =
          typeof log.type === "string" && log.type.trim().length > 0
            ? log.type.trim()
            : logType;
        const eventName = `userale.${logType}.${eventType}`;

        const timestamp =
          typeof log.clientTime === "number" && Number.isFinite(log.clientTime)
            ? log.clientTime
            : typeof log.endTime === "number" && Number.isFinite(log.endTime)
              ? log.endTime
              : typeof log.startTime === "number" &&
                  Number.isFinite(log.startTime)
                ? log.startTime
                : Date.now();

        const attributes: Record<string, unknown> = {
          "event.name": eventName,
          "flagon.log_type": logType,
          "flagon.event_type": eventType,
        };

        if (typeof log.pageUrl === "string" && log.pageUrl.length > 0) {
          attributes["url.full"] = log.pageUrl;
        }
        if (typeof log.pageTitle === "string" && log.pageTitle.length > 0) {
          attributes["page.title"] = log.pageTitle;
        }
        if (
          typeof log.pageReferrer === "string" &&
          log.pageReferrer.length > 0
        ) {
          attributes["page.referrer"] = log.pageReferrer;
        }
        if (typeof log.userId === "string" && log.userId.length > 0) {
          attributes["user.id"] = log.userId;
        }
        if (typeof log.sessionId === "string" && log.sessionId.length > 0) {
          attributes["session.id"] = log.sessionId;
        }
        if (typeof log.target === "string" && log.target.length > 0) {
          attributes["flagon.target"] = log.target;
        }
        if (Array.isArray(log.path) && log.path.length > 0) {
          attributes["flagon.path"] = log.path;
        }
        if (typeof log.userAction === "boolean") {
          attributes["flagon.user_action"] = log.userAction;
        }

        const loc = log.location as
          { x?: number | null; y?: number | null } | undefined;
        if (loc && typeof loc === "object") {
          if (typeof loc.x === "number" && Number.isFinite(loc.x)) {
            attributes["flagon.location.x"] = loc.x;
          }
          if (typeof loc.y === "number" && Number.isFinite(loc.y)) {
            attributes["flagon.location.y"] = loc.y;
          }
        }

        if (isNonEmptyPlainObject(log.targetRect)) {
          attributes["flagon.target_rect"] = log.targetRect;
        }
        if (isNonEmptyPlainObject(log.attributes)) {
          attributes["flagon.element.attributes"] = log.attributes;
        }

        const hasNonEmptyBody =
          log.details !== undefined &&
          log.details !== null &&
          (typeof log.details !== "object" ||
            Array.isArray(log.details) ||
            Object.keys(log.details as Record<string, unknown>).length > 0);

        this.logger.emit({
          timestamp,
          observedTimestamp: timestamp,
          severityNumber: 9,
          severityText: "INFO",
          eventName,
          body: hasNonEmptyBody ? log.details : eventName,
          attributes,
        });
      }
      return { success: true };
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      return { success: false, error };
    }
  }
}

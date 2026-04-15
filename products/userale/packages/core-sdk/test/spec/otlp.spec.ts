/**
 * @jest-environment jsdom
 */
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

import "whatwg-fetch";
import { Configuration } from "@/Configuration";
import { Sender } from "@/Sender";
import type { Logging, OTLP } from "@/types";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeRawLog(overrides: Partial<Logging.RawLog> = {}): Logging.RawLog {
  return {
    logType: "raw",
    type: "click",
    pageUrl: "http://example.com/",
    pageTitle: "Test Page",
    pageReferrer: "",
    userAgent: "TestAgent/1.0",
    clientTime: 1700000000000,
    microTime: 0.123,
    scrnRes: { width: 1920, height: 1080 },
    userAction: true,
    details: null,
    userId: "user-1",
    toolVersion: "1.0.0",
    toolName: "test-tool",
    useraleVersion: "2.4.0",
    sessionId: "session-1",
    httpSessionId: "http-1",
    browserSessionId: null,
    target: "button#submit",
    path: ["button#submit", "form", "body"],
    location: { x: 100, y: 200 },
    attributes: { "data-action": "submit" },
    style: {},
    ...overrides,
  };
}

function makeIntervalLog(
  overrides: Partial<Logging.IntervalLog> = {},
): Logging.IntervalLog {
  return {
    logType: "interval",
    type: "mouseover",
    pageUrl: "http://example.com/",
    pageTitle: "Test Page",
    pageReferrer: "",
    userAgent: "TestAgent/1.0",
    clientTime: 1700000001000,
    scrnRes: { width: 1920, height: 1080 },
    userAction: false,
    details: null,
    userId: null,
    toolVersion: null,
    toolName: null,
    useraleVersion: "2.4.0",
    sessionId: "session-1",
    httpSessionId: "http-1",
    browserSessionId: null,
    target: "div#nav",
    path: ["div#nav", "body"],
    count: 42,
    duration: 5000,
    startTime: 1700000000000,
    endTime: 1700000005000,
    targetChange: false,
    typeChange: false,
    ...overrides,
  };
}

function makeCustomLog(
  overrides: Partial<Logging.CustomLog> = {},
): Logging.CustomLog {
  return {
    logType: "custom",
    type: "load",
    pageUrl: "http://example.com/",
    pageTitle: "Test Page",
    pageReferrer: "",
    userAgent: "TestAgent/1.0",
    clientTime: 1700000000000,
    scrnRes: { width: 1920, height: 1080 },
    userAction: false,
    details: { pageLoadTime: 350 },
    userId: null,
    toolVersion: null,
    toolName: null,
    useraleVersion: "2.4.0",
    sessionId: "session-1",
    httpSessionId: "http-1",
    browserSessionId: null,
    ...overrides,
  };
}

function unwrap(v: OTLP.AnyValue): unknown {
  if ("stringValue" in v) return v.stringValue;
  if ("boolValue" in v) return v.boolValue;
  if ("intValue" in v) return v.intValue;
  if ("doubleValue" in v) return v.doubleValue;
  if ("arrayValue" in v) return v.arrayValue.values.map(unwrap);
  if ("kvlistValue" in v) return v.kvlistValue.values;
  if ("bytesValue" in v) return v.bytesValue;
}

function attrValue(attrs: OTLP.KeyValue[], key: string): unknown {
  const kv = attrs.find((a) => a.key === key);
  return kv ? unwrap(kv.value) : undefined;
}

/** Parse the JSON body sent to a given OTLP endpoint from the fetch spy. */
function sentBody(
  fetchSpy: jest.SpyInstance,
  path: "/v1/logs" | "/v1/traces",
): unknown {
  const call = fetchSpy.mock.calls.find(([url]: [string]) =>
    url.includes(path),
  );
  return call ? JSON.parse(call[1].body as string) : undefined;
}

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

const config = Configuration.getInstance();
let sender: Sender;
let fetchSpy: jest.SpyInstance;

beforeEach(() => {
  config.reset();
  config.update({
    on: true,
    url: "http://localhost:4318",
    toolName: "test-tool",
    toolVersion: "1.0.0",
    sessionId: "session-abc123",
  });
  fetchSpy = jest
    .spyOn(global, "fetch")
    .mockResolvedValue(new Response(null, { status: 200 }));
  sender = new Sender();
  jest.useFakeTimers();
  sender.start([], config);
  jest.useRealTimers();
});

afterEach(() => {
  fetchSpy.mockRestore();
});

// ---------------------------------------------------------------------------
// Payload routing
// ---------------------------------------------------------------------------

describe("OTLP payload routing", () => {
  it("sends raw logs to /v1/logs only", async () => {
    await sender.flush([makeRawLog()], config);
    expect(fetchSpy.mock.calls.map(([url]: [string]) => url)).toEqual([
      "http://localhost:4318/v1/logs",
    ]);
  });

  it("sends custom logs to /v1/logs only", async () => {
    await sender.flush([makeCustomLog()], config);
    expect(fetchSpy.mock.calls.map(([url]: [string]) => url)).toEqual([
      "http://localhost:4318/v1/logs",
    ]);
  });

  it("sends interval logs to /v1/traces only", async () => {
    await sender.flush([makeIntervalLog()], config);
    expect(fetchSpy.mock.calls.map(([url]: [string]) => url)).toEqual([
      "http://localhost:4318/v1/traces",
    ]);
  });

  it("sends a mixed batch to both endpoints", async () => {
    await sender.flush(
      [makeRawLog(), makeIntervalLog(), makeCustomLog()],
      config,
    );
    const urls = fetchSpy.mock.calls.map(([url]: [string]) => url).sort();
    expect(urls).toEqual([
      "http://localhost:4318/v1/logs",
      "http://localhost:4318/v1/traces",
    ]);
  });

  it("makes no fetch calls for an empty batch", async () => {
    await sender.flush([], config);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("puts 2 log records and 1 span in a mixed batch", async () => {
    await sender.flush(
      [makeRawLog(), makeCustomLog(), makeIntervalLog()],
      config,
    );
    const logsBody = sentBody(
      fetchSpy,
      "/v1/logs",
    ) as OTLP.ExportLogsServiceRequest;
    const tracesBody = sentBody(
      fetchSpy,
      "/v1/traces",
    ) as OTLP.ExportTraceServiceRequest;
    expect(logsBody.resourceLogs[0].scopeLogs[0].logRecords).toHaveLength(2);
    expect(tracesBody.resourceSpans[0].scopeSpans[0].spans).toHaveLength(1);
  });
});

// ---------------------------------------------------------------------------
// LogRecord structure
// ---------------------------------------------------------------------------

describe("LogRecord serialization", () => {
  async function getRecord(
    log: Logging.RawLog | Logging.CustomLog,
  ): Promise<OTLP.LogRecord> {
    await sender.flush([log], config);
    const body = sentBody(
      fetchSpy,
      "/v1/logs",
    ) as OTLP.ExportLogsServiceRequest;
    return body.resourceLogs[0].scopeLogs[0].logRecords[0];
  }

  it("wires a hex traceId and spanId onto log records", async () => {
    const record = await getRecord(makeRawLog());
    expect(record.traceId).toMatch(/^[0-9a-f]{32}$/);
    expect(record.spanId).toMatch(/^[0-9a-f]{16}$/);
  });

  it("maps userAction=true → INFO (9), false → DEBUG (5)", async () => {
    const infoRecord = await getRecord(makeRawLog({ userAction: true }));
    expect(infoRecord.severityNumber).toBe(9);
    expect(infoRecord.severityText).toBe("INFO");

    fetchSpy.mockClear();
    const debugRecord = await getRecord(makeRawLog({ userAction: false }));
    expect(debugRecord.severityNumber).toBe(5);
    expect(debugRecord.severityText).toBe("DEBUG");
  });

  it("encodes timeUnixNano with microTime precision", async () => {
    const record = await getRecord(makeRawLog());
    const expected = String(
      BigInt(1700000000000) * 1_000_000n +
        BigInt(Math.round(0.123 * 1_000_000)),
    );
    expect(record.timeUnixNano).toBe(expected);
  });

  it("uses microTime=0 for custom logs", async () => {
    const record = await getRecord(makeCustomLog());
    expect(record.timeUnixNano).toBe(
      String(BigInt(1700000000000) * 1_000_000n),
    );
  });

  it("omits raw-only attributes from custom logs", async () => {
    const record = await getRecord(makeCustomLog());
    expect(
      record.attributes.find((a) => a.key === "userale.target"),
    ).toBeUndefined();
    expect(
      record.attributes.find((a) => a.key === "userale.location"),
    ).toBeUndefined();
  });

  it("omits userale.details when null, includes it when set", async () => {
    const withNull = await getRecord(makeRawLog({ details: null }));
    expect(
      withNull.attributes.find((a) => a.key === "userale.details"),
    ).toBeUndefined();

    fetchSpy.mockClear();
    const withDetails = await getRecord(
      makeRawLog({ details: { foo: "bar" } }),
    );
    expect(attrValue(withDetails.attributes, "userale.details")).toBeDefined();
  });

  it("encodes extra callback fields as catch-all attributes", async () => {
    const log = { ...makeRawLog(), customLabel: "my-label" } as Logging.Log;
    await sender.flush([log], config);
    const body = sentBody(
      fetchSpy,
      "/v1/logs",
    ) as OTLP.ExportLogsServiceRequest;
    const attrs = body.resourceLogs[0].scopeLogs[0].logRecords[0].attributes;
    expect(attrValue(attrs, "customLabel")).toBe("my-label");
  });
});

// ---------------------------------------------------------------------------
// Span structure
// ---------------------------------------------------------------------------

describe("Span serialization", () => {
  async function getSpan(log: Logging.IntervalLog): Promise<OTLP.Span> {
    await sender.flush([log], config);
    const body = sentBody(
      fetchSpy,
      "/v1/traces",
    ) as OTLP.ExportTraceServiceRequest;
    return body.resourceSpans[0].scopeSpans[0].spans[0];
  }

  it("generates a unique traceId and spanId per span", async () => {
    await sender.flush([makeIntervalLog(), makeIntervalLog()], config);
    const body = sentBody(
      fetchSpy,
      "/v1/traces",
    ) as OTLP.ExportTraceServiceRequest;
    const spans = body.resourceSpans[0].scopeSpans[0].spans;
    expect(spans[0].traceId).toMatch(/^[0-9a-f]{32}$/);
    expect(spans[0].spanId).toMatch(/^[0-9a-f]{16}$/);
    expect(spans[0].traceId).not.toBe(spans[1].traceId);
    expect(spans[0].spanId).not.toBe(spans[1].spanId);
  });

  it("sets startTimeUnixNano and endTimeUnixNano from startTime/endTime", async () => {
    const span = await getSpan(makeIntervalLog());
    expect(span.startTimeUnixNano).toBe(
      String(BigInt(1700000000000) * 1_000_000n),
    );
    expect(span.endTimeUnixNano).toBe(
      String(BigInt(1700000005000) * 1_000_000n),
    );
  });

  it("encodes interval-specific attributes", async () => {
    const span = await getSpan(makeIntervalLog());
    expect(attrValue(span.attributes, "userale.count")).toBe("42");
    expect(attrValue(span.attributes, "userale.targetChange")).toBe(false);
    expect(attrValue(span.attributes, "userale.typeChange")).toBe(false);
  });
});

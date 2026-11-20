/**
 * @jest-environment jsdom
 */
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
import "whatwg-fetch";
import { Configuration } from "@/configure";
import {
  buildHeaders,
  chunkLogsForKeepalive,
  createExporter,
  HttpJsonExporter,
  OtelSdkExporter,
  OtlpJsonExporter,
  ProtoJsonExporter,
  resolveOtlpLogsEndpoint,
  toOtlpExportLogsServiceRequest,
  toProtoLogBatch,
  toUnixNanoString,
  utf8ByteLength,
  WebSocketExporter,
} from "@/exporters";
import { LogBatchSchema, LogType } from "@/gen/apache/flagon/userale/v1/log_pb";
import { initSender, sendOnInterval } from "@/sendLogs";
import {
  registerAuthCallback,
  registerHeadersCallback,
  resetAuthCallback,
  resetHeadersCallback,
} from "@/utils";
import { fromJson } from "@bufbuild/protobuf";

import type { LogExporter, OtlpKeyValue } from "@/exporters";
import type { Logging } from "@/types";
import type { JsonValue } from "@bufbuild/protobuf";

const config = Configuration.getInstance();

describe("exporters", () => {
  beforeEach(() => {
    config.reset();
    resetAuthCallback();
    resetHeadersCallback();
  });

  describe("buildHeaders", () => {
    it("merges string authHeader, custom headers callback, and apiKey", () => {
      registerHeadersCallback(() => ({
        "x-custom": "val",
      }));
      config.update({
        authHeader: "Bearer test-token",
        apiKey: "api-key-123",
      });

      const headers = buildHeaders(config);
      expect(headers.get("Content-Type")).toBe(
        "application/json;charset=UTF-8",
      );
      expect(headers.get("Authorization")).toBe("Bearer test-token");
      expect(headers.get("x-api-key")).toBe("api-key-123");
      expect(headers.get("x-custom")).toBe("val");
    });

    it("supports callback authHeader", () => {
      registerAuthCallback(() => "Bearer dynamic-token");
      const headers = buildHeaders(config);
      expect(headers.get("Authorization")).toBe("Bearer dynamic-token");
    });
  });

  describe("createExporter factory", () => {
    it("creates HttpJsonExporter by default for http URLs", () => {
      config.update({ url: "http://localhost:8000" });
      const exporter = createExporter(config);
      expect(exporter).toBeInstanceOf(HttpJsonExporter);
    });

    it("creates WebSocketExporter for ws:// or wss:// URLs", () => {
      const wsSpy = jest.spyOn(global, "WebSocket").mockImplementation(
        () =>
          ({
            readyState: 1,
            send: jest.fn(),
            close: jest.fn(),
          }) as unknown as WebSocket,
      );
      config.update({ url: "ws://localhost:8000" });
      const exporter = createExporter(config);
      expect(exporter).toBeInstanceOf(WebSocketExporter);
      wsSpy.mockRestore();
    });

    it("creates ProtoJsonExporter when exporterType is 'proto-json'", () => {
      config.update({
        url: "http://localhost:8000",
        exporterType: "proto-json",
      });
      const exporter = createExporter(config);
      expect(exporter).toBeInstanceOf(ProtoJsonExporter);
    });

    it("creates OtlpJsonExporter when exporterType is 'otlp' or otlpEndpoint is set", () => {
      config.update({
        url: "http://localhost:4318",
        exporterType: "otlp",
      });
      expect(createExporter(config)).toBeInstanceOf(OtlpJsonExporter);

      config.reset();
      config.update({
        otlpEndpoint: "http://localhost:4318",
      });
      expect(createExporter(config)).toBeInstanceOf(OtlpJsonExporter);
    });

    it("returns custom config.exporter when provided", () => {
      const customExporter: LogExporter = {
        export: jest.fn().mockResolvedValue({ success: true }),
      };
      config.update({ exporter: customExporter });
      const exporter = createExporter(config);
      expect(exporter).toBe(customExporter);
    });

    it("routes sendOnInterval through custom config.exporter", () => {
      const customExporter: LogExporter = {
        export: jest.fn().mockResolvedValue({ success: true }),
      };
      config.update({
        on: true,
        transmitInterval: 100,
        logCountThreshold: 1,
        exporter: customExporter,
      });

      const logs: Array<Logging.Log> = [{ target: "button#submit" }];
      jest.useFakeTimers();
      initSender(logs, config);
      sendOnInterval(logs, config);

      jest.advanceTimersByTime(100);
      expect(customExporter.export).toHaveBeenCalledWith(
        [{ target: "button#submit" }],
        { retries: 0 },
      );
      jest.useRealTimers();
    });

    it("supports exporterFormat aliases ('v2-json', 'otlp-json')", () => {
      config.update({
        url: "http://localhost:4318",
        exporterFormat: "otlp-json",
      });
      expect(createExporter(config)).toBeInstanceOf(OtlpJsonExporter);

      config.reset();
      config.update({
        url: "http://localhost:8000",
        exporterFormat: "v2-json",
      });
      expect(createExporter(config)).toBeInstanceOf(HttpJsonExporter);
    });
  });

  describe("chunkLogsForKeepalive", () => {
    it("keeps small batches in a single chunk", () => {
      const logs = [{ id: 1 }, { id: 2 }];
      const chunks = chunkLogsForKeepalive(logs, (batch) =>
        JSON.stringify(batch),
      );
      expect(chunks).toHaveLength(1);
      expect(JSON.parse(chunks[0]!)).toEqual(logs);
    });

    it("splits batches that exceed MAX_KEEPALIVE_BYTES into multiple chunks", () => {
      const logs = Array.from({ length: 10 }, (_, i) => ({
        id: i,
        payload: "x".repeat(8000),
      }));
      const chunks = chunkLogsForKeepalive(logs, (batch) =>
        JSON.stringify(batch),
      );
      expect(chunks.length).toBeGreaterThan(1);
      const reassembled = chunks.flatMap(
        (chunk) => JSON.parse(chunk) as typeof logs,
      );
      expect(reassembled).toEqual(logs);
    });
  });

  describe("ProtoJsonExporter & Protobuf v1 contract (#142, #143)", () => {
    it("serializes raw, interval, and custom logs into valid apache.flagon.userale.v1.LogBatch JSON", () => {
      const rawLog: Logging.Log = {
        target: "button#buy",
        path: ["button#buy", "div.card", "body", "html"],
        pageUrl: "https://shop.example.com/product/42",
        pageTitle: "Shop Example",
        pageReferrer: "https://shop.example.com/",
        browser: { browser: "chrome", version: "125.0" },
        userAgent: "Mozilla/5.0 Chrome/125.0",
        clientTime: 1712000000000,
        scrnRes: { width: 1920, height: 1080 },
        microTime: 123.45,
        location: { x: 150, y: 320 },
        type: "click",
        logType: "raw",
        userAction: true,
        details: { button: 0, ctrl: false },
        userId: "user-42",
        toolVersion: "1.2.3",
        toolName: "shop-web",
        useraleVersion: "2.5.0",
        sessionId: "sess-abc",
        httpSessionId: "http-sess-1",
        browserSessionId: "browser-sess-1",
        attributes: { id: "buy", class: "btn primary" },
        style: { color: "rgb(255, 255, 255)" },
      };

      const intervalLog: Logging.Log = {
        target: "div.feed",
        path: ["div.feed", "body", "html"],
        pageUrl: "https://shop.example.com/product/42",
        pageTitle: "Shop Example",
        pageReferrer: "https://shop.example.com/",
        userAgent: "Mozilla/5.0 Chrome/125.0",
        count: 14,
        duration: 480,
        startTime: 1712000000000,
        endTime: 1712000000480,
        type: "mouseover",
        logType: "interval",
        targetChange: false,
        typeChange: false,
        userAction: false,
        userId: "user-42",
        toolVersion: "1.2.3",
        toolName: "shop-web",
        useraleVersion: "2.5.0",
        sessionId: "sess-abc",
        httpSessionId: "http-sess-1",
        browserSessionId: "browser-sess-1",
      };

      const customLog: Logging.Log = {
        pageUrl: "https://shop.example.com/product/42",
        pageTitle: "Shop Example",
        pageReferrer: "https://shop.example.com/",
        userAgent: "Mozilla/5.0 Chrome/125.0",
        clientTime: 1712000001000,
        scrnRes: { width: 1920, height: 1080 },
        logType: "custom",
        userAction: true,
        details: { checkoutStep: 2 },
        customLabel: "checkout_started",
        cartValue: 99.95,
        userId: "user-42",
        toolVersion: "1.2.3",
        toolName: "shop-web",
        useraleVersion: "2.5.0",
        sessionId: "sess-abc",
        httpSessionId: "http-sess-1",
        browserSessionId: "browser-sess-1",
      };

      const protoBatchJson = toProtoLogBatch([rawLog, intervalLog, customLog]);

      // Validate canonical Proto3 JSON deserialization against @bufbuild/protobuf LogBatchSchema
      const decoded = fromJson(
        LogBatchSchema,
        protoBatchJson as unknown as JsonValue,
      );
      expect(decoded.logs).toHaveLength(3);

      // 1. Raw log validation
      const first = decoded.logs[0]!;
      expect(first.logType).toBe(LogType.RAW);
      expect(first.log.case).toBe("raw");
      if (first.log.case === "raw") {
        expect(first.log.value.target).toBe("button#buy");
        expect(first.log.value.eventType).toBe("click");
        expect(first.log.value.path).toEqual([
          "button#buy",
          "div.card",
          "body",
          "html",
        ]);
        expect(first.log.value.location?.x).toBe(150);
        expect(first.log.value.location?.y).toBe(320);
        expect(first.log.value.microTime).toBe(123.45);
        expect(first.log.value.userAction).toBe(true);
        expect(first.log.value.metadata?.pageUrl).toBe(
          "https://shop.example.com/product/42",
        );
        expect(first.log.value.metadata?.clientTime).toBe(
          BigInt(1712000000000),
        );
        expect(first.log.value.metadata?.screenResolution?.width).toBe(1920);
        expect(first.log.value.metadata?.userId).toBe("user-42");
        expect(first.log.value.details).toEqual({
          button: 0,
          ctrl: false,
        });
        expect(first.log.value.attributes).toEqual({
          id: "buy",
          class: "btn primary",
        });
      }

      // 2. Interval log validation
      const second = decoded.logs[1]!;
      expect(second.logType).toBe(LogType.INTERVAL);
      expect(second.log.case).toBe("interval");
      if (second.log.case === "interval") {
        expect(second.log.value.target).toBe("div.feed");
        expect(second.log.value.count).toBe(14);
        expect(second.log.value.duration).toBe(BigInt(480));
        expect(second.log.value.startTime).toBe(BigInt(1712000000000));
        expect(second.log.value.endTime).toBe(BigInt(1712000000480));
      }

      // 3. Custom log validation
      const third = decoded.logs[2]!;
      expect(third.logType).toBe(LogType.CUSTOM);
      expect(third.log.case).toBe("custom");
      if (third.log.case === "custom") {
        expect(third.log.value.userAction).toBe(true);
        expect(third.log.value.details).toEqual({ checkoutStep: 2 });
        expect(third.log.value.customFields).toEqual({
          customLabel: "checkout_started",
          cartValue: 99.95,
        });
      }
    });

    it("exports LogBatch JSON over fetch when ProtoJsonExporter.export is called", async () => {
      const fetchSpy = jest
        .spyOn(global, "fetch")
        .mockResolvedValue(new Response(null, { status: 200 }));

      config.update({
        url: "http://localhost:8000",
        exporterType: "proto-json",
      });

      const exporter = new ProtoJsonExporter(config);
      const result = await exporter.export([
        {
          target: "a#nav",
          path: ["a#nav"],
          type: "click",
          logType: "raw",
          clientTime: 1712000000000,
          userAction: true,
        },
      ]);

      expect(result.success).toBe(true);
      expect(fetchSpy).toHaveBeenCalledTimes(1);
      const bodyStr = fetchSpy.mock.calls[0]![1]!.body as string;
      const parsed = JSON.parse(bodyStr) as JsonValue;
      const decoded = fromJson(LogBatchSchema, parsed);
      expect(decoded.logs).toHaveLength(1);
      expect(decoded.logs[0]!.logType).toBe(LogType.RAW);

      fetchSpy.mockRestore();
    });
  });

  describe("OtlpJsonExporter & OTLP/JSON mapping (#140)", () => {
    function getAttrMap(
      attrs: Array<OtlpKeyValue>,
    ): Record<string, OtlpKeyValue["value"]> {
      return Object.fromEntries(attrs.map((a) => [a.key, a.value]));
    }

    it("normalizes OTLP endpoints by appending /v1/logs only when path is empty or root", () => {
      expect(resolveOtlpLogsEndpoint("http://localhost:4318")).toBe(
        "http://localhost:4318/v1/logs",
      );
      expect(resolveOtlpLogsEndpoint("http://localhost:4318/")).toBe(
        "http://localhost:4318/v1/logs",
      );
      expect(
        resolveOtlpLogsEndpoint("https://collector.example.com/otel/v1/logs"),
      ).toBe("https://collector.example.com/otel/v1/logs");
    });

    it("computes nanosecond timestamps using BigInt without float precision loss", () => {
      expect(toUnixNanoString(1712000000000, 123.456)).toBe(
        "1712000000000456000",
      );
      expect(toUnixNanoString(1712000000000)).toBe("1712000000000000000");
    });

    it("hoists constant device/session fields to Resource and maps LogRecord with structured kvlistValue body", () => {
      config.update({
        toolName: "checkout-ui",
        toolVersion: "3.1.0",
        useraleVersion: "2.5.0",
      });

      const rawLog: Logging.Log = {
        target: "button#pay",
        path: ["button#pay", "form#checkout", "body"],
        pageUrl: "https://shop.example.com/pay",
        pageTitle: "Checkout",
        pageReferrer: "https://shop.example.com/cart",
        browser: { browser: "chrome", version: "125.0" },
        userAgent: "Mozilla/5.0 Chrome/125.0",
        clientTime: 1712000000000,
        microTime: 10.25,
        scrnRes: { width: 1440, height: 900 },
        location: { x: 42, y: 84 },
        type: "click",
        logType: "raw",
        userAction: true,
        details: { button: 0, ctrl: false, nested: { ok: true } },
        userId: "user-99",
        sessionId: "sess-xyz",
        httpSessionId: "http-xyz",
        browserSessionId: "browser-xyz",
        attributes: { "data-testid": "pay-btn" },
        style: { display: "inline-block" },
        traceId: "4bf92f3577b34da6a3ce929d0e0e4736",
        spanId: "00f067aa0ba902b7",
      };

      const payload = toOtlpExportLogsServiceRequest([rawLog], config);
      expect(payload.resourceLogs).toHaveLength(1);

      const resourceLog = payload.resourceLogs[0]!;
      const resAttrs = getAttrMap(resourceLog.resource.attributes);
      expect(resAttrs["service.name"]).toEqual({ stringValue: "checkout-ui" });
      expect(resAttrs["service.version"]).toEqual({ stringValue: "3.1.0" });
      expect(resAttrs["telemetry.sdk.name"]).toEqual({
        stringValue: "apache-flagon-userale",
      });
      expect(resAttrs["telemetry.sdk.language"]).toEqual({
        stringValue: "webjs",
      });
      expect(resAttrs["user_agent.original"]).toEqual({
        stringValue: "Mozilla/5.0 Chrome/125.0",
      });
      expect(resAttrs["session.id"]).toEqual({ stringValue: "sess-xyz" });
      expect(resAttrs["screen.width"]).toEqual({ intValue: "1440" });
      expect(resAttrs["screen.height"]).toEqual({ intValue: "900" });

      const scopeLog = resourceLog.scopeLogs[0]!;
      expect(scopeLog.scope.name).toBe("org.apache.flagon.userale");
      expect(scopeLog.logRecords).toHaveLength(1);

      const record = scopeLog.logRecords[0]!;
      expect(record.timeUnixNano).toBe("1712000000000250000");
      expect(record.severityNumber).toBe(9);
      expect(record.severityText).toBe("INFO");
      expect(record.eventName).toBe("userale.raw.click");
      expect(record.traceId).toBe("4bf92f3577b34da6a3ce929d0e0e4736");
      expect(record.spanId).toBe("00f067aa0ba902b7");

      // Structured kvlistValue body instead of double-encoded JSON string
      expect(record.body?.kvlistValue).toBeDefined();
      const bodyMap = getAttrMap(record.body!.kvlistValue!.values);
      expect(bodyMap.button).toEqual({ intValue: "0" });
      expect(bodyMap.ctrl).toEqual({ boolValue: false });
      expect(bodyMap.nested?.kvlistValue?.values).toEqual([
        { key: "ok", value: { boolValue: true } },
      ]);

      const logAttrs = getAttrMap(record.attributes);
      expect(logAttrs["event.name"]).toEqual({
        stringValue: "userale.raw.click",
      });
      expect(logAttrs["url.full"]).toEqual({
        stringValue: "https://shop.example.com/pay",
      });
      expect(logAttrs["user.id"]).toEqual({ stringValue: "user-99" });
      expect(logAttrs["flagon.target"]).toEqual({ stringValue: "button#pay" });
      expect(logAttrs["flagon.user_action"]).toEqual({ boolValue: true });
      expect(logAttrs["flagon.location.x"]).toEqual({ doubleValue: 42 });
      expect(logAttrs["flagon.location.y"]).toEqual({ doubleValue: 84 });
      expect(logAttrs["flagon.path"]).toEqual({
        arrayValue: {
          values: [
            { stringValue: "button#pay" },
            { stringValue: "form#checkout" },
            { stringValue: "body" },
          ],
        },
      });
    });

    it("supports config.traceContext callback and ignores invalid/all-zero trace IDs", () => {
      config.update({
        traceContext: () => ({
          traceId: "ABCD2f3577b34da6a3ce929d0e0e4736",
          spanId: "0000000000000000", // all-zero spanId should be ignored
        }),
      });

      const payload = toOtlpExportLogsServiceRequest(
        [
          {
            target: "div",
            type: "click",
            logType: "raw",
            clientTime: 1712000000000,
          },
        ],
        config,
      );
      const record = payload.resourceLogs[0]!.scopeLogs[0]!.logRecords[0]!;
      expect(record.traceId).toBe("abcd2f3577b34da6a3ce929d0e0e4736");
      expect(record.spanId).toBeUndefined();
    });

    it("POSTs OTLP/JSON payload to normalized /v1/logs endpoint", async () => {
      const fetchSpy = jest
        .spyOn(global, "fetch")
        .mockResolvedValue(new Response(null, { status: 200 }));

      config.update({
        otlpEndpoint: "http://localhost:4318",
        exporterType: "otlp",
        apiKey: "otlp-secret",
      });

      const exporter = new OtlpJsonExporter(config);
      const result = await exporter.export([
        {
          target: "button#save",
          type: "click",
          logType: "raw",
          clientTime: 1712000000000,
        },
      ]);

      expect(result.success).toBe(true);
      expect(fetchSpy).toHaveBeenCalledTimes(1);
      expect(fetchSpy.mock.calls[0]![0]).toBe("http://localhost:4318/v1/logs");
      const headers = fetchSpy.mock.calls[0]![1]!.headers as Headers;
      expect(headers.get("x-api-key")).toBe("otlp-secret");

      const sentBody = JSON.parse(
        fetchSpy.mock.calls[0]![1]!.body as string,
      ) as ReturnType<typeof toOtlpExportLogsServiceRequest>;
      expect(
        sentBody.resourceLogs[0]!.scopeLogs[0]!.logRecords[0]!.eventName,
      ).toBe("userale.raw.click");

      fetchSpy.mockRestore();
    });
  });

  describe("OtelSdkExporter", () => {
    it("emits logs to a duck-typed OpenTelemetry JS Logs API Logger", async () => {
      const mockLogger = {
        emit: jest.fn(),
      };

      const exporter = new OtelSdkExporter(mockLogger);
      const result = await exporter.export([
        {
          target: "input#search",
          path: ["input#search", "body"],
          pageUrl: "https://example.com",
          type: "input",
          logType: "raw",
          clientTime: 1712000000000,
          userAction: true,
          details: { value: "flagon" },
        },
      ]);

      expect(result.success).toBe(true);
      expect(mockLogger.emit).toHaveBeenCalledTimes(1);
      expect(mockLogger.emit).toHaveBeenCalledWith(
        expect.objectContaining({
          timestamp: 1712000000000,
          severityNumber: 9,
          severityText: "INFO",
          eventName: "userale.raw.input",
          body: { value: "flagon" },
          attributes: expect.objectContaining({
            "event.name": "userale.raw.input",
            "url.full": "https://example.com",
            "flagon.target": "input#search",
          }),
        }),
      );
    });

    it("omits empty strings, empty arrays/objects, non-finite coords, and uses eventName when details is {}", async () => {
      const mockLogger = { emit: jest.fn() };
      const exporter = new OtelSdkExporter(mockLogger);
      const res = await exporter.export([
        {
          pageUrl: "",
          pageTitle: "",
          pageReferrer: "",
          userId: "",
          sessionId: "",
          target: "",
          path: [],
          attributes: {},
          location: { x: Number.NaN, y: null },
          type: "click",
          logType: "raw",
          clientTime: 1712000000000,
          userAction: true,
          details: {},
        },
      ]);

      expect(res.success).toBe(true);
      const emitted = mockLogger.emit.mock.calls[0]![0];
      expect(emitted.body).toBe("userale.raw.click");
      expect(emitted.attributes).toEqual({
        "event.name": "userale.raw.click",
        "flagon.log_type": "raw",
        "flagon.event_type": "click",
        "flagon.user_action": true,
      });
    });
  });

  describe("exporter hardening (#217)", () => {
    it("respects explicit exporterType over otlpEndpoint and wires otel-sdk", () => {
      config.update({
        url: "http://localhost:8000",
        otlpEndpoint: "http://localhost:4318",
        exporterType: "proto-json",
      });
      expect(createExporter(config)).toBeInstanceOf(ProtoJsonExporter);

      config.reset();
      config.update({
        url: "http://localhost:8000",
        otlpEndpoint: "http://localhost:4318",
        exporterType: "http-json",
      });
      expect(createExporter(config)).toBeInstanceOf(HttpJsonExporter);

      config.reset();
      const mockLogger = { emit: jest.fn() };
      config.update({
        exporterType: "otel-sdk",
        otelLogger: mockLogger,
      });
      expect(createExporter(config)).toBeInstanceOf(OtelSdkExporter);
    });

    it("chunks multi-byte UTF-8 payloads, awaits keepalive sequentially, and disables keepalive for single oversized payloads", async () => {
      // Multi-byte CJK chars occupy 3 UTF-8 bytes each despite length === 1
      const cjkLogs = Array.from({ length: 4 }, (_, i) => ({
        i,
        text: "漢".repeat(7_000),
      }));
      const chunks = chunkLogsForKeepalive(cjkLogs, (b) => JSON.stringify(b));
      expect(chunks.length).toBeGreaterThan(1);
      for (const c of chunks) {
        expect(utf8ByteLength(c)).toBeLessThanOrEqual(48 * 1024);
      }

      // Sequential keepalive: next fetch only fires after prior resolves
      let inFlight = 0;
      let maxConcurrent = 0;
      const keepaliveFlags: boolean[] = [];
      const fetchSpy = jest
        .spyOn(globalThis, "fetch")
        .mockImplementation(async (_url, init) => {
          inFlight++;
          maxConcurrent = Math.max(maxConcurrent, inFlight);
          keepaliveFlags.push(Boolean(init?.keepalive));
          await Promise.resolve();
          inFlight--;
          return new Response(null, { status: 200 });
        });

      config.update({ url: "https://collector.example/logs" });
      const exporter = new HttpJsonExporter(config);
      await exporter.export(cjkLogs, { keepalive: true });
      expect(maxConcurrent).toBe(1);
      expect(keepaliveFlags.every(Boolean)).toBe(true);

      // Single oversized batch (> 48 KiB) downgrades to keepalive: false
      keepaliveFlags.length = 0;
      await exporter.export([{ big: "€".repeat(20_000) }], { keepalive: true });
      expect(keepaliveFlags).toEqual([false]);
      fetchSpy.mockRestore();
    });

    it("prevents OtlpJsonExporter from re-injecting config.sessionId on minimized logs or tracing when attachTraceContext is false", () => {
      const globalAny = globalThis as Record<string, unknown>;
      const origOtel = globalAny.opentelemetry;
      const traceCtxSpy = jest.fn(() => ({
        traceId: "4bf92f3577b34da6a3ce929d0e0e4736",
        spanId: "00f067aa0ba902b7",
      }));
      globalAny.opentelemetry = {
        trace: {
          getActiveSpan: () => ({
            spanContext: () => ({
              traceId: "4bf92f3577b34da6a3ce929d0e0e4736",
              spanId: "00f067aa0ba902b7",
            }),
          }),
        },
      };

      try {
        config.update({
          sessionId: "leaked-config-session",
          httpSessionId: "leaked-http",
          traceContext: traceCtxSpy,
          privacy: { preset: "strict" },
        });
        const minimizedLog: Logging.Log = {
          logType: "raw",
          type: "click",
          clientTime: 1712000000000,
          sessionId: null,
          httpSessionId: null,
          browserSessionId: null,
          traceId: "4bf92f3577b34da6a3ce929d0e0e4736",
          spanId: "00f067aa0ba902b7",
        };
        const req = toOtlpExportLogsServiceRequest([minimizedLog], config);
        const resKeys = req.resourceLogs[0]!.resource.attributes.map(
          (a) => a.key,
        );
        expect(resKeys).not.toContain("session.id");
        expect(resKeys).not.toContain("flagon.http_session_id");
        expect(resKeys).not.toContain("flagon.browser_session_id");
        const rec = req.resourceLogs[0]!.scopeLogs[0]!.logRecords[0]!;
        expect(rec.traceId).toBeUndefined();
        expect(rec.spanId).toBeUndefined();
        expect(traceCtxSpy).not.toHaveBeenCalled();
      } finally {
        if (origOtel === undefined) {
          delete globalAny.opentelemetry;
        } else {
          globalAny.opentelemetry = origOtel;
        }
      }
    });

    it("guards NaN/Infinity in ProtoJsonExporter, omits empty location/scrnRes, preserves native Struct types, and maps mutation/replay/targetRect", () => {
      const batch = toProtoLogBatch([
        {
          target: "",
          path: [],
          type: "click",
          logType: "raw",
          userAction: true,
          clientTime: Number.NaN,
          microTime: Number.POSITIVE_INFINITY,
          location: null,
          scrnRes: null,
          targetRect: { x: 10, y: 20, width: 100, height: 40 },
          attributes: { "data-num": 42, "data-flag": true, label: "save" },
          traceId: "4bf92f3577b34da6a3ce929d0e0e4736",
          spanId: "00f067aa0ba902b7",
        },
        {
          type: "mutation",
          logType: "mutation",
          clientTime: 1712000000100,
          userAction: false,
          details: { addedCount: 2 },
        },
        {
          type: "session_replay",
          logType: "replay",
          clientTime: 1712000000200,
          userAction: false,
          trigger: "manual",
        },
      ]);

      const rawObj = (batch.logs as any[])[0]!.raw;
      expect(rawObj.location).toBeUndefined();
      expect(rawObj.microTime).toBeUndefined();
      expect(rawObj.metadata.clientTime).toBe("0");
      expect(rawObj.metadata.screenResolution).toBeUndefined();
      expect(rawObj.attributes).toEqual({
        "data-num": 42,
        "data-flag": true,
        label: "save",
      });

      const decoded = fromJson(LogBatchSchema, batch as unknown as JsonValue);
      expect(decoded.logs).toHaveLength(3);
      expect(decoded.logs[0]!.logType).toBe(LogType.RAW);
      if (decoded.logs[0]!.log.case === "raw") {
        expect(decoded.logs[0]!.log.value.location).toBeUndefined();
        expect(decoded.logs[0]!.log.value.targetRect).toMatchObject({
          x: 10,
          y: 20,
          width: 100,
          height: 40,
        });
        expect(decoded.logs[0]!.log.value.metadata?.traceId).toBe(
          "4bf92f3577b34da6a3ce929d0e0e4736",
        );
      }
      expect(decoded.logs[1]!.logType).toBe(LogType.MUTATION);
      expect(decoded.logs[2]!.logType).toBe(LogType.REPLAY);
    });
  });
});

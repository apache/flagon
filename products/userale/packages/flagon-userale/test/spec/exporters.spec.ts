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
  ProtoJsonExporter,
  toProtoLogBatch,
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

import type { LogExporter } from "@/exporters";
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
});

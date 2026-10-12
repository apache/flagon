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
import { jest } from "@jest/globals";
import { Configuration } from "@/configure";
import { initPackager, logs } from "@/packageLogs";
import {
  flushSessionReplay,
  getActiveReplayRingBuffer,
  getTargetRect,
  RageClickDetector,
  ReplayRingBuffer,
  startSessionReplay,
  stopSessionReplay,
  type ReplayEnvelope,
  type ReplayFrame,
} from "@/replay";

const config = Configuration.getInstance();

describe("Session Replay & Behavioral DOM Telemetry (#104)", () => {
  beforeEach(() => {
    stopSessionReplay();
    config.reset();
    config.update({
      on: true,
      sessionId: "session_replay_test",
      httpSessionId: "http_session_test",
      resolution: 30,
    });
    initPackager([], config);
    document.body.innerHTML = "";
  });

  afterEach(() => {
    stopSessionReplay();
  });

  describe("getTargetRect", () => {
    it("extracts rounded bounding box coordinates from an element", () => {
      const btn = document.createElement("button");
      btn.getBoundingClientRect = () =>
        ({
          x: 12.4,
          y: 48.6,
          width: 120.2,
          height: 36.8,
        }) as DOMRect;
      expect(getTargetRect(btn)).toEqual({
        x: 12,
        y: 49,
        width: 120,
        height: 37,
      });
    });

    it("returns null for null or non-element targets", () => {
      expect(getTargetRect(null)).toBeNull();
      expect(getTargetRect({} as EventTarget)).toBeNull();
    });
  });

  describe("ReplayRingBuffer", () => {
    it("retains the latest Meta (type 4) and FullSnapshot (type 2) anchors when pruning old incremental frames", () => {
      const buffer = new ReplayRingBuffer(5_000, 100);
      // Initial Meta + FullSnapshot at t=1000
      buffer.push({
        type: 4,
        data: { href: "https://example.com" },
        timestamp: 1_000,
      });
      buffer.push({ type: 2, data: { node: "root" }, timestamp: 1_010 });
      // Early incremental frame at t=2000 (will be pruned when t=8000 arrives)
      buffer.push({ type: 3, data: { id: 1 }, timestamp: 2_000 });
      // Recent incremental frames at t=6000 and t=8000
      buffer.push({ type: 3, data: { id: 2 }, timestamp: 6_000 });
      buffer.push({ type: 3, data: { id: 3 }, timestamp: 8_000 });

      const frames = buffer.getSnapshotFrames();
      // Should include the preserved Meta + FullSnapshot anchors + the 2 in-window incremental frames
      expect(frames.map((f) => f.type)).toEqual([4, 2, 3, 3]);
      expect((frames[2].data as { id: number }).id).toBe(2);
      expect((frames[3].data as { id: number }).id).toBe(3);
    });

    it("resets buffer on checkout FullSnapshot", () => {
      const buffer = new ReplayRingBuffer(10_000, 100);
      buffer.push({ type: 2, data: { v: 1 }, timestamp: 1_000 });
      buffer.push({ type: 3, data: { v: 2 }, timestamp: 2_000 });
      buffer.push({ type: 2, data: { v: 3 }, timestamp: 3_000 }, true);

      const frames = buffer.getSnapshotFrames();
      expect(frames).toHaveLength(1);
      expect((frames[0].data as { v: number }).v).toBe(3);
    });
  });

  describe("RageClickDetector", () => {
    it("detects 3 rapid clicks on the same target within radius and window", () => {
      const detector = new RageClickDetector(1_000, 3, 30);
      expect(
        detector.recordClick({
          target: "button#pay",
          timestamp: 1_000,
          x: 100,
          y: 100,
        }).isRageClick,
      ).toBe(false);
      expect(
        detector.recordClick({
          target: "button#pay",
          timestamp: 1_200,
          x: 105,
          y: 102,
        }).isRageClick,
      ).toBe(false);
      const third = detector.recordClick({
        target: "button#pay",
        timestamp: 1_450,
        x: 98,
        y: 104,
      });
      expect(third).toEqual({ isRageClick: true, clickCount: 3 });
    });

    it("does not trigger when clicks are far apart in space or time", () => {
      const detector = new RageClickDetector(1_000, 3, 30);
      detector.recordClick({
        target: "div#canvas",
        timestamp: 1_000,
        x: 10,
        y: 10,
      });
      detector.recordClick({
        target: "div#canvas",
        timestamp: 1_200,
        x: 200,
        y: 200,
      });
      const third = detector.recordClick({
        target: "div#canvas",
        timestamp: 1_400,
        x: 400,
        y: 400,
      });
      expect(third.isRageClick).toBe(false);
    });
  });

  describe("startSessionReplay (Layer 1 + Layer 2 integration)", () => {
    it("aggregates structural DOM mutations while ignoring [data-userale-ignore] subtrees", async () => {
      startSessionReplay(
        { observeMutations: true, detectRageClicks: false },
        config,
      );

      const ignoredFeed = document.createElement("div");
      ignoredFeed.setAttribute("data-userale-ignore", "true");
      document.body.appendChild(ignoredFeed);

      // Mutating inside an ignored container should not be counted
      const ignoredChild = document.createElement("span");
      ignoredFeed.appendChild(ignoredChild);

      // Mutating a tracked container should be aggregated
      const trackedModal = document.createElement("div");
      trackedModal.id = "checkout-modal";
      document.body.appendChild(trackedModal);

      await new Promise((r) => setTimeout(r, 180));
      for (
        let i = 0;
        i < 20 && !logs.some((l) => l.logType === "mutation");
        i++
      ) {
        await new Promise((r) => setTimeout(r, 50));
      }

      const mutationLogs = logs.filter((l) => l.logType === "mutation");
      expect(mutationLogs.length).toBeGreaterThanOrEqual(1);
      expect(mutationLogs[0].type).toBe("mutation");
      expect(
        (mutationLogs[0].details as { addedCount: number }).addedCount,
      ).toBe(1);
    });

    it("flushes Layer 2 rrweb ring buffer with trace context on rage click or manual flush", async () => {
      const flushedEnvelopes: Array<ReplayEnvelope> = [];
      let emitFrame:
        ((event: ReplayFrame, isCheckout?: boolean) => void) | null = null;

      config.update({
        traceContext: () => ({
          traceId: "4bf92f3577b34da6a3ce929d0e0e4736",
          spanId: "00f067aa0ba902b7",
        }),
      });

      startSessionReplay(
        {
          observeMutations: false,
          detectRageClicks: true,
          recorder: ({ emit }) => {
            emitFrame = emit;
            return () => {};
          },
          onFlush: (env) => {
            flushedEnvelopes.push(env);
          },
        },
        config,
      );

      expect(getActiveReplayRingBuffer()).not.toBeNull();
      emitFrame!({
        type: 4,
        data: { href: "http://localhost/" },
        timestamp: 1_000,
      });
      emitFrame!({
        type: 2,
        data: { html: "<body></body>" },
        timestamp: 1_005,
      });
      emitFrame!({ type: 3, data: { mutation: 1 }, timestamp: 1_100 });

      const btn = document.createElement("button");
      btn.id = "broken-submit";
      document.body.appendChild(btn);

      // Fire 3 rapid clicks to trigger rage_click
      for (let i = 0; i < 3; i++) {
        btn.dispatchEvent(
          new window.MouseEvent("click", {
            bubbles: true,
            clientX: 40,
            clientY: 40,
          }),
        );
      }

      // Should have emitted a rage_click log AND flushed the Layer 2 replay envelope
      const rageLog = logs.find((l) => l.type === "rage_click");
      expect(rageLog).toBeDefined();
      expect(rageLog?.target).toBe("button#broken-submit");

      expect(flushedEnvelopes).toHaveLength(1);
      expect(flushedEnvelopes[0]).toMatchObject({
        logType: "replay",
        type: "session_replay",
        trigger: "rage_click",
        sessionId: "session_replay_test",
        frameCount: 3,
        traceId: "4bf92f3577b34da6a3ce929d0e0e4736",
        spanId: "00f067aa0ba902b7",
      });

      // Manual flush also works
      const manualEnv = await flushSessionReplay("manual");
      expect(manualEnv?.trigger).toBe("manual");
      expect(flushedEnvelopes).toHaveLength(2);
    });

    it("bypasses keepalive when flushing replay envelopes larger than 48KB", async () => {
      const fetchSpy = jest.spyOn(globalThis, "fetch").mockResolvedValue({
        ok: true,
        status: 200,
        statusText: "OK",
      } as Response);

      config.update({ url: "http://localhost:8000/replay" });

      startSessionReplay(
        {
          observeMutations: false,
          detectRageClicks: false,
          recorder: ({ emit }) => {
            emit({
              type: 2,
              data: { snapshot: "x".repeat(60_000) },
              timestamp: 1_000,
            });
            return () => {};
          },
        },
        config,
      );

      await flushSessionReplay("error");

      expect(fetchSpy).toHaveBeenCalledTimes(1);
      expect(fetchSpy.mock.calls[0][1]).toMatchObject({
        method: "POST",
        keepalive: false,
      });

      fetchSpy.mockRestore();
    });

    it("flushes replay buffer on unhandledrejection when flushOnError is enabled", async () => {
      const flushedEnvelopes: Array<ReplayEnvelope> = [];

      startSessionReplay(
        {
          observeMutations: false,
          detectRageClicks: false,
          flushOnError: true,
          recorder: ({ emit }) => {
            emit({ type: 2, data: { root: "html" }, timestamp: 2_000 });
            return () => {};
          },
          onFlush: (env) => {
            flushedEnvelopes.push(env);
          },
        },
        config,
      );

      self.dispatchEvent(new Event("unhandledrejection"));

      expect(flushedEnvelopes).toHaveLength(1);
      expect(flushedEnvelopes[0].trigger).toBe("unhandledrejection");
    });
  });
});

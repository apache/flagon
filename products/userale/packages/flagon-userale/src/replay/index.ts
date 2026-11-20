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

import { Configuration } from "@/configure";
import {
  closestComposed,
  DEFAULT_IGNORE_SELECTOR,
  DEFAULT_REDACT_SELECTOR,
  isElementNode,
  isNodeIgnored,
} from "@/domUtils";
import { createExporter, type LogExporter } from "@/exporters";
import { utf8ByteLength } from "@/exporters/http-json";
import {
  getSelector,
  getTargetRect,
  packageCustomLog,
  type PackagerController,
  type TargetRect,
} from "@/packageLogs";
import { evaluateEventPrivacyFilter, safeReadPageUrl } from "@/privacy";
import type { Logging } from "@/types";

export { getTargetRect, type TargetRect };

/**
 * Standard rrweb-compatible event frame structure.
 * In rrweb: type 2 = FullSnapshot, type 3 = IncrementalSnapshot, type 4 = Meta.
 */
export interface ReplayFrame {
  type: number;
  data: unknown;
  timestamp: number;
  [key: string]: unknown;
}

export type ReplayRecorderFn = (options: {
  emit: (event: ReplayFrame, isCheckout?: boolean) => void;
  checkoutEveryNms?: number;
  maskAllInputs?: boolean;
  maskAllText?: boolean;
  blockSelector?: string;
  maskTextSelector?: string;
  [key: string]: unknown;
}) => (() => void) | undefined;

export interface ReplayEnvelope {
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

export interface SessionReplayOptions {
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

const DEFAULT_MASK_SELECTOR = DEFAULT_REDACT_SELECTOR;
const MAX_KEEPALIVE_BYTES = 48 * 1024;
const DEFAULT_MAX_BYTES = 5 * 1024 * 1024;

interface StoredFrame {
  frame: ReplayFrame;
  bytes: number;
}

/**
 * Rolling ring buffer for rrweb-compatible DOM replay frames.
 * Preserves the most recent Meta (type 4) and FullSnapshot (type 2) anchor frames
 * so flushed slices are always playable by rrweb-player.
 */
export class ReplayRingBuffer {
  private maxDurationMs: number;
  private maxFrames: number;
  private maxBytes: number;
  private frames: Array<StoredFrame> = [];
  private head = 0;
  private totalBytes = 0;
  private anchorMeta: ReplayFrame | null = null;
  private anchorFullSnapshot: ReplayFrame | null = null;

  constructor(
    maxDurationMs = 30_000,
    maxFrames = 2_000,
    maxBytes = DEFAULT_MAX_BYTES,
  ) {
    this.maxDurationMs = Math.max(1_000, maxDurationMs);
    this.maxFrames = Math.max(10, maxFrames);
    this.maxBytes = Math.max(256, maxBytes);
  }

  public push(frame: ReplayFrame, isCheckout = false): void {
    const ts =
      typeof frame.timestamp === "number" && Number.isFinite(frame.timestamp)
        ? frame.timestamp
        : Date.now();
    const normalized: ReplayFrame = { ...frame, timestamp: ts };

    if (isCheckout) {
      this.frames = [];
      this.head = 0;
      this.totalBytes = 0;
      if (normalized.type !== 2) {
        this.anchorMeta = null;
      }
      this.anchorFullSnapshot = null;
    }

    if (normalized.type === 4) {
      this.anchorMeta = normalized;
    } else if (normalized.type === 2) {
      this.anchorFullSnapshot = normalized;
    }

    let bytes = 64;
    try {
      bytes = utf8ByteLength(JSON.stringify(normalized));
    } catch {
      bytes = 64;
    }

    this.frames.push({ frame: normalized, bytes });
    this.totalBytes += bytes;
    this.prune(ts);
  }

  public prune(now = Date.now()): void {
    const cutoff = now - this.maxDurationMs;
    while (this.head < this.frames.length) {
      const entry = this.frames[this.head]!;
      const count = this.frames.length - this.head;
      if (
        entry.frame.timestamp < cutoff ||
        count > this.maxFrames ||
        this.totalBytes > this.maxBytes
      ) {
        this.totalBytes -= entry.bytes;
        this.head++;
      } else {
        break;
      }
    }
    if (this.head > 64 && this.head * 2 >= this.frames.length) {
      this.frames = this.frames.slice(this.head);
      this.head = 0;
    }
  }

  public getSnapshotFrames(): Array<ReplayFrame> {
    const lastIdx = this.frames.length - 1;
    this.prune(
      lastIdx >= this.head ? this.frames[lastIdx]!.frame.timestamp : Date.now(),
    );
    const activeFrames = this.frames.slice(this.head).map((e) => e.frame);
    if (activeFrames.length === 0) {
      return [];
    }

    const result: Array<ReplayFrame> = [];
    const hasMetaInWindow = activeFrames.some((f) => f.type === 4);
    const hasFullSnapshotInWindow = activeFrames.some((f) => f.type === 2);

    if (!hasFullSnapshotInWindow && this.anchorFullSnapshot) {
      if (
        !hasMetaInWindow &&
        this.anchorMeta &&
        this.anchorMeta.timestamp <= this.anchorFullSnapshot.timestamp
      ) {
        result.push(this.anchorMeta);
      }
      result.push(this.anchorFullSnapshot);
    } else if (!hasMetaInWindow && this.anchorMeta) {
      const firstTs = activeFrames[0]?.timestamp ?? Infinity;
      if (this.anchorMeta.timestamp <= firstTs) {
        result.push(this.anchorMeta);
      }
    }

    for (const f of activeFrames) {
      if (result.length > 0 && result[result.length - 1] === f) {
        continue;
      }
      result.push(f);
    }
    return result;
  }

  public clear(): void {
    this.frames = [];
    this.head = 0;
    this.totalBytes = 0;
    this.anchorMeta = null;
    this.anchorFullSnapshot = null;
  }

  public size(): number {
    return this.frames.length - this.head;
  }
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
export class RageClickDetector {
  private clicks: Array<ClickSample> = [];
  private windowMs: number;
  private threshold: number;
  private radiusPx: number;

  constructor(windowMs = 1_000, threshold = 3, radiusPx = 30) {
    this.windowMs = windowMs;
    this.threshold = threshold;
    this.radiusPx = radiusPx;
  }

  public recordClick(sample: ClickSample): {
    isRageClick: boolean;
    clickCount: number;
  } {
    if (!sample.target || sample.target.trim().length === 0) {
      return { isRageClick: false, clickCount: 0 };
    }
    if (
      sample.x === null ||
      sample.y === null ||
      !Number.isFinite(sample.x) ||
      !Number.isFinite(sample.y)
    ) {
      return { isRageClick: false, clickCount: 0 };
    }

    const cutoff = sample.timestamp - this.windowMs;
    this.clicks = this.clicks.filter((c) => c.timestamp >= cutoff);
    this.clicks.push(sample);

    const matching = this.clicks.filter((c) => {
      if (c.target !== sample.target) {
        return false;
      }
      if (
        c.x === null ||
        c.y === null ||
        !Number.isFinite(c.x) ||
        !Number.isFinite(c.y)
      ) {
        return false;
      }
      const dx = c.x - sample.x!;
      const dy = c.y - sample.y!;
      return Math.hypot(dx, dy) <= this.radiusPx;
    });

    if (matching.length >= this.threshold) {
      const count = matching.length;
      // Reset clicks for this target so we emit one event per burst
      this.clicks = this.clicks.filter((c) => c.target !== sample.target);
      return { isRageClick: true, clickCount: count };
    }

    return { isRageClick: false, clickCount: matching.length };
  }

  public reset(): void {
    this.clicks = [];
  }
}

export interface ReplayController {
  startSessionReplay: (options?: SessionReplayOptions) => () => void;
  stopSessionReplay: () => void;
  flushSessionReplay: (trigger?: string) => Promise<ReplayEnvelope | null>;
  getActiveReplayRingBuffer: () => ReplayRingBuffer | null;
}

/**
 * Creates an encapsulated replay controller bound to an instance Configuration,
 * PackagerController, and optional exporter resolver.
 */
export function createReplayController(
  config: Configuration,
  packager: Pick<PackagerController, "packageCustomLog">,
  getExporter?: () => LogExporter,
): ReplayController {
  let activeStopFn: (() => void) | null = null;
  let activeRingBuffer: ReplayRingBuffer | null = null;
  let activeFlushFn:
    ((trigger: string) => Promise<ReplayEnvelope | null>) | null = null;

  const stopSessionReplay = (): void => {
    if (activeStopFn) {
      activeStopFn();
      activeStopFn = null;
    }
    activeRingBuffer = null;
    activeFlushFn = null;
  };

  const flushSessionReplay = async (
    trigger = "manual",
  ): Promise<ReplayEnvelope | null> => {
    if (activeFlushFn) {
      return activeFlushFn(trigger);
    }
    return null;
  };

  const getActiveReplayRingBuffer = (): ReplayRingBuffer | null => {
    return activeRingBuffer;
  };

  const startSessionReplay = (
    options: SessionReplayOptions = {},
  ): (() => void) => {
    if (config.isPrivacyLocked()) {
      console.warn(
        "[UserALE] Ignoring startSessionReplay() because privacy is locked.",
      );
      return () => {};
    }

    stopSessionReplay();

    const maxDurationMs = options.maxDurationMs ?? 30_000;
    const maxFrames = options.maxFrames ?? 2_000;
    const maxBytes = options.maxBytes ?? DEFAULT_MAX_BYTES;
    const observeMutations = options.observeMutations ?? true;
    const detectRageClicks = options.detectRageClicks ?? true;
    const flushOnError = options.flushOnError ?? true;
    const ignoreSelector = options.ignoreSelector ?? DEFAULT_IGNORE_SELECTOR;
    const maskTextSelector = options.maskAllText
      ? "*"
      : (options.maskTextSelector ?? DEFAULT_MASK_SELECTOR);
    const maskAllInputs = options.maskAllInputs ?? true;

    const ringBuffer = new ReplayRingBuffer(maxDurationMs, maxFrames, maxBytes);
    activeRingBuffer = ringBuffer;

    let stopRecorder: (() => void) | undefined;
    if (typeof options.recorder === "function") {
      stopRecorder = options.recorder({
        emit: (event: ReplayFrame, isCheckout?: boolean) => {
          ringBuffer.push(event, isCheckout);
        },
        checkoutEveryNms: maxDurationMs,
        maskAllInputs,
        ...(options.maskAllText !== undefined
          ? { maskAllText: options.maskAllText }
          : {}),
        blockSelector: ignoreSelector,
        maskTextSelector,
      });
    }

    const doFlush = async (trigger: string): Promise<ReplayEnvelope | null> => {
      if (!config.on) {
        return null;
      }
      const frames = ringBuffer.getSnapshotFrames();
      if (frames.length === 0) {
        return null;
      }

      const privacy = config.getResolvedPrivacy();
      const traceCtx =
        privacy.attachTraceContext && typeof config.traceContext === "function"
          ? config.traceContext()
          : null;
      const envelope: ReplayEnvelope = {
        logType: "replay",
        type: "session_replay",
        trigger,
        sessionId: config.sessionId,
        httpSessionId: config.httpSessionId,
        browserSessionId: config.browserSessionId,
        pageUrl: safeReadPageUrl(privacy),
        startTime: frames[0].timestamp,
        endTime: frames[frames.length - 1].timestamp,
        frameCount: frames.length,
        frames,
        ...(traceCtx?.traceId ? { traceId: traceCtx.traceId } : {}),
        ...(traceCtx?.spanId ? { spanId: traceCtx.spanId } : {}),
      };

      if (typeof options.onFlush === "function") {
        await options.onFlush(envelope);
        return envelope;
      }

      const serialized = JSON.stringify(envelope);
      if (utf8ByteLength(serialized) <= MAX_KEEPALIVE_BYTES) {
        packager.packageCustomLog(
          {
            logType: "replay",
            type: "session_replay",
            trigger,
            frameCount: envelope.frameCount,
            startTime: envelope.startTime,
            endTime: envelope.endTime,
          },
          () =>
            ({
              frames: envelope.frames as unknown as Logging.JSONObject[],
            }) as unknown as Logging.JSONObject,
          false,
        );
      } else {
        const exporter =
          config.exporter && typeof config.exporter.export === "function"
            ? config.exporter
            : getExporter
              ? getExporter()
              : createExporter(config);
        try {
          await exporter.export([envelope as unknown as Logging.Log], {
            keepalive: false,
          });
        } catch {
          // Ignore exporter errors in background replay flush
        }
      }

      return envelope;
    };

    activeFlushFn = doFlush;

    // Layer 1A: Throttled MutationObserver
    let observer: MutationObserver | null = null;
    let mutationTimer: ReturnType<typeof setTimeout> | null = null;
    let pendingAdded = 0;
    let pendingRemoved = 0;
    let pendingAttributes = 0;
    const pendingTargets = new Set<string>();

    const flushMutationSummary = () => {
      mutationTimer = null;
      if (
        pendingAdded === 0 &&
        pendingRemoved === 0 &&
        pendingAttributes === 0
      ) {
        return;
      }
      const addedCount = pendingAdded;
      const removedCount = pendingRemoved;
      const attributeCount = pendingAttributes;
      const targets = Array.from(pendingTargets).slice(0, 10);

      pendingAdded = 0;
      pendingRemoved = 0;
      pendingAttributes = 0;
      pendingTargets.clear();

      if (config.on) {
        const privacy = config.getResolvedPrivacy();
        packager.packageCustomLog(
          {
            logType: "mutation",
            type: "mutation",
            target:
              targets[0] ??
              (privacy.domSelectorMode === "none" ? "" : "#document"),
          },
          () => ({
            addedCount,
            removedCount,
            attributeCount,
            targets,
          }),
          false,
        );
      }
    };

    if (
      observeMutations &&
      typeof MutationObserver !== "undefined" &&
      typeof document !== "undefined" &&
      document.documentElement
    ) {
      observer = new MutationObserver((records) => {
        if (!config.on) {
          return;
        }
        const privacy = config.getResolvedPrivacy();
        const allowlistInvalid = config.isAllowlistSelectorInvalid();
        if (allowlistInvalid) {
          return;
        }

        for (const rec of records) {
          if (isNodeIgnored(rec.target, ignoreSelector)) {
            continue;
          }
          if (
            privacy.allowlistSelector !== null &&
            (!isElementNode(rec.target) ||
              !closestComposed(rec.target, privacy.allowlistSelector))
          ) {
            continue;
          }
          if (rec.type === "childList") {
            let validAdded = 0;
            for (let i = 0; i < rec.addedNodes.length; i++) {
              if (!isNodeIgnored(rec.addedNodes[i], ignoreSelector)) {
                validAdded++;
              }
            }
            let validRemoved = 0;
            for (let i = 0; i < rec.removedNodes.length; i++) {
              if (!isNodeIgnored(rec.removedNodes[i], ignoreSelector)) {
                validRemoved++;
              }
            }
            if (validAdded === 0 && validRemoved === 0) {
              continue;
            }
            pendingAdded += validAdded;
            pendingRemoved += validRemoved;
          } else if (rec.type === "attributes") {
            pendingAttributes += 1;
          }

          if (
            rec.target &&
            pendingTargets.size < 10 &&
            privacy.domSelectorMode !== "none"
          ) {
            const sel = getSelector(rec.target, privacy.domSelectorMode);
            if (sel && sel !== "Unknown") {
              pendingTargets.add(sel);
            }
          }
        }

        if (
          (pendingAdded > 0 || pendingRemoved > 0 || pendingAttributes > 0) &&
          mutationTimer === null
        ) {
          const delay = Math.max(20, config.resolution || 500);
          mutationTimer = setTimeout(flushMutationSummary, delay);
        }
      });

      observer.observe(document.documentElement, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ["class", "id", "hidden", "disabled", "aria-expanded"],
      });
    }

    // Layer 1B: Rage-Click Friction Detector
    const rageDetector = new RageClickDetector();
    const onClickCapture = (e: MouseEvent) => {
      if (!config.on || !e.target) {
        return;
      }
      const privacy = config.getResolvedPrivacy();
      const filterRes = evaluateEventPrivacyFilter(
        e,
        privacy,
        config.isAllowlistSelectorInvalid(),
        ignoreSelector,
      );
      if (!filterRes.allowed) {
        return;
      }
      if (!privacy.captureLocation || privacy.domSelectorMode === "none") {
        return;
      }

      const targetSel = getSelector(e.target, privacy.domSelectorMode);
      const now = Date.now();
      const { isRageClick, clickCount } = rageDetector.recordClick({
        target: targetSel,
        timestamp: now,
        x: typeof e.clientX === "number" ? e.clientX : null,
        y: typeof e.clientY === "number" ? e.clientY : null,
      });

      if (isRageClick) {
        const rect = privacy.captureTargetRect ? getTargetRect(e.target) : null;
        packager.packageCustomLog(
          {
            logType: "custom",
            type: "rage_click",
            target: targetSel,
          },
          () => ({
            clickCount,
            ...(rect
              ? { targetRect: rect as unknown as Logging.JSONObject }
              : {}),
          }),
          true,
        );
        void doFlush("rage_click");
      }
    };

    if (detectRageClicks && typeof document !== "undefined") {
      document.addEventListener("click", onClickCapture, true);
    }

    const onWindowError = () => {
      void doFlush("error");
    };
    const onUnhandledRejection = () => {
      void doFlush("unhandledrejection");
    };
    if (
      flushOnError &&
      typeof self !== "undefined" &&
      typeof self.addEventListener === "function"
    ) {
      self.addEventListener("error", onWindowError);
      self.addEventListener("unhandledrejection", onUnhandledRejection);
    }

    const cleanup = () => {
      if (mutationTimer !== null) {
        clearTimeout(mutationTimer);
        mutationTimer = null;
      }
      if (observer) {
        observer.disconnect();
        observer = null;
      }
      if (detectRageClicks && typeof document !== "undefined") {
        document.removeEventListener("click", onClickCapture, true);
      }
      if (
        flushOnError &&
        typeof self !== "undefined" &&
        typeof self.removeEventListener === "function"
      ) {
        self.removeEventListener("error", onWindowError);
        self.removeEventListener("unhandledrejection", onUnhandledRejection);
      }
      if (typeof stopRecorder === "function") {
        stopRecorder();
        stopRecorder = undefined;
      }
      rageDetector.reset();
      ringBuffer.clear();
      if (activeStopFn === cleanup) {
        activeStopFn = null;
        activeRingBuffer = null;
        activeFlushFn = null;
      }
    };

    activeStopFn = cleanup;
    return cleanup;
  };

  return {
    startSessionReplay,
    stopSessionReplay,
    flushSessionReplay,
    getActiveReplayRingBuffer,
  };
}

let legacyReplayController: ReplayController | null = null;

/**
 * Flushes the current Layer 2 replay ring buffer (if active) with the given trigger reason.
 */
export async function flushSessionReplay(
  trigger = "manual",
): Promise<ReplayEnvelope | null> {
  if (legacyReplayController) {
    return legacyReplayController.flushSessionReplay(trigger);
  }
  return null;
}

/**
 * Stops any active session replay / DOM mutation observer and resets internal state.
 */
export function stopSessionReplay(): void {
  if (legacyReplayController) {
    legacyReplayController.stopSessionReplay();
    legacyReplayController = null;
  }
}

/**
 * Starts Layer 1 (MutationObserver + RageClick friction telemetry) and optional
 * Layer 2 (rrweb-compatible ring buffer replay bridge).
 * Returns a cleanup function that stops observation and recording.
 */
export function startSessionReplay(
  options: SessionReplayOptions = {},
  config: Configuration = Configuration.getInstance(),
): () => void {
  stopSessionReplay();
  legacyReplayController = createReplayController(config, {
    packageCustomLog,
  });
  return legacyReplayController.startSessionReplay(options);
}

/**
 * Returns the active ReplayRingBuffer instance if session replay is running.
 */
export function getActiveReplayRingBuffer(): ReplayRingBuffer | null {
  return legacyReplayController
    ? legacyReplayController.getActiveReplayRingBuffer()
    : null;
}

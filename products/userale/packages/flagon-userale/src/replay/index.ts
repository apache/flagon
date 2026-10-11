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
import { buildHeaders } from "@/exporters/headers";
import { getSelector, packageCustomLog } from "@/packageLogs";
import type { Logging } from "@/types";

export interface TargetRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

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
   * CSS selector for DOM subtrees ignored by MutationObserver and rrweb (default: "[data-userale-ignore], .userale-ignore").
   */
  ignoreSelector?: string;
  /**
   * CSS selector for elements whose text should be masked in rrweb (default: "[data-userale-mask], .userale-mask").
   */
  maskTextSelector?: string;
  /**
   * Mask all input values in rrweb (default: true).
   */
  maskAllInputs?: boolean;
  /**
   * Optional custom callback invoked when a replay envelope is flushed.
   * If omitted, flushes via POST to config.replayEndpoint || config.url (or packageCustomLog when smaller than 48KB).
   */
  onFlush?: (envelope: ReplayEnvelope) => void | Promise<void>;
}

const DEFAULT_IGNORE_SELECTOR = "[data-userale-ignore], .userale-ignore";
const DEFAULT_MASK_SELECTOR = "[data-userale-mask], .userale-mask";
const MAX_KEEPALIVE_BYTES = 48 * 1024;

/**
 * Safely extracts the bounding client rectangle for an event target on discrete
 * user interactions (click, dblclick, change, submit).
 */
export function getTargetRect(target: EventTarget | null): TargetRect | null {
  try {
    if (
      target &&
      typeof (target as Element).getBoundingClientRect === "function"
    ) {
      const rect = (target as Element).getBoundingClientRect();
      if (
        rect &&
        Number.isFinite(rect.x) &&
        Number.isFinite(rect.y) &&
        Number.isFinite(rect.width) &&
        Number.isFinite(rect.height)
      ) {
        return {
          x: Math.round(rect.x),
          y: Math.round(rect.y),
          width: Math.round(rect.width),
          height: Math.round(rect.height),
        };
      }
    }
  } catch {
    // Ignore errors in non-DOM environments
  }
  return null;
}

/**
 * Rolling ring buffer for rrweb-compatible DOM replay frames.
 * Preserves the most recent Meta (type 4) and FullSnapshot (type 2) anchor frames
 * so flushed slices are always playable by rrweb-player.
 */
export class ReplayRingBuffer {
  private maxDurationMs: number;
  private maxFrames: number;
  private frames: Array<ReplayFrame> = [];
  private anchorMeta: ReplayFrame | null = null;
  private anchorFullSnapshot: ReplayFrame | null = null;

  constructor(maxDurationMs = 30_000, maxFrames = 2_000) {
    this.maxDurationMs = Math.max(1_000, maxDurationMs);
    this.maxFrames = Math.max(10, maxFrames);
  }

  public push(frame: ReplayFrame, isCheckout = false): void {
    const ts =
      typeof frame.timestamp === "number" && Number.isFinite(frame.timestamp)
        ? frame.timestamp
        : Date.now();
    const normalized: ReplayFrame = { ...frame, timestamp: ts };

    if (isCheckout) {
      this.frames = [];
      this.anchorMeta = null;
      this.anchorFullSnapshot = null;
    }

    if (normalized.type === 4) {
      this.anchorMeta = normalized;
    } else if (normalized.type === 2) {
      this.anchorFullSnapshot = normalized;
    }

    this.frames.push(normalized);
    this.prune(ts);
  }

  public prune(now = Date.now()): void {
    const cutoff = now - this.maxDurationMs;
    let firstValidIdx = 0;
    while (
      firstValidIdx < this.frames.length &&
      this.frames[firstValidIdx].timestamp < cutoff
    ) {
      firstValidIdx++;
    }
    if (firstValidIdx > 0) {
      this.frames = this.frames.slice(firstValidIdx);
    }
    if (this.frames.length > this.maxFrames) {
      this.frames = this.frames.slice(this.frames.length - this.maxFrames);
    }
  }

  public getSnapshotFrames(): Array<ReplayFrame> {
    this.prune(
      this.frames.length > 0
        ? this.frames[this.frames.length - 1].timestamp
        : Date.now(),
    );
    if (this.frames.length === 0) {
      return [];
    }

    const result: Array<ReplayFrame> = [];
    const hasFullSnapshotInWindow = this.frames.some((f) => f.type === 2);

    if (!hasFullSnapshotInWindow && this.anchorFullSnapshot) {
      if (
        this.anchorMeta &&
        this.anchorMeta.timestamp <= this.anchorFullSnapshot.timestamp
      ) {
        result.push(this.anchorMeta);
      }
      result.push(this.anchorFullSnapshot);
    }

    for (const f of this.frames) {
      if (result.length > 0 && result[result.length - 1] === f) {
        continue;
      }
      result.push(f);
    }
    return result;
  }

  public clear(): void {
    this.frames = [];
    this.anchorMeta = null;
    this.anchorFullSnapshot = null;
  }

  public size(): number {
    return this.frames.length;
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
    const cutoff = sample.timestamp - this.windowMs;
    this.clicks = this.clicks.filter((c) => c.timestamp >= cutoff);
    this.clicks.push(sample);

    const matching = this.clicks.filter((c) => {
      if (c.target !== sample.target) {
        return false;
      }
      if (
        c.x !== null &&
        c.y !== null &&
        sample.x !== null &&
        sample.y !== null
      ) {
        const dx = c.x - sample.x;
        const dy = c.y - sample.y;
        return Math.hypot(dx, dy) <= this.radiusPx;
      }
      return true;
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

function isIgnoredNode(node: unknown, ignoreSelector: string): boolean {
  if (!node || typeof node !== "object") {
    return false;
  }
  const candidate = node as {
    nodeType?: number;
    closest?: (selector: string) => Element | null;
    parentElement?: { closest?: (selector: string) => Element | null } | null;
  };
  const el =
    typeof candidate.closest === "function"
      ? candidate
      : candidate.parentElement &&
          typeof candidate.parentElement.closest === "function"
        ? candidate.parentElement
        : null;
  if (!el || typeof el.closest !== "function") {
    return false;
  }
  try {
    return Boolean(el.closest(ignoreSelector));
  } catch {
    return false;
  }
}

let activeStopFn: (() => void) | null = null;
let activeRingBuffer: ReplayRingBuffer | null = null;
let activeFlushFn:
  ((trigger: string) => Promise<ReplayEnvelope | null>) | null = null;

/**
 * Flushes the current Layer 2 replay ring buffer (if active) with the given trigger reason.
 */
export async function flushSessionReplay(
  trigger = "manual",
): Promise<ReplayEnvelope | null> {
  if (activeFlushFn) {
    return activeFlushFn(trigger);
  }
  return null;
}

/**
 * Stops any active session replay / DOM mutation observer and resets internal state.
 */
export function stopSessionReplay(): void {
  if (activeStopFn) {
    activeStopFn();
    activeStopFn = null;
  }
  activeRingBuffer = null;
  activeFlushFn = null;
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

  const maxDurationMs = options.maxDurationMs ?? 30_000;
  const maxFrames = options.maxFrames ?? 2_000;
  const observeMutations = options.observeMutations ?? true;
  const detectRageClicks = options.detectRageClicks ?? true;
  const flushOnError = options.flushOnError ?? true;
  const ignoreSelector = options.ignoreSelector ?? DEFAULT_IGNORE_SELECTOR;
  const maskTextSelector = options.maskTextSelector ?? DEFAULT_MASK_SELECTOR;
  const maskAllInputs = options.maskAllInputs ?? true;

  const ringBuffer = new ReplayRingBuffer(maxDurationMs, maxFrames);
  activeRingBuffer = ringBuffer;

  let stopRecorder: (() => void) | undefined;
  if (typeof options.recorder === "function") {
    stopRecorder = options.recorder({
      emit: (event: ReplayFrame, isCheckout?: boolean) => {
        ringBuffer.push(event, isCheckout);
      },
      checkoutEveryNms: maxDurationMs,
      maskAllInputs,
      blockSelector: ignoreSelector,
      maskTextSelector,
    });
  }

  const doFlush = async (trigger: string): Promise<ReplayEnvelope | null> => {
    const frames = ringBuffer.getSnapshotFrames();
    if (frames.length === 0) {
      return null;
    }

    const traceCtx =
      typeof config.traceContext === "function" ? config.traceContext() : null;
    const envelope: ReplayEnvelope = {
      logType: "replay",
      type: "session_replay",
      trigger,
      sessionId: config.sessionId,
      httpSessionId: config.httpSessionId,
      browserSessionId: config.browserSessionId,
      pageUrl:
        typeof self !== "undefined" && self.location ? self.location.href : "",
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
    if (serialized.length <= MAX_KEEPALIVE_BYTES) {
      packageCustomLog(
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
    } else if (typeof fetch === "function" && config.url) {
      // Payloads > 48KB bypass keepalive so the browser's 64KB keepalive limit is never exceeded
      try {
        await fetch(config.url, {
          method: "POST",
          headers: buildHeaders(config),
          body: serialized,
          keepalive: false,
        });
      } catch {
        // Ignore network errors in background replay flush
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
    if (pendingAdded === 0 && pendingRemoved === 0 && pendingAttributes === 0) {
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
      packageCustomLog(
        {
          logType: "mutation",
          type: "mutation",
          target: targets[0] ?? "#document",
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
      for (const rec of records) {
        if (isIgnoredNode(rec.target, ignoreSelector)) {
          continue;
        }
        if (rec.type === "childList") {
          let validAdded = 0;
          for (let i = 0; i < rec.addedNodes.length; i++) {
            if (!isIgnoredNode(rec.addedNodes[i], ignoreSelector)) {
              validAdded++;
            }
          }
          let validRemoved = 0;
          for (let i = 0; i < rec.removedNodes.length; i++) {
            if (!isIgnoredNode(rec.removedNodes[i], ignoreSelector)) {
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

        if (rec.target && pendingTargets.size < 10) {
          const sel = getSelector(rec.target);
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
    if (isIgnoredNode(e.target, ignoreSelector)) {
      return;
    }
    const targetSel = getSelector(e.target);
    const now = Date.now();
    const { isRageClick, clickCount } = rageDetector.recordClick({
      target: targetSel,
      timestamp: now,
      x: typeof e.clientX === "number" ? e.clientX : null,
      y: typeof e.clientY === "number" ? e.clientY : null,
    });

    if (isRageClick) {
      const rect = getTargetRect(e.target);
      packageCustomLog(
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

  // Error trigger for Layer 2 replay flush
  const onWindowError = () => {
    void doFlush("error");
  };
  if (
    flushOnError &&
    typeof self !== "undefined" &&
    typeof self.addEventListener === "function"
  ) {
    self.addEventListener("error", onWindowError);
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
    }
    if (typeof stopRecorder === "function") {
      stopRecorder();
      stopRecorder = undefined;
    }
    rageDetector.reset();
    ringBuffer.clear();
  };

  activeStopFn = cleanup;
  return cleanup;
}

/**
 * Returns the active ReplayRingBuffer instance if session replay is running.
 */
export function getActiveReplayRingBuffer(): ReplayRingBuffer | null {
  return activeRingBuffer;
}

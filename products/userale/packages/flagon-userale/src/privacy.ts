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

import {
  closestComposed,
  DEFAULT_IGNORE_SELECTOR,
  getEventOriginElement,
  isDocumentNode,
  isNodeIgnored,
} from "@/domUtils";
import type { Logging, Settings } from "@/types";

export const DEFAULT_PRIVACY_OPTIONS: Readonly<Settings.ResolvedPrivacyOptions> =
  Object.freeze({
    preset: "default",
    allowlistSelector: null,
    capturePageUrl: true,
    capturePageTitle: true,
    capturePageReferrer: true,
    captureHost: true,
    captureUserAgent: true,
    captureScreenRes: true,
    captureLocation: true,
    captureTargetRect: true,
    captureDetails: true,
    captureMicroTime: true,
    attachTraceContext: true,
    ignoreUntrustedEvents: false,
    domSelectorMode: "full",
    allowedAttributes: null,
  });

export const STRICT_PRIVACY_OPTIONS: Readonly<Settings.ResolvedPrivacyOptions> =
  Object.freeze({
    preset: "strict",
    allowlistSelector: null,
    capturePageUrl: false,
    capturePageTitle: false,
    capturePageReferrer: false,
    captureHost: false,
    captureUserAgent: false,
    captureScreenRes: false,
    captureLocation: false,
    captureTargetRect: false,
    captureDetails: false,
    captureMicroTime: false,
    attachTraceContext: false,
    ignoreUntrustedEvents: true,
    domSelectorMode: "none",
    allowedAttributes: Object.freeze([]) as unknown as string[],
  });

const PRIVACY_BOOL_KEYS = [
  "capturePageUrl",
  "capturePageTitle",
  "capturePageReferrer",
  "captureHost",
  "captureUserAgent",
  "captureScreenRes",
  "captureLocation",
  "captureTargetRect",
  "captureDetails",
  "captureMicroTime",
  "attachTraceContext",
  "ignoreUntrustedEvents",
] as const;

const ATTRIBUTE_BLACKLIST = new Set(["style", "data-api-key", "data-auth"]);
const SENSITIVE_ATTRIBUTE_RE = /^data-(api-key|auth|token|secret|password)/i;

export function isPrivacySensitiveAttribute(name: string): boolean {
  return (
    ATTRIBUTE_BLACKLIST.has(name.toLowerCase()) ||
    SENSITIVE_ATTRIBUTE_RE.test(name)
  );
}

export function validateCssSelector(selector: string): boolean {
  if (typeof selector !== "string" || selector.trim().length === 0) {
    return false;
  }
  if (
    typeof document !== "undefined" &&
    typeof document.createElement === "function"
  ) {
    try {
      document.createElement("div").matches(selector);
      return true;
    } catch {
      return false;
    }
  }
  return true;
}

export function clonePrivacyOptions(
  opts: Settings.ResolvedPrivacyOptions,
): Settings.ResolvedPrivacyOptions {
  return {
    preset: opts.preset,
    allowlistSelector: opts.allowlistSelector,
    capturePageUrl: opts.capturePageUrl,
    capturePageTitle: opts.capturePageTitle,
    capturePageReferrer: opts.capturePageReferrer,
    captureHost: opts.captureHost,
    captureUserAgent: opts.captureUserAgent,
    captureScreenRes: opts.captureScreenRes,
    captureLocation: opts.captureLocation,
    captureTargetRect: opts.captureTargetRect,
    captureDetails: opts.captureDetails,
    captureMicroTime: opts.captureMicroTime,
    attachTraceContext: opts.attachTraceContext,
    ignoreUntrustedEvents: opts.ignoreUntrustedEvents,
    domSelectorMode: opts.domSelectorMode,
    allowedAttributes: Array.isArray(opts.allowedAttributes)
      ? [...opts.allowedAttributes]
      : null,
  };
}

export function freezePrivacyOptions(
  opts: Settings.ResolvedPrivacyOptions,
): Readonly<Settings.ResolvedPrivacyOptions> {
  const cloned = clonePrivacyOptions(opts);
  if (Array.isArray(cloned.allowedAttributes)) {
    Object.freeze(cloned.allowedAttributes);
  }
  return Object.freeze(cloned);
}

function hasOwn(obj: object, key: string): boolean {
  return Object.prototype.hasOwnProperty.call(obj, key);
}

export function mergePrivacyOptions(
  current: Settings.ResolvedPrivacyOptions,
  incoming?: Settings.PrivacyOptions | null,
): {
  resolved: Settings.ResolvedPrivacyOptions;
  allowlistSelectorInvalid: boolean;
} {
  if (!incoming || typeof incoming !== "object") {
    const cloned = clonePrivacyOptions(current);
    return {
      resolved: cloned,
      allowlistSelectorInvalid:
        cloned.allowlistSelector !== null &&
        !validateCssSelector(cloned.allowlistSelector),
    };
  }

  let base: Settings.ResolvedPrivacyOptions;
  if (hasOwn(incoming, "preset")) {
    if (incoming.preset === "strict" && current.preset !== "strict") {
      base = clonePrivacyOptions(STRICT_PRIVACY_OPTIONS);
    } else if (incoming.preset === "default" && current.preset !== "default") {
      base = clonePrivacyOptions(DEFAULT_PRIVACY_OPTIONS);
    } else {
      base = clonePrivacyOptions(current);
    }
  } else {
    base = clonePrivacyOptions(current);
  }

  for (const key of PRIVACY_BOOL_KEYS) {
    if (hasOwn(incoming, key)) {
      const val = incoming[key];
      if (typeof val === "boolean") {
        base[key] = val;
      }
    }
  }

  if (hasOwn(incoming, "domSelectorMode")) {
    const mode = incoming.domSelectorMode;
    if (mode === "full" || mode === "structural" || mode === "none") {
      base.domSelectorMode = mode;
    }
  }

  if (hasOwn(incoming, "allowlistSelector")) {
    const sel = incoming.allowlistSelector;
    if (sel === null) {
      base.allowlistSelector = null;
    } else if (typeof sel === "string") {
      base.allowlistSelector = sel;
    }
  }

  if (hasOwn(incoming, "allowedAttributes")) {
    const attrs = incoming.allowedAttributes;
    if (attrs === null) {
      base.allowedAttributes = null;
    } else if (Array.isArray(attrs)) {
      const seen = new Set<string>();
      for (const item of attrs) {
        if (typeof item === "string" && item.length > 0) {
          seen.add(item);
        }
      }
      base.allowedAttributes = Array.from(seen);
    }
  }

  let allowlistSelectorInvalid = false;
  if (
    base.allowlistSelector !== null &&
    !validateCssSelector(base.allowlistSelector)
  ) {
    allowlistSelectorInvalid = true;
    console.error(
      "[UserALE] Invalid privacy.allowlistSelector; failing closed.",
    );
  }

  return { resolved: base, allowlistSelectorInvalid };
}

export function evaluateEventPrivacyFilter(
  e: Event,
  privacy: Settings.ResolvedPrivacyOptions,
  allowlistSelectorInvalid: boolean,
  ignoreSelector: string = DEFAULT_IGNORE_SELECTOR,
): { allowed: boolean; matchedElement: Element | null } {
  if (
    privacy.ignoreUntrustedEvents &&
    (e as { isTrusted?: boolean }).isTrusted === false
  ) {
    return { allowed: false, matchedElement: null };
  }

  // Opt-out ignore markers always take precedence over any allowlistSelector.
  if (isNodeIgnored(e, ignoreSelector)) {
    return { allowed: false, matchedElement: null };
  }

  if (allowlistSelectorInvalid) {
    return { allowed: false, matchedElement: null };
  }

  if (privacy.allowlistSelector !== null) {
    const originEl = getEventOriginElement(e);
    if (originEl !== null) {
      const matched = closestComposed(originEl, privacy.allowlistSelector);
      return matched
        ? { allowed: true, matchedElement: matched }
        : { allowed: false, matchedElement: null };
    }
    const target = (e as { target?: unknown }).target;
    const isWindowOrDoc =
      (typeof self !== "undefined" && target === self) ||
      target === globalThis ||
      isDocumentNode(target);
    return isWindowOrDoc
      ? { allowed: true, matchedElement: null }
      : { allowed: false, matchedElement: null };
  }

  return { allowed: true, matchedElement: getEventOriginElement(e) };
}

export function stripSelectorToStructural(sel: string): string {
  if (!sel || sel === "#document" || sel === "Window" || sel === "Unknown") {
    return sel;
  }
  const hashIdx = sel.indexOf("#");
  const dotIdx = sel.indexOf(".");
  let cutIdx = -1;
  if (hashIdx >= 0 && dotIdx >= 0) {
    cutIdx = Math.min(hashIdx, dotIdx);
  } else if (hashIdx >= 0) {
    cutIdx = hashIdx;
  } else if (dotIdx >= 0) {
    cutIdx = dotIdx;
  }
  return cutIdx >= 0 ? sel.slice(0, cutIdx) : sel;
}

export function stripUrlHost(rawUrl: string): string {
  if (!rawUrl) {
    return "";
  }
  try {
    const parsed = new URL(rawUrl, "https://placeholder.invalid");
    return parsed.pathname || "/";
  } catch {
    return rawUrl.replace(/^[a-zA-Z][a-zA-Z\d+\-.]*:\/\/[^/?#]*/, "");
  }
}

export function safeReadPageUrl(
  privacy: Settings.ResolvedPrivacyOptions,
): string {
  if (!privacy.capturePageUrl) {
    return "";
  }
  if (typeof self === "undefined" || !self.location) {
    return "";
  }
  if (!privacy.captureHost) {
    return self.location.pathname ?? "";
  }
  return self.location.href ?? "";
}

export function safeReadPageTitle(
  privacy: Settings.ResolvedPrivacyOptions,
): string {
  if (!privacy.capturePageTitle || typeof document === "undefined") {
    return "";
  }
  return document.title ?? "";
}

export function safeReadPageReferrer(
  privacy: Settings.ResolvedPrivacyOptions,
): string {
  if (!privacy.capturePageReferrer || typeof document === "undefined") {
    return "";
  }
  return document.referrer ?? "";
}

export function safeReadUserAgent(
  privacy: Settings.ResolvedPrivacyOptions,
): string {
  if (
    !privacy.captureUserAgent ||
    typeof self === "undefined" ||
    !self.navigator
  ) {
    return "";
  }
  return self.navigator.userAgent ?? "";
}

export function enforcePrivacyOnLog(
  log: Logging.Log,
  privacy: Settings.ResolvedPrivacyOptions,
  opts: { isPackaged: boolean },
): Logging.Log {
  if (
    privacy.capturePageUrl &&
    privacy.capturePageTitle &&
    privacy.capturePageReferrer &&
    privacy.captureHost &&
    privacy.captureUserAgent &&
    privacy.captureScreenRes &&
    privacy.captureLocation &&
    privacy.captureTargetRect &&
    privacy.captureDetails &&
    privacy.captureMicroTime &&
    privacy.attachTraceContext &&
    privacy.domSelectorMode === "full" &&
    privacy.allowedAttributes === null
  ) {
    return log;
  }

  const out: Logging.Log = { ...log };
  const isPackaged = opts.isPackaged;

  if (!privacy.capturePageUrl) {
    if (isPackaged || "pageUrl" in out) {
      out.pageUrl = "";
    }
  } else if (!privacy.captureHost) {
    if (typeof out.pageUrl === "string" && out.pageUrl.length > 0) {
      out.pageUrl = stripUrlHost(out.pageUrl);
    }
  }

  if (!privacy.captureHost) {
    delete out.host;
  }

  if (!privacy.capturePageTitle) {
    if (isPackaged || "pageTitle" in out) {
      out.pageTitle = "";
    }
  }

  if (!privacy.capturePageReferrer) {
    if (isPackaged || "pageReferrer" in out) {
      out.pageReferrer = "";
    }
  }

  if (!privacy.captureUserAgent) {
    if (isPackaged || "userAgent" in out) {
      out.userAgent = "";
    }
    if ("browser" in out) {
      out.browser = { browser: null, version: null };
    }
  }

  if (!privacy.captureScreenRes) {
    if (isPackaged || "scrnRes" in out) {
      out.scrnRes = null;
    }
  }

  if (!privacy.captureLocation) {
    if ("location" in out) {
      out.location = null;
    }
  }

  if (!privacy.captureTargetRect) {
    delete out.targetRect;
  }

  if (!privacy.captureDetails) {
    if (isPackaged || "details" in out) {
      out.details = null;
    }
  }

  if (!privacy.captureMicroTime) {
    if ("microTime" in out) {
      out.microTime = null;
    }
  }

  if (!privacy.attachTraceContext) {
    delete out.traceId;
    delete out.spanId;
  }

  if (privacy.domSelectorMode === "none") {
    if ("target" in out) {
      out.target = "";
    }
    if ("path" in out) {
      out.path = [];
    }
  } else if (privacy.domSelectorMode === "structural") {
    if (typeof out.target === "string") {
      out.target = stripSelectorToStructural(out.target);
    }
    if (Array.isArray(out.path)) {
      out.path = out.path.map((item) =>
        typeof item === "string" ? stripSelectorToStructural(item) : item,
      );
    }
  }

  if (Array.isArray(privacy.allowedAttributes)) {
    const allowedSet = new Set(
      privacy.allowedAttributes.filter((k) => !isPrivacySensitiveAttribute(k)),
    );
    if (
      out.attributes &&
      typeof out.attributes === "object" &&
      !Array.isArray(out.attributes)
    ) {
      const filtered: Record<string, string> = {};
      for (const [k, v] of Object.entries(
        out.attributes as Record<string, unknown>,
      )) {
        if (allowedSet.has(k) && v !== undefined && v !== null) {
          filtered[k] = typeof v === "string" ? v : String(v);
        }
      }
      out.attributes = filtered;
    }
    if ("style" in out) {
      out.style = {};
    }
  }

  return out;
}

/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

export const MAX_ALLOWLIST_LENGTH = 512
export const DEFAULT_ALLOWLIST_PATTERN = "^https://flagon\\.apache\\.org/"

const LOCAL_DEV_HOSTS = new Set(["localhost", "127.0.0.1", "[::1]"])

/**
 * Generates a cryptographically random OAuth `state` parameter using Web Crypto.
 */
export function generateOAuthState(byteLength = 32): string {
  const cryptoApi = globalThis.crypto
  if (!cryptoApi || typeof cryptoApi.getRandomValues !== "function") {
    throw new Error("Web Crypto API is unavailable for OAuth state generation")
  }
  const bytes = new Uint8Array(byteLength)
  cryptoApi.getRandomValues(bytes)
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("")
}

/**
 * Constant-time comparison of expected vs returned OAuth `state`.
 */
export function verifyOAuthState(
  expected: string,
  actual: string | null | undefined
): boolean {
  if (!expected || typeof actual !== "string" || actual.length === 0) {
    return false
  }
  if (expected.length !== actual.length) {
    return false
  }
  let diff = 0
  for (let i = 0; i < expected.length; i++) {
    diff |= expected.charCodeAt(i) ^ actual.charCodeAt(i)
  }
  return diff === 0
}

/**
 * Validates and normalizes an OAuth issuer URL.
 * Requires `https://` except for explicit loopback development hosts.
 */
export function validateIssuerUrl(raw: string): string {
  if (typeof raw !== "string" || !raw.trim()) {
    throw new Error("Issuer URL must be a non-empty URL")
  }

  let parsed: URL
  try {
    parsed = new URL(raw.trim())
  } catch {
    throw new Error("Issuer URL is not a valid URL")
  }

  if (parsed.username || parsed.password) {
    throw new Error("Issuer URL must not contain embedded credentials")
  }

  if (parsed.search || parsed.hash) {
    throw new Error("Issuer URL must not contain query parameters or fragments")
  }

  const hostname = parsed.hostname.toLowerCase()
  const isHttps = parsed.protocol === "https:"
  const isLoopbackHttp =
    parsed.protocol === "http:" && LOCAL_DEV_HOSTS.has(hostname)

  if (!isHttps && !isLoopbackHttp) {
    throw new Error(
      "Issuer URL must use https:// (or http://localhost for local development)"
    )
  }

  const cleanPath = parsed.pathname.replace(/\/+$/, "")
  return `${parsed.origin}${cleanPath}`
}

/**
 * Linear-time check for nested quantifiers such as `(a+)+`, `(a*)*`, or `([a-z]+){2,}`
 * that can trigger catastrophic backtracking (ReDoS).
 */
function hasNestedQuantifiers(pattern: string): boolean {
  const groupHasQuantifier: boolean[] = []
  let inCharClass = false

  const isQuantifierChar = (ch: string | undefined): boolean =>
    ch === "+" || ch === "*" || ch === "?" || ch === "{"

  const applyQuantifierToParent = () => {
    if (groupHasQuantifier.length > 0) {
      groupHasQuantifier[groupHasQuantifier.length - 1] = true
    }
  }

  for (let i = 0; i < pattern.length; i++) {
    const ch = pattern[i]

    if (ch === "\\") {
      // Skip escaped character and check if a quantifier follows outside char classes
      if (i + 1 < pattern.length) {
        i++
        if (!inCharClass && isQuantifierChar(pattern[i + 1])) {
          applyQuantifierToParent()
        }
      }
      continue
    }

    if (inCharClass) {
      if (ch === "]") {
        inCharClass = false
        if (isQuantifierChar(pattern[i + 1])) {
          applyQuantifierToParent()
        }
      }
      continue
    }

    if (ch === "[") {
      inCharClass = true
      continue
    }

    if (ch === "(") {
      groupHasQuantifier.push(false)
      continue
    }

    if (ch === ")") {
      const innerQuantified = groupHasQuantifier.pop() ?? false
      if (innerQuantified) {
        if (isQuantifierChar(pattern[i + 1])) {
          return true
        }
        applyQuantifierToParent()
      } else if (isQuantifierChar(pattern[i + 1])) {
        applyQuantifierToParent()
      }
      continue
    }

    if (ch === "+" || ch === "*" || ch === "?" || ch === "{") {
      // Group prefixes like `(?:...)`, `(?=...)`, `(?<name>...)` are not quantifiers
      if (ch === "?" && i > 0 && pattern[i - 1] === "(") {
        continue
      }
      // Distinguish brace quantifier `{n}` / `{n,m}` from literal `{`
      if (ch === "{" && !/^\{\d+(?:,\d*)?\}/.test(pattern.slice(i))) {
        continue
      }
      applyQuantifierToParent()
    }
  }

  return false
}

export type AllowListValidationResult =
  { valid: true } | { valid: false; reason: string }

/**
 * Validates a user-supplied URL allowlist regex pattern against size limits,
 * catastrophic backtracking heuristics, and RegExp syntax errors.
 */
export function validateAllowListPattern(
  pattern: string
): AllowListValidationResult {
  if (typeof pattern !== "string" || !pattern.trim()) {
    return { valid: false, reason: "Allowlist pattern must not be empty" }
  }

  if (pattern.length > MAX_ALLOWLIST_LENGTH) {
    return {
      valid: false,
      reason: `Allowlist pattern exceeds maximum length of ${MAX_ALLOWLIST_LENGTH} characters`
    }
  }

  if (hasNestedQuantifiers(pattern)) {
    return {
      valid: false,
      reason:
        "Allowlist pattern contains nested quantifiers that may cause excessive backtracking"
    }
  }

  try {
    new RegExp(pattern)
  } catch (err) {
    return {
      valid: false,
      reason: err instanceof Error ? err.message : "Invalid regular expression"
    }
  }

  return { valid: true }
}

/**
 * Compiles an allowlist regex safely, returning `null` (fail-closed) when invalid.
 */
export function compileAllowListRegExp(pattern: string): RegExp | null {
  const result = validateAllowListPattern(pattern)
  if (!result.valid) {
    return null
  }
  return new RegExp(pattern)
}

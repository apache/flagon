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

import assert from "node:assert/strict"
import { describe, it } from "node:test"

import {
  compileAllowListRegExp,
  DEFAULT_ALLOWLIST_PATTERN,
  generateOAuthState,
  MAX_ALLOWLIST_LENGTH,
  validateAllowListPattern,
  validateIssuerUrl,
  verifyOAuthState
} from "../src/utils/security"

describe("extension security utilities", () => {
  describe("OAuth state generation and verification", () => {
    it("generates distinct 64-char hex state tokens", () => {
      const a = generateOAuthState()
      const b = generateOAuthState()
      assert.match(a, /^[0-9a-f]{64}$/)
      assert.match(b, /^[0-9a-f]{64}$/)
      assert.notEqual(a, b)
    })

    it("verifies matching state and rejects mismatches or empty values", () => {
      const expected = generateOAuthState()
      assert.equal(verifyOAuthState(expected, expected), true)
      assert.equal(
        verifyOAuthState(
          expected,
          expected.slice(0, -1) + (expected.endsWith("0") ? "1" : "0")
        ),
        false
      )
      assert.equal(verifyOAuthState(expected, expected.slice(0, 16)), false)
      assert.equal(verifyOAuthState(expected, ""), false)
      assert.equal(verifyOAuthState(expected, null), false)
      assert.equal(verifyOAuthState(expected, undefined), false)
      assert.equal(verifyOAuthState("", ""), false)
    })
  })

  describe("validateIssuerUrl", () => {
    it("accepts https URLs and strips trailing slashes", () => {
      assert.equal(
        validateIssuerUrl("https://issuer.example.com/realms/demo/"),
        "https://issuer.example.com/realms/demo"
      )
      assert.equal(
        validateIssuerUrl("  https://auth.example.com  "),
        "https://auth.example.com"
      )
    })

    it("allows plaintext http only for loopback development hosts", () => {
      assert.equal(
        validateIssuerUrl("http://localhost:8080/realms/dev"),
        "http://localhost:8080/realms/dev"
      )
      assert.equal(
        validateIssuerUrl("http://127.0.0.1:8080"),
        "http://127.0.0.1:8080"
      )
      assert.equal(
        validateIssuerUrl("http://[::1]:8080/auth"),
        "http://[::1]:8080/auth"
      )
    })

    it("rejects non-loopback http, non-http schemes, embedded credentials, and query strings", () => {
      assert.throws(() => validateIssuerUrl(""), /non-empty/)
      assert.throws(() => validateIssuerUrl("not a url"), /valid URL/)
      assert.throws(
        () => validateIssuerUrl("http://issuer.example.com/realms/prod"),
        /https/
      )
      assert.throws(() => validateIssuerUrl("javascript:alert(1)"), /https/)
      assert.throws(
        () => validateIssuerUrl("https://user:pass@issuer.example.com"),
        /credentials/
      )
      assert.throws(
        () => validateIssuerUrl("https://issuer.example.com?foo=bar"),
        /query parameters/
      )
    })
  })

  describe("allowlist regex validation and compilation", () => {
    it("escapes dots in DEFAULT_ALLOWLIST_PATTERN", () => {
      const re = compileAllowListRegExp(DEFAULT_ALLOWLIST_PATTERN)
      assert.ok(re)
      assert.equal(re.test("https://flagon.apache.org/docs"), true)
      assert.equal(re.test("https://flagonXapacheYorg/docs"), false)
      assert.equal(re.test("http://flagon.apache.org/docs"), false)
    })

    it("permits valid patterns including '.*' and non-capturing groups", () => {
      const wildcard = compileAllowListRegExp(".*")
      assert.ok(wildcard)
      assert.equal(wildcard.test("http://localhost:8000/"), true)

      const grouped = compileAllowListRegExp(
        "^https://(?:app|docs)\\.example\\.com/"
      )
      assert.ok(grouped)
      assert.equal(grouped.test("https://app.example.com/page"), true)
    })

    it("rejects empty, oversized, nested-quantifier ReDoS, and invalid patterns", () => {
      assert.equal(validateAllowListPattern("").valid, false)
      assert.equal(validateAllowListPattern("   ").valid, false)
      assert.equal(compileAllowListRegExp(""), null)

      const oversized = "a".repeat(MAX_ALLOWLIST_LENGTH + 1)
      assert.equal(validateAllowListPattern(oversized).valid, false)
      assert.equal(compileAllowListRegExp(oversized), null)

      assert.equal(validateAllowListPattern("(a+)+$").valid, false)
      assert.equal(validateAllowListPattern("([a-z]*)*").valid, false)
      assert.equal(validateAllowListPattern("((a+)b)+").valid, false)
      assert.equal(compileAllowListRegExp("(a+)+$"), null)

      assert.equal(validateAllowListPattern("[unclosed").valid, false)
      assert.equal(compileAllowListRegExp("[unclosed"), null)
    })
  })
})

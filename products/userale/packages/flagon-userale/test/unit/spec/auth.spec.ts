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
import { Configuration } from "@/configure";
import {
  authCallback,
  registerAuthCallback,
  resetAuthCallback,
  updateAuthHeader,
  verifyAuthCallback,
} from "@/utils";

const config = Configuration.getInstance();

describe("verifyCallback", () => {
  it("should not throw error for valid callback", () => {
    const validCallback = jest.fn().mockReturnValue("someString");
    expect(() => verifyAuthCallback(validCallback)).not.toThrow();
  });

  it("should throw error for non-function callback", () => {
    const nonFunctionCallback = "notAFunction";
    // @ts-ignore
    // This is a test case to check if the function throws an error when the callback is not a function
    // which should only happen in a Javascript environment
    expect(() => verifyAuthCallback(nonFunctionCallback)).toThrow(
      "Userale auth callback must be a function",
    );
  });

  it("should throw error for non-string callback return", () => {
    const invalidReturnCallback = jest.fn().mockReturnValue(123);
    expect(() => verifyAuthCallback(invalidReturnCallback)).toThrow(
      "Userale auth callback must return a string",
    );
  });

  it("should not throw error for valid callback with empty string return", () => {
    const validCallback = jest.fn().mockReturnValue("");
    expect(() => verifyAuthCallback(validCallback)).not.toThrow();
  });
});

describe("registerAuthCallback", () => {
  afterEach(() => {
    resetAuthCallback();
  });

  it("should register a valid callback", () => {
    const validCallback = jest.fn().mockReturnValue("someString");
    expect(registerAuthCallback(validCallback)).toBe(true);
    expect(authCallback).toBe(validCallback);
  });

  it("should not register a non-function callback", () => {
    const nonFunctionCallback = "notAFunction";
    // @ts-ignore
    // This is a test case to check if the function throws an error when the callback is not a function
    // which should only happen in a Javascript environment
    expect(registerAuthCallback(nonFunctionCallback)).toBe(false);
    expect(authCallback).toBeNull();
  });

  it("should not register a callback with invalid return type", () => {
    const invalidReturnCallback = jest.fn().mockReturnValue(123);
    expect(registerAuthCallback(invalidReturnCallback)).toBe(false);
    expect(authCallback).toBeNull();
  });

  it("should register a callback with empty string return", () => {
    const validCallback = jest.fn().mockReturnValue("");
    expect(registerAuthCallback(validCallback)).toBe(true);
    expect(authCallback).toBe(validCallback);
  });
});

describe("updateAuthHeader", () => {
  beforeEach(() => {
    config.reset();
  });

  afterEach(() => {
    resetAuthCallback();
  });

  it("should update auth header when authCallback is provided", () => {
    const validCallback = jest.fn().mockReturnValue("someString");
    registerAuthCallback(validCallback);
    updateAuthHeader(config);
    expect(config.authHeader).toBe("someString");
  });

  it("should not update auth header when authCallback is not provided", () => {
    updateAuthHeader(config);
    expect(config.authHeader).toBeNull();
  });

  it("should not update auth header when authCallback returns non-string", () => {
    const invalidReturnCallback = jest.fn().mockReturnValue(123);
    registerAuthCallback(invalidReturnCallback);
    updateAuthHeader(config);
    expect(config.authHeader).toBeNull();
  });

  it("should update auth header with empty string return from authCallback", () => {
    const validCallback = jest.fn().mockReturnValue("");
    registerAuthCallback(validCallback);
    updateAuthHeader(config);
    expect(config.authHeader).toBe("");
  });

  it("should handle errors thrown during authCallback execution", () => {
    const errorThrowingCallback = jest.fn().mockImplementation(() => {
      throw new Error("Callback execution failed");
    });
    registerAuthCallback(errorThrowingCallback);
    updateAuthHeader(config);
    expect(config.authHeader).toBeNull();
  });
});

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
  headersCallback,
  registerHeadersCallback,
  resetHeadersCallback,
  updateCustomHeaders,
  verifyHeadersCallback,
} from "@/utils";

const config = Configuration.getInstance();

describe("verifyCallback", () => {
  it("should not throw error for valid callback", () => {
    const validCallback = jest.fn().mockReturnValue({
      "x-api-token": "someString",
      "x-abc-def": "someOtherString",
    });
    expect(() => verifyHeadersCallback(validCallback)).not.toThrow();
  });

  it("should throw error for non-function callback", () => {
    const nonFunctionCallback = "notAFunction";
    // @ts-ignore
    // This is a test case to check if the function throws an error when the callback is not a function
    // which should only happen in a Javascript environment
    expect(() => verifyHeadersCallback(nonFunctionCallback)).toThrow(
      "Userale headers callback must be a function",
    );
  });

  it("should throw error for non-object callback return", () => {
    const invalidReturnCallback = jest.fn().mockReturnValue(123);
    expect(() => verifyHeadersCallback(invalidReturnCallback)).toThrow(
      "Userale headers callback must return an object",
    );
  });

  it("should throw error for incorrect headers object return", () => {
    const invalidReturnCallback = jest
      .fn()
      .mockReturnValue({ "x-not-a-proper-value": 123 });
    expect(() => verifyHeadersCallback(invalidReturnCallback)).toThrow(
      "Userale header callback must return an object with string keys and values",
    );
  });

  it("should not throw error for valid callback with empty object return", () => {
    const validCallback = jest.fn().mockReturnValue({});
    expect(() => verifyHeadersCallback(validCallback)).not.toThrow();
  });
});

describe("registerHeadersCallback", () => {
  afterEach(() => {
    resetHeadersCallback();
  });

  it("should register a valid callback", () => {
    const validCallback = jest.fn().mockReturnValue({
      "x-api-token": "someString",
      "x-abc-def": "someOtherString",
    });
    expect(registerHeadersCallback(validCallback)).toBe(true);
    expect(headersCallback).toBe(validCallback);
  });

  it("should not register a non-function callback", () => {
    const nonFunctionCallback = "notAFunction";
    // @ts-ignore
    // This is a test case to check if the function throws an error when the callback is not a function
    // which should only happen in a Javascript environment
    expect(registerHeadersCallback(nonFunctionCallback)).toBe(false);
    expect(headersCallback).toBeNull();
  });

  it("should not register a callback with invalid return type", () => {
    const invalidReturnCallback = jest.fn().mockReturnValue(123);
    expect(registerHeadersCallback(invalidReturnCallback)).toBe(false);
    expect(headersCallback).toBeNull();
  });

  it("should register a callback with empty object return", () => {
    const validCallback = jest.fn().mockReturnValue({});
    expect(registerHeadersCallback(validCallback)).toBe(true);
    expect(headersCallback).toBe(validCallback);
  });
});

describe("updateCustomHeader", () => {
  beforeEach(() => config.reset());

  afterEach(() => {
    resetHeadersCallback();
  });

  it("should update custom headers when headersCallback is provided", () => {
    const customHeaders = {
      "x-api-token": "someString",
      "x-abc-def": "someOtherString",
    };
    const validCallback = jest.fn().mockReturnValue(customHeaders);
    registerHeadersCallback(validCallback);
    updateCustomHeaders(config);
    expect(config.headers).toBe(customHeaders);
  });

  it("should not update custom headers when headersCallback is not provided", () => {
    updateCustomHeaders(config);
    expect(config.headers).toBeNull();
  });

  it("should not update custom headers when headersCallback returns non-object", () => {
    const invalidReturnCallback = jest.fn().mockReturnValue(123);
    registerHeadersCallback(invalidReturnCallback);
    updateCustomHeaders(config);
    expect(config.headers).toBeNull();
  });

  it("should update custom headers with empty string return from headersCallback", () => {
    const validCallback = jest.fn().mockReturnValue({});
    registerHeadersCallback(validCallback);
    updateCustomHeaders(config);
    expect(config.headers).toEqual({});
  });

  it("should handle errors thrown during headersCallback execution", () => {
    const errorThrowingCallback = jest.fn().mockImplementation(() => {
      throw new Error("Callback execution failed");
    });
    registerHeadersCallback(errorThrowingCallback);
    updateCustomHeaders(config);
    expect(config.headers).toBeNull();
  });
});

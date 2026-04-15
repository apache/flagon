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
import { Configuration } from "@/Configuration";
import { Sender } from "@/Sender";
import { registerAuthCallback, registerHeadersCallback } from "@/utils";

import type { Logging } from "@/types";

const config = Configuration.getInstance();

function stubLog(fields: Record<string, unknown> = {}): Logging.Log {
  return {
    logType: "custom",
    type: "test",
    pageUrl: "",
    pageTitle: "",
    pageReferrer: "",
    userAgent: "",
    clientTime: Date.now(),
    scrnRes: { width: 0, height: 0 },
    userAction: false,
    details: null,
    userId: null,
    toolVersion: null,
    toolName: null,
    useraleVersion: null,
    sessionId: null,
    httpSessionId: null,
    browserSessionId: null,
    ...fields,
  } as Logging.Log;
}

describe("sendLogs", () => {
  let fetchSpy: jest.SpyInstance;

  beforeEach(() => {
    config.reset();
    fetchSpy = jest
      .spyOn(global, "fetch")
      .mockResolvedValue(new Response(null, { status: 200 }));
  });

  afterEach(() => {
    fetchSpy.mockRestore();
  });

  it("sends logs on an interval", (done) => {
    config.update({
      on: true,
      transmitInterval: 500,
      url: "http://test.com",
      logCountThreshold: 2,
    });
    const logs: Array<Logging.Log> = [];
    jest.useFakeTimers();

    const sender = new Sender();
    sender.onInterval(logs, config);

    jest.advanceTimersByTime(config.transmitInterval * 2);
    expect(fetchSpy).not.toHaveBeenCalled();

    logs.push(stubLog({ type: "bar1" }));
    jest.advanceTimersByTime(config.transmitInterval);
    expect(logs.length).toEqual(1);

    logs.push(stubLog({ type: "bar2" }));
    jest.advanceTimersByTime(config.transmitInterval);
    expect(logs.length).toEqual(0);
    expect(fetchSpy).toHaveBeenCalled();

    jest.useRealTimers();
    done();
  });

  it("does not send logs if the config is off", (done) => {
    const logs: Array<Logging.Log> = [];
    config.update({
      on: true,
      transmitInterval: 500,
      url: "http://test.com",
      logCountThreshold: 1,
    });
    jest.useFakeTimers();

    const sender = new Sender();
    sender.onInterval(logs, config);

    logs.push(stubLog({ type: "bar1" }));
    jest.advanceTimersByTime(config.transmitInterval);
    expect(logs.length).toEqual(0);
    expect(fetchSpy).toHaveBeenCalled();

    config.on = false;
    fetchSpy.mockClear();

    logs.push(stubLog({ type: "bar2" }));
    jest.advanceTimersByTime(config.transmitInterval);
    expect(logs.length).toEqual(1);
    expect(fetchSpy).not.toHaveBeenCalled();

    jest.useRealTimers();
    done();
  });

  it("sends logs on page exit with fetch", () => {
    config.update({ on: true, url: "http://test.com" });
    const sender = new Sender();
    sender.onClose([], config);
    sender.onClose([stubLog()], config);
    global.window.dispatchEvent(new window.CustomEvent("pagehide"));

    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });

  it("does not send logs on page exit when config is off", () => {
    config.update({ on: false, url: "test" });
    const sender = new Sender();
    sender.onClose([stubLog()], config);
    global.window.dispatchEvent(new window.CustomEvent("pagehide"));

    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("sends logs with Authorization header when using registerAuthCallback", (done) => {
    const logs: Array<Logging.Log> = [];
    config.update({
      on: true,
      transmitInterval: 500,
      url: "http://test.com",
      logCountThreshold: 1,
    });
    jest.useFakeTimers();

    const authCallback = jest.fn().mockReturnValue("Bearer fakeAuthToken");
    registerAuthCallback(authCallback);

    const sender = new Sender();
    sender.start(logs, config);
    logs.push(stubLog());

    jest.advanceTimersByTime(config.transmitInterval);

    expect(fetchSpy).toHaveBeenCalled();
    const [, fetchOptions] = fetchSpy.mock.calls[0] as [string, RequestInit];
    const headers = new Headers(fetchOptions.headers as HeadersInit);
    expect(headers.get("Authorization")).toBe("Bearer fakeAuthToken");

    jest.useRealTimers();
    done();
  });

  it("sends logs with custom headers when using registerHeadersCallback", (done) => {
    const logs: Array<Logging.Log> = [];
    config.update({
      on: true,
      transmitInterval: 500,
      url: "http://test.com",
      logCountThreshold: 1,
    });
    jest.useFakeTimers();

    const customHeaders = {
      "x-api-token": "someString",
      "x-abc-def": "someOtherString",
    };
    const headersCallback = jest.fn().mockReturnValue(customHeaders);
    registerHeadersCallback(headersCallback);

    const sender = new Sender();
    sender.start(logs, config);
    logs.push(stubLog());

    jest.advanceTimersByTime(config.transmitInterval);

    expect(fetchSpy).toHaveBeenCalled();
    const [, fetchOptions] = fetchSpy.mock.calls[0] as [string, RequestInit];
    const headers = new Headers(fetchOptions.headers as HeadersInit);
    for (const [key, value] of Object.entries(customHeaders)) {
      expect(headers.get(key)).toBe(value);
    }

    jest.useRealTimers();
    done();
  });
});

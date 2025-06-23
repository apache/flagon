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
import { initSender, sendOnInterval, sendOnClose } from "@/sendLogs";
import { registerAuthCallback, registerHeadersCallback } from "@/utils";

import type { Logging } from "@/types";

const config = Configuration.getInstance();
let xhrMock: Partial<XMLHttpRequest>;

describe("sendLogs", () => {
  beforeEach(() => {
    config.reset();
    xhrMock = {
      open: jest.fn(),
      send: jest.fn(),
      setRequestHeader: jest.fn(),
      readyState: 4,
      status: 200,
      responseText: "response",
    };
    jest
      .spyOn(window, "XMLHttpRequest")
      .mockImplementation(() => xhrMock as XMLHttpRequest);
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

    sendOnInterval(logs, config);

    jest.advanceTimersByTime(config.transmitInterval * 2);
    // Make sure it doesn't make requests for no reason
    expect(xhrMock.send).not.toHaveBeenCalled();

    // Make sure it respects the logCountThreshold
    logs.push({ foo: "bar1" });
    jest.advanceTimersByTime(config.transmitInterval);
    expect(logs.length).toEqual(1);

    // Make sure it sends the logs and clears the array
    logs.push({ foo: "bar2" });
    jest.advanceTimersByTime(config.transmitInterval);
    expect(logs.length).toEqual(0);
    expect(xhrMock.send).toHaveBeenCalledTimes(1);

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

    sendOnInterval(logs, config);

    // Make sure it respects the logCountThreshold
    logs.push({ foo: "bar1" });
    jest.advanceTimersByTime(config.transmitInterval);

    expect(logs.length).toEqual(0);
    expect(xhrMock.send).toHaveBeenCalledTimes(1);

    config.on = false;

    logs.push({ foo: "bar2" });
    jest.advanceTimersByTime(config.transmitInterval);
    expect(logs.length).toEqual(1);
    expect(xhrMock.send).toHaveBeenCalledTimes(1);

    jest.useRealTimers();
    done();
  });

  it("sends logs on page exit with fetch", () => {
    const fetchSpy = jest.spyOn(global, "fetch");
    
    config.update({ on: true, url: "http://test.com" });
    sendOnClose([], config);
    config.update({ on: true, url: "http://test.com" });
    sendOnClose([{ foo: "bar" }], config);
    global.window.dispatchEvent(new window.CustomEvent("pagehide"));

    expect(fetchSpy).toHaveBeenCalledTimes(1);

    fetchSpy.mockRestore();
  });


  it("does not send logs on page exit when config is off", () => {
    const fetchSpy = jest.spyOn(global, "fetch");
    
    config.update({ on: false, url: "test" });
    sendOnClose([{ foo: "bar" }], config);
    global.window.dispatchEvent(new window.CustomEvent("pagehide"));

    expect(fetchSpy).not.toHaveBeenCalled();

    fetchSpy.mockRestore();
  });

  it("sends logs with proper auth header when using registerAuthCallback", (done) => {
    const logs: Array<Logging.Log> = [];
    config.update({
      on: true,
      transmitInterval: 500,
      url: "http://test.com",
      logCountThreshold: 1,
    });
    jest.useFakeTimers();
  
    const authCallback = jest.fn().mockReturnValue("fakeAuthToken");
    registerAuthCallback(authCallback);
  
    initSender(logs, config);
    logs.push({ foo: "bar" });
  
    jest.advanceTimersByTime(config.transmitInterval);
  
    expect(xhrMock.send).toHaveBeenCalledTimes(1);
  
    // Filter only calls to setRequestHeader with 'Authorization'
    const calls = (xhrMock.setRequestHeader as jest.Mock).mock.calls;
    const authHeaderCall = calls.find(
      ([header]) => header.toLowerCase() === "authorization"
    );
    
    expect(authHeaderCall?.[0].toLowerCase()).toBe("authorization");
    expect(authHeaderCall?.[1]).toBe("fakeAuthToken");
  
    jest.useRealTimers();
    done();
  });
  

  it("sends logs with proper custom headers when using registerHeadersCallback", (done) => {
    const logs: Array<Logging.Log> = [];
    config.update({
      on: true,
      transmitInterval: 500,
      url: "http://test.com",
      logCountThreshold: 1,
    });
    jest.useFakeTimers();

    // Mock the authCallback function
    const customHeaders = {
      "x-api-token": "someString",
      "x-abc-def": "someOtherString",
    };
    const headersCallback = jest.fn().mockReturnValue(customHeaders);

    // Register the authCallback
    registerHeadersCallback(headersCallback);

    // Initialize sender with logs and config
    initSender(logs, config);

    // Simulate log entry
    logs.push({ foo: "bar" });

    // Trigger interval to send logs
    jest.advanceTimersByTime(config.transmitInterval);

    // Verify that the request has the proper auth header
    expect(xhrMock.send).toHaveBeenCalledTimes(1);
    for (const [key, value] of Object.entries(customHeaders)) {
      expect(xhrMock.setRequestHeader).toHaveBeenCalledWith(key, value);
    }

    jest.useRealTimers();
    done();
  });
});

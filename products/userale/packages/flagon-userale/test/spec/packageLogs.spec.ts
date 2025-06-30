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
import { JSDOM } from "jsdom";
import "global-jsdom/register";
import { Configuration } from "@/configure";
import {
  addCallbacks,
  buildPath,
  cbHandlers,
  extractTimeFields,
  getLocation,
  getSelector,
  initPackager,
  logs,
  packageLog,
  removeCallbacks,
  selectorizePath,
  buildAttrs,
  buildCSS,
} from "@/packageLogs";
import type { Logging } from "@/types";

const config = Configuration.getInstance();

describe("packageLogs", () => {
  beforeEach(() => config.reset());

  describe("addCallbacks", () => {
    it("adds a single callback", () => {
      // Given
      config.update({ on: false });
      initPackager([], config);
      const fn = {
        func1() {
          return true;
        },
      };
      // When
      addCallbacks(fn);
      // Then
      expect(Object.keys(cbHandlers)).toEqual(Object.keys(fn));
    });

    it("adds a list of callbacks", () => {
      // Given
      config.update({ on: false });
      initPackager([], config);
      const fns = {
        func1() {
          return true;
        },
        func2() {
          return false;
        },
      };
      // When
      addCallbacks(fns);
      // Then
      expect(Object.keys(cbHandlers)).toEqual(Object.keys(fns));
    });
  });

  describe("removeCallbacks", () => {
    it("removes a single callback", () => {
      // Given
      config.update({ on: false });
      initPackager([], config);
      const fn = {
        func() {
          return true;
        },
      };
      // When
      addCallbacks(fn);
      removeCallbacks(Object.keys(fn));
      // Then
      expect(Object.keys(cbHandlers)).toHaveLength(0);
    });

    it("removes a list of callbacks", () => {
      // Given
      config.update({ on: false });
      initPackager([], config);
      const fns = {
        func1() {
          return true;
        },
        func2() {
          return false;
        },
      };
      // When
      addCallbacks(fns);
      removeCallbacks(Object.keys(fns));
      // Then
      expect(Object.keys(cbHandlers)).toHaveLength(0);
    });
  });

  describe("packageLog", () => {
    it("only executes if on", () => {
      // Given
      let evt: Event;
      config.update({ on: true });
      initPackager([], config);
      evt = new Event("test");
      // When
      let success = packageLog(evt);
      // Then
      expect(success).toBe(true);
      // Given
      config.update({ on: false });
      initPackager([], config);
      evt = {} as Event;
      // When
      success = packageLog(evt);
      // Then
      expect(success).toBe(false);
    });

    it("calls detailFcn with the event as an argument if provided", () => {
      // Given
      config.update({ on: true });
      initPackager([], config);
      let called = false;
      const evt = new Event("test");
      const detailFcn = (e: Event) => {
        called = true;
        expect(e).toBe(evt);
        return {};
      };
      // When
      packageLog(evt, detailFcn);
      // Then
      expect(called).toBe(true);
    });

    it("packages logs", () => {
      // Given
      config.update({ on: true });
      initPackager([], config);
      const evt = new Event("test");
      // When
      const success = packageLog(evt);
      // Then
      expect(success).toBe(true);
    });

    it("filters logs when a handler is assigned and returns false", () => {
      // Given
      let filterCalled = false;
      const filter = {
        filterAll() {
          filterCalled = true;
          return false;
        },
      };
      const evt = new Event("test");
      config.update({ on: true });
      initPackager([], config);
      // When
      packageLog(evt);
      // Then
      expect(logs.length).toBe(1);
      // Given
      addCallbacks(filter);
      // When
      packageLog(evt);
      // Then
      expect(filterCalled).toBe(true);
      expect(logs.length).toBe(1);
    });

    it("assigns logs to the callback's return value if a handler is assigned", () => {
      // Given
      let mapperCalled = false;
      const mappedLog = { type: "foo" };
      const mapper = {
        mapper() {
          mapperCalled = true;
          return mappedLog;
        },
      };
      const evt = new Event("test");
      config.update({ on: true });
      initPackager([], config);
      addCallbacks(mapper);
      // When
      packageLog(evt);
      // Then
      expect(mapperCalled).toBe(true);
      expect(logs.indexOf(mappedLog)).toBe(0);
    });

    it("does not call a subsequent handler if the log is filtered out", () => {
      // Given
      let mapperCalled = false;
      const filter = () => false;
      const mapper = (log: Logging.Log) => {
        mapperCalled = true;
        return log;
      };
      const evt = new Event("test");
      config.update({ on: true });
      initPackager([], config);
      addCallbacks({ filter, mapper });
      // addCallbacks(mapper);
      // When
      packageLog(evt);
      // Then
      expect(mapperCalled).toBe(false);
    });

    it("does not attempt to call a non-function filter/mapper", () => {
      const evt = new Event("test");
      config.update({ on: true });
      initPackager([], config);
      packageLog(evt);

      // @ts-ignore
      // This is a test case to check if the function throws an error when
      // the callback is not a function. Should only occur in a
      // Javascript environment
      addCallbacks("foo");
      packageLog(evt);

      expect(logs.length).toBe(2);
    });
  });

  describe("extractTimeFields", () => {
    it("returns the millisecond and microsecond portions of a timestamp", () => {
      const timeStamp = 123.456;
      const fields = { milli: 123, micro: 0.456 };
      const ret = extractTimeFields(timeStamp);

      expect(ret.milli).toBe(fields.milli);
      expect(ret.micro).toBe(fields.micro);
    });
    it("sets micro to 0 when no decimal is present", () => {
      const timeStamp = 123;
      const fields = { milli: 123, micro: 0 };
      const ret = extractTimeFields(timeStamp);

      expect(ret.milli).toBe(fields.milli);
      expect(ret.micro).toBe(fields.micro);
    });
    it("always returns an object", () => {
      const stampVariants = [
        null,
        "foobar",
        { foo: "bar" },
        undefined,
        ["foo", "bar"],
        123,
      ];

      stampVariants.forEach((variant) => {
        // @ts-ignore
        // This should only occur in a Javascript environment.
        const ret = extractTimeFields(variant);
        expect(!!ret).toBe(true);
        expect(typeof ret).toBe("object");
      });
    });
  });

  describe("getLocation", () => {
    it("returns event page location", () => {
      new JSDOM(``);
      const document = window.document;
      const ele = document.createElement("div");
      // Create a click in the top left corner of the viewport
      const evt = new window.MouseEvent("click", {
        view: window,
        bubbles: true,
        cancelable: true,
        clientX: 0,
        clientY: 0,
      });
      document.body.appendChild(ele);
      ele.addEventListener("click", (e) => {
        // Expect the click location to be the top left corner of the viewport
        let expectedLocation = { x: window.scrollX, y: window.scrollY };
        expect(getLocation(e)).toEqual(expectedLocation);
      });
      ele.dispatchEvent(evt);
    });

    it("calculates page location if unavailable", () => {
      new JSDOM(``);
      const document = window.document;
      const ele = document.createElement("div");
      const evt = new window.MouseEvent("click", {
        view: window,
        bubbles: true,
        cancelable: true,
      });
      document.body.appendChild(ele);
      ele.addEventListener("click", (e) => {
        document.documentElement.scrollLeft = 0;
        document.documentElement.scrollTop = 0;
        const originalDocument = global.document;
        global.document = document;
        expect(getLocation(e)).toEqual({ x: 0, y: 0 });
        global.document = originalDocument;
      });
      ele.dispatchEvent(evt);
    });

    it("handles null", () => {
      // @ts-ignore
      // This should only occur in a Javascript environment.
      const location = getLocation(null);
      expect(location).toEqual({ x: null, y: null });
    });
  });

  describe("selectorizePath", () => {
    it("returns a new array of the same length provided", () => {
      const arr = [{} as EventTarget, {} as EventTarget];
      const ret = selectorizePath(arr);
      expect(ret).toBeInstanceOf(Array);
      expect(ret).not.toBe(arr);
      expect(ret.length).toBe(arr.length);
    });
  });

  describe("getSelector", () => {
    it("builds a selector", () => {
      new JSDOM(``);
      const document = window.document;
      const element = document.createElement("div");
      expect(getSelector(element)).toBe("div");
      element.id = "bar";
      expect(getSelector(element)).toBe("div#bar");
      element.removeAttribute("id");
      element.classList.add("baz");
      expect(getSelector(element)).toBe("div.baz");
      element.id = "bar";
      expect(getSelector(element)).toBe("div#bar.baz");
    });
    it("identifies window", () => {
      new JSDOM(``);
      expect(getSelector(window)).toBe("Window");
    });

    it("handles a non-null unknown value", () => {
      // @ts-ignore
      // This should only occur in a Javascript environment.
      expect(getSelector("foo")).toBe("Unknown");
    });
  });

  describe("buildPath", () => {
    it("builds a path", () => {
      new JSDOM(``);
      let actualPath;
      const document = window.document;
      const ele = document.createElement("div");
      const evt = new window.Event("CustomEvent", {
        bubbles: true,
        cancelable: true,
      });
      document.body.appendChild(ele);
      ele.addEventListener("CustomEvent", (e) => (actualPath = buildPath(e)));
      ele.dispatchEvent(evt);
      const expectedPath = ["div", "body", "html", "#document", "Window"];
      expect(actualPath).toEqual(expectedPath);
    });
  });

  test("buildAttrs", () => {
    let result;
    const document = window.document;
    const ele = document.createElement("div");
    const evt = new window.Event("CustomEvent", {
      bubbles: true,
      cancelable: true,
    });
    ele.setAttribute("data-json", '{"key": "value"}');
    ele.setAttribute("data-string", "hello");
    ele.setAttribute("style", "color: red;");
    document.body.appendChild(ele);
    ele.addEventListener("CustomEvent", (e) => (result = buildAttrs(e)));
    ele.dispatchEvent(evt);
    expect(result).toEqual({
      "data-json": { key: "value" },
      "data-string": "hello",
    });
    expect(result).not.toHaveProperty("style");
  });

  test("buildCSS", () => {
    let result;
    const document = window.document;
    const ele = document.createElement("div");
    const evt = new window.Event("CustomEvent", {
      bubbles: true,
      cancelable: true,
    });
    ele.style.color = "red";
    ele.style.marginTop = "10px";
    document.body.appendChild(ele);
    ele.addEventListener("CustomEvent", (e) => (result = buildCSS(e)));
    ele.dispatchEvent(evt);
    expect(result).toEqual({
      color: "red",
      "margin-top": "10px",
    });
  });
});

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
import { Configuration } from "@/Configuration";
import {
  Packager,
  buildPath,
  extractTimeFields,
  getLocation,
  getSelector,
  selectorizePath,
  buildAttrs,
  buildCSS,
} from "@/Packager";
import type { Logging } from "@/types";

const config = Configuration.getInstance();

function makePackager() {
  config.reset();
  return new Packager([], config);
}

describe("packageLogs", () => {
  describe("addCallbacks", () => {
    it("adds a single callback", () => {
      const p = makePackager();
      const fn = {
        func1() {
          return true;
        },
      };
      p.addCallbacks(fn);
      expect(Object.keys(p.cbHandlers)).toEqual(Object.keys(fn));
    });

    it("adds a list of callbacks", () => {
      const p = makePackager();
      const fns = {
        func1() {
          return true;
        },
        func2() {
          return false;
        },
      };
      p.addCallbacks(fns);
      expect(Object.keys(p.cbHandlers)).toEqual(Object.keys(fns));
    });
  });

  describe("removeCallbacks", () => {
    it("removes a single callback", () => {
      const p = makePackager();
      const fn = {
        func() {
          return true;
        },
      };
      p.addCallbacks(fn);
      p.removeCallbacks(Object.keys(fn));
      expect(Object.keys(p.cbHandlers)).toHaveLength(0);
    });

    it("removes a list of callbacks", () => {
      const p = makePackager();
      const fns = {
        func1() {
          return true;
        },
        func2() {
          return false;
        },
      };
      p.addCallbacks(fns);
      p.removeCallbacks(Object.keys(fns));
      expect(Object.keys(p.cbHandlers)).toHaveLength(0);
    });
  });

  describe("packageLog", () => {
    it("only executes if on", () => {
      config.update({ on: true });
      const p = new Packager([], config);
      expect(p.packageLog(new Event("test"))).toBe(true);

      config.update({ on: false });
      const p2 = new Packager([], config);
      expect(p2.packageLog({} as Event)).toBe(false);
    });

    it("calls detailFcn with the event as an argument if provided", () => {
      config.update({ on: true });
      const p = new Packager([], config);
      let called = false;
      const evt = new Event("test");
      const detailFcn = (e: Event) => {
        called = true;
        expect(e).toBe(evt);
        return {};
      };
      p.packageLog(evt, detailFcn);
      expect(called).toBe(true);
    });

    it("packages logs", () => {
      config.update({ on: true });
      const p = new Packager([], config);
      expect(p.packageLog(new Event("test"))).toBe(true);
    });

    it("filters logs when a handler returns false", () => {
      config.update({ on: true });
      const p = new Packager([], config);
      const evt = new Event("test");

      p.packageLog(evt);
      expect(p.logs.length).toBe(1);

      p.addCallbacks({
        filterAll() {
          return false;
        },
      });
      p.packageLog(evt);
      expect(p.logs.length).toBe(1);
    });

    it("assigns logs to the callback's return value", () => {
      config.update({ on: true });
      const p = new Packager([], config);
      const mappedLog = { type: "foo" } as Logging.Log;
      let mapperCalled = false;
      p.addCallbacks({
        mapper() {
          mapperCalled = true;
          return mappedLog;
        },
      });
      p.packageLog(new Event("test"));
      expect(mapperCalled).toBe(true);
      expect(p.logs.indexOf(mappedLog)).toBe(0);
    });

    it("does not call a subsequent handler if the log is filtered out", () => {
      config.update({ on: true });
      const p = new Packager([], config);
      let mapperCalled = false;
      p.addCallbacks({
        filter: () => false,
        mapper: (log: Logging.Log) => {
          mapperCalled = true;
          return log;
        },
      });
      p.packageLog(new Event("test"));
      expect(mapperCalled).toBe(false);
    });

    it("does not attempt to call a non-function callback", () => {
      config.update({ on: true });
      const p = new Packager([], config);
      const evt = new Event("test");
      p.packageLog(evt);
      // @ts-ignore — JS-only scenario
      p.addCallbacks("foo");
      p.packageLog(evt);
      expect(p.logs.length).toBe(2);
    });
  });

  describe("extractTimeFields", () => {
    it("returns the millisecond and microsecond portions of a timestamp", () => {
      const ret = extractTimeFields(123.456);
      expect(ret.milli).toBe(123);
      expect(ret.micro).toBe(0.456);
    });
    it("sets micro to 0 when no decimal is present", () => {
      const ret = extractTimeFields(123);
      expect(ret.milli).toBe(123);
      expect(ret.micro).toBe(0);
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
        const ret = extractTimeFields(variant);
        expect(!!ret).toBe(true);
        expect(typeof ret).toBe("object");
      });
    });
  });

  describe("getLocation", () => {
    it("returns event page location", () => {
      new JSDOM(``);
      const ele = window.document.createElement("div");
      const evt = new window.MouseEvent("click", {
        view: window,
        bubbles: true,
        cancelable: true,
        clientX: 0,
        clientY: 0,
      });
      window.document.body.appendChild(ele);
      ele.addEventListener("click", (e) => {
        expect(getLocation(e)).toEqual({
          x: window.scrollX,
          y: window.scrollY,
        });
      });
      ele.dispatchEvent(evt);
    });

    it("calculates page location if unavailable", () => {
      new JSDOM(``);
      const ele = window.document.createElement("div");
      const evt = new window.MouseEvent("click", {
        view: window,
        bubbles: true,
        cancelable: true,
      });
      window.document.body.appendChild(ele);
      ele.addEventListener("click", (e) => {
        window.document.documentElement.scrollLeft = 0;
        window.document.documentElement.scrollTop = 0;
        const original = global.document;
        global.document = window.document;
        expect(getLocation(e)).toEqual({ x: 0, y: 0 });
        global.document = original;
      });
      ele.dispatchEvent(evt);
    });

    it("handles null", () => {
      // @ts-ignore
      expect(getLocation(null)).toEqual({ x: null, y: null });
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
      const element = window.document.createElement("div");
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
      expect(getSelector("foo")).toBe("Unknown");
    });
  });

  describe("buildPath", () => {
    it("builds a path", () => {
      new JSDOM(``);
      let actualPath: string[] | undefined;
      const ele = window.document.createElement("div");
      const evt = new window.Event("CustomEvent", {
        bubbles: true,
        cancelable: true,
      });
      window.document.body.appendChild(ele);
      ele.addEventListener("CustomEvent", (e) => (actualPath = buildPath(e)));
      ele.dispatchEvent(evt);
      expect(actualPath).toEqual([
        "div",
        "body",
        "html",
        "#document",
        "Window",
      ]);
    });
  });

  test("buildAttrs", () => {
    let result: any;
    const ele = window.document.createElement("div");
    const evt = new window.Event("CustomEvent", {
      bubbles: true,
      cancelable: true,
    });
    ele.setAttribute("data-json", '{"key": "value"}');
    ele.setAttribute("data-string", "hello");
    ele.setAttribute("style", "color: red;");
    window.document.body.appendChild(ele);
    ele.addEventListener("CustomEvent", (e) => (result = buildAttrs(e)));
    ele.dispatchEvent(evt);
    expect(result).toEqual({
      "data-json": { key: "value" },
      "data-string": "hello",
    });
    expect(result).not.toHaveProperty("style");
  });

  test("buildCSS", () => {
    let result: any;
    const ele = window.document.createElement("div");
    const evt = new window.Event("CustomEvent", {
      bubbles: true,
      cancelable: true,
    });
    ele.style.color = "red";
    ele.style.marginTop = "10px";
    window.document.body.appendChild(ele);
    ele.addEventListener("CustomEvent", (e) => (result = buildCSS(e)));
    ele.dispatchEvent(evt);
    expect(result).toEqual({ color: "red", "margin-top": "10px" });
  });
});

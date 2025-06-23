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

describe("configure", () => {
  const config = Configuration.getInstance();
  // const initialWindow = global.window;

  beforeEach(() => {
    config.reset();
  });

  it("merges new configs into main config object", (done) => {
    const newConfig = { foo: "bar" };
    config.update(newConfig);
    expect(config).toMatchObject(newConfig);
    done();
  });

  it("Config autostart false makes autostart false", (done) => {
    const newConfig = { autostart: true };
    config.update(newConfig);
    expect(config).toMatchObject(newConfig);
    done();
  });

  it("neither autostart false makes autostart true", (done) => {
    const newConfig = { autostart: true };
    config.update(newConfig);
    expect(config).toMatchObject(newConfig);
    done();
  });

  it("includes a userid if present in the window.location", (done) => {
    const newConfig = { foo: "bar", userFromParams: "user" };
    Object.defineProperty(global.window, "location", {
      value: { href: "?user=test&" },
      writable: true,
    });
    config.update(newConfig);
    expect(config).toMatchObject({
      foo: "bar",
      userFromParams: "user",
      userId: "test",
    });
    done();
  });

  describe("getUserIdFromParams", () => {
    it("fetches userId from URL params", (done) => {
      Object.defineProperty(global.window, "location", {
        value: { href: "?user=foo&" },
        writable: true,
      });
      const userId = Configuration.getUserIdFromParams("user");
      expect(userId).toBe("foo");
      done();
    });

    it("returns null if no matching param", (done) => {
      Object.defineProperty(global.window, "location", {
        value: { href: "?user=test&" },
        writable: true,
      });
      const userId = Configuration.getUserIdFromParams("bar");
      expect(userId).toBeNull();
      done();
    });
  });
});

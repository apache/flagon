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
import fs from "fs";
import path from "path";
import { JSDOM, ResourceLoader } from "jsdom";

// Maps http://localhost/build/* → packages/core-sdk/build/*
// so JSDOM can load the IIFE bundle while still using an http origin
// (required for sessionStorage/localStorage to be available).
class LocalResourceLoader extends ResourceLoader {
  fetch(url: string, options: Parameters<ResourceLoader["fetch"]>[1]) {
    const buildPrefix = "http://localhost/build/";
    if (url.startsWith(buildPrefix)) {
      const filePath = path.join(
        __dirname,
        "../../build",
        url.slice(buildPrefix.length),
      );
      const buf = Buffer.from(fs.readFileSync(filePath));
      const p = Promise.resolve(buf) as ReturnType<ResourceLoader["fetch"]>;
      p!.abort = () => {};
      return p;
    }
    return super.fetch(url, options);
  }
}

export function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function createEnvFromFile(fileName: string, extraConfig = {}) {
  const dom = await JSDOM.fromFile(__dirname + "/" + fileName, {
    runScripts: "dangerously",
    resources: new LocalResourceLoader(),
    url: "http://localhost/",
    ...extraConfig,
  });
  await sleep(100); // wait for external scripts to load
  return dom;
}

export function mockWindowProperty(property: string, value: any) {
  Object.defineProperty(global.window, property, { value, writable: true });
}

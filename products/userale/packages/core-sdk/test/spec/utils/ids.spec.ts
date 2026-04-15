/*!
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

import { generateTraceId, generateSpanId } from "@/utils/ids";

describe("generateTraceId", () => {
  it("returns a 32-char lowercase hex string", () => {
    expect(generateTraceId()).toMatch(/^[0-9a-f]{32}$/);
  });

  it("returns unique values on each call", () => {
    expect(generateTraceId()).not.toBe(generateTraceId());
  });
});

describe("generateSpanId", () => {
  it("returns a 16-char lowercase hex string", () => {
    expect(generateSpanId()).toMatch(/^[0-9a-f]{16}$/);
  });

  it("returns unique values on each call", () => {
    expect(generateSpanId()).not.toBe(generateSpanId());
  });
});

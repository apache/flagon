/*!
 * Licensed to the Apache Software Foundation (ASF) under one or more
 * contributor license agreements.  See the NOTICE file distributed with
 * this work for additional information regarding copyright ownership.
 * The ASF licenses this file to You under the Apache License, Version 2.0
 * (the 'License'); you may not use this file except in compliance with
 * the License.  You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an 'AS IS' BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import type { Settings } from "@/types";
/**
 * Extracts the initial configuration settings from the
 * currently executing script tag.
 */
export declare function getInitialSettings(): Settings.Config;
/**
 * Retrieves a session ID from sessionStorage, creating and storing it if absent.
 * Preserves the session across page refreshes (e.g. after form submit).
 */
export declare function getOrCreateSessionId(key: string, defaultValue: string): string;
/**
 * Returns a function that normalises a browser event timestamp to Unix ms,
 * accounting for cross-browser quirks in how timeStamp is reported.
 */
export declare function timeStampScale(e: Event): Settings.TimeFunction;
//# sourceMappingURL=getInitialSettings.d.ts.map
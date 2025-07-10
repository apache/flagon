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
import type { Settings } from "./types";
/**
 * Extracts the initial configuration settings from the
 * currently executing script tag.
 * @return {Object} The extracted configuration object
 */
export declare function getInitialSettings(): Settings.Config;
/**
 * defines sessionId, stores it in sessionStorage, checks to see if there is a sessionId in
 * storage when script is started. This prevents events like 'submit', which refresh page data
 * from refreshing the current user session
 *
 */
export declare function getsessionId(sessionKey: string, value: any): any;
/**
 * Creates a function to normalize the timestamp of the provided event.
 * @param  {Event} e An event containing a timeStamp property.
 * @return {typeof timeStampScale~tsScaler}   The timestamp normalizing function.
 */
export declare function timeStampScale(e: Event): Settings.TimeFunction;
//# sourceMappingURL=getInitialSettings.d.ts.map
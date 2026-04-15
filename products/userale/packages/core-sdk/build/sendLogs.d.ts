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
import { Configuration } from "@/configure";
import { Logging } from "@/types";
export declare class Sender {
    private sendIntervalId;
    private activeTraceId;
    private activeSpanId;
    start(logs: Array<Logging.Log>, config: Configuration): void;
    stop(): void;
    onInterval(logs: Array<Logging.Log>, config: Configuration): ReturnType<typeof setInterval>;
    onClose(logs: Array<Logging.Log>, config: Configuration): void;
    flush(logs: Array<Logging.Log>, config: Configuration): Promise<void>;
}
//# sourceMappingURL=sendLogs.d.ts.map
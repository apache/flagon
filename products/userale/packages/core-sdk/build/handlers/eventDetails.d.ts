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
import { Events, Logging, Settings } from "@/types";
/**
 * Maps a MouseEvent to an object containing useful information.
 */
export declare function extractMouseDetails(e: MouseEvent): {
    clicks: number;
    ctrl: boolean;
    alt: boolean;
    shift: boolean;
    meta: boolean;
};
/**
 * Maps a KeyboardEvent to an object containing useful information.
 */
export declare function extractKeyboardDetails(e: KeyboardEvent): {
    key: string;
    code: string;
    ctrl: boolean;
    alt: boolean;
    shift: boolean;
    meta: boolean;
};
/**
 * Maps an InputEvent to an object containing useful information.
 */
export declare function extractInputDetails(e: InputEvent): {
    value: string;
};
/**
 * Maps a ChangeEvent to an object containing useful information.
 */
export declare function extractChangeDetails(e: Events.ChangeEvent): {
    value: any;
};
/**
 * Maps a WheelEvent to an object containing useful information.
 */
export declare function extractWheelDetails(e: WheelEvent): {
    x: number;
    y: number;
    z: number;
};
/**
 * Maps a ScrollEvent to an object containing useful information.
 */
export declare function extractScrollDetails(): {
    x: number;
    y: number;
};
/**
 * Maps a ResizeEvent to an object containing useful information.
 */
export declare function extractResizeDetails(): {
    width: number;
    height: number;
};
/**
 * Defines the event detail extractors and the events to listen for.
 */
export declare function defineDetails(config: Settings.DefaultConfig): Events.EventDetailsMap<Events.AllowedEvents>;
/**
 * Returns the detail extractor for a given event type, respecting the config.
 */
export declare function defineCustomDetails(options: Settings.DefaultConfig, type: Events.AllowedEvents): Logging.DynamicDetailFunction | null | undefined;
//# sourceMappingURL=eventDetails.d.ts.map
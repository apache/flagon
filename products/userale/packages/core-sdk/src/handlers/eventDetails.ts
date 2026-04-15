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
export function extractMouseDetails(e: MouseEvent) {
  return {
    clicks: e.detail,
    ctrl: e.ctrlKey,
    alt: e.altKey,
    shift: e.shiftKey,
    meta: e.metaKey,
  };
}

/**
 * Maps a KeyboardEvent to an object containing useful information.
 */
export function extractKeyboardDetails(e: KeyboardEvent) {
  return {
    key: e.key,
    code: e.code,
    ctrl: e.ctrlKey,
    alt: e.altKey,
    shift: e.shiftKey,
    meta: e.metaKey,
  };
}

/**
 * Maps an InputEvent to an object containing useful information.
 */
export function extractInputDetails(e: InputEvent) {
  return {
    value: (e.target as HTMLInputElement).value,
  };
}

/**
 * Maps a ChangeEvent to an object containing useful information.
 */
export function extractChangeDetails(e: Events.ChangeEvent) {
  return {
    value: e.target.value,
  };
}

/**
 * Maps a WheelEvent to an object containing useful information.
 */
export function extractWheelDetails(e: WheelEvent) {
  return {
    x: e.deltaX,
    y: e.deltaY,
    z: e.deltaZ,
  };
}

/**
 * Maps a ScrollEvent to an object containing useful information.
 */
export function extractScrollDetails() {
  return {
    x: window.scrollX,
    y: window.scrollY,
  };
}

/**
 * Maps a ResizeEvent to an object containing useful information.
 */
export function extractResizeDetails() {
  return {
    width: window.outerWidth,
    height: window.outerHeight,
  };
}

/**
 * Defines the event detail extractors and the events to listen for.
 */
export function defineDetails(
  config: Settings.DefaultConfig,
): Events.EventDetailsMap<Events.AllowedEvents> {
  return {
    click: extractMouseDetails,
    dblclick: extractMouseDetails,
    mousedown: extractMouseDetails,
    mouseup: extractMouseDetails,
    focus: null,
    blur: null,
    input: config.logDetails ? extractKeyboardDetails : null,
    change: config.logDetails ? extractChangeDetails : null,
    dragstart: null,
    dragend: null,
    drag: null,
    drop: null,
    keydown: config.logDetails ? extractKeyboardDetails : null,
    mouseover: null,
  };
}

/**
 * Returns the detail extractor for a given event type, respecting the config.
 */
export function defineCustomDetails(
  options: Settings.DefaultConfig,
  type: Events.AllowedEvents,
): Logging.DynamicDetailFunction | null | undefined {
  const eventType: Events.EventDetailsMap<Events.AllowedEvents> = {
    click: extractMouseDetails,
    dblclick: extractMouseDetails,
    mousedown: extractMouseDetails,
    mouseup: extractMouseDetails,
    focus: null,
    blur: null,
    load: null,
    input: options.logDetails ? extractKeyboardDetails : null,
    change: options.logDetails ? extractChangeDetails : null,
    dragstart: null,
    dragend: null,
    drag: null,
    drop: null,
    keydown: options.logDetails ? extractKeyboardDetails : null,
    mouseover: null,
    wheel: extractWheelDetails,
    scroll: extractScrollDetails,
    resize: extractResizeDetails,
    submit: null,
  };
  return eventType[type];
}

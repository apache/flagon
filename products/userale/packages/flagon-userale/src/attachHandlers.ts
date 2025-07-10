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

import { packageLog, packageIntervalLog } from "@/packageLogs";
import { Events, Logging, Settings } from "@/types";
import { Configuration } from "@/configure";

//@todo: Investigate drag events and their behavior
let events: Events.EventDetailsMap<Events.AllowedEvents>;
let bufferBools: Events.EventBoolMap<Events.BufferedEvents>;
let bufferedEvents: Events.EventDetailsMap<Events.BufferedEvents>;
let refreshEvents: Events.EventDetailsMap<Events.RefreshEvents>;
const intervalEvents: Array<Events.IntervalEvents> = [
  "click",
  "focus",
  "blur",
  "input",
  "change",
  "mouseover",
  "submit",
];
const windowEvents: Array<Events.WindowEvents> = ["load", "blur", "focus"];

/**
 * Maps a MouseEvent to an object containing useful information.
 * @param  {MouseEvent} e Event to extract data from
 */
export function extractMouseDetails(e: MouseEvent) {
  return {
    clicks: e.detail,
    ctrl: e.ctrlKey,
    alt: e.altKey,
    shift: e.shiftKey,
    meta: e.metaKey,
    //    'text' : e.target.innerHTML
  };
}

/** Maps a KeyboardEvent to an object containing useful infromation
 * @param {KeyboardEvent} e Event to extract data from
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
 * @param  {InputEvent} e Event to extract data from
 */
export function extractInputDetails(e: InputEvent) {
  return {
    value: (e.target as HTMLInputElement).value,
  };
}

/**
 * Maps a ChangeEvent to an object containing useful information.
 * @param  {Events.ChangeEvent} e Event to extract data from
 */
export function extractChangeDetails(e: Events.ChangeEvent) {
  return {
    value: e.target.value,
  };
}

/**
 * Maps a WheelEvent to an object containing useful information.
 * @param  {WheelEvent} e Event to extract data from
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
 * Defines the way information is extracted from various events.
 * Also defines which events we will listen to.
 * @param  {Settings.Config} config Configuration object to read from.
 */
export function defineDetails(config: Settings.DefaultConfig): void {
  // Events list
  // Keys are event types
  // Values are functions that return details object if applicable
  events = {
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

  bufferBools = {};
  bufferedEvents = {
    wheel: extractWheelDetails,
    scroll: extractScrollDetails,
    resize: extractResizeDetails,
  };

  refreshEvents = {
    submit: null,
  };
}

/**
 * Defines the way information is extracted from various events.
 * Also defines which events we will listen to.
 * @param  {Settings.Config} options UserALE Configuration object to read from.
 * @param   {Events.AllowedEvents}    type of html event (e.g., 'click', 'mouseover', etc.), such as passed to addEventListener methods.
 */
export function defineCustomDetails(
  options: Settings.DefaultConfig,
  type: Events.AllowedEvents,
): Logging.DynamicDetailFunction | null | undefined {
  // Events list
  // Keys are event types
  // Values are functions that return details object if applicable
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

/**
 * Hooks the event handlers for each event type of interest.
 * @param  {Configuration} config Configuration singleton to use.
 * @return {boolean}        Whether the operation succeeded
 */
export function attachHandlers(config: Configuration): boolean {
  try {
    defineDetails(config);

    (Object.keys(events) as Events.AllowedEvents[]).forEach(function (ev) {
      document.addEventListener(
        ev,
        function (e) {
          packageLog(e, events[ev]);
        },
        true,
      );
    });

    intervalEvents.forEach(function (ev) {
      document.addEventListener(
        ev,
        function (e) {
          packageIntervalLog(e);
        },
        true,
      );
    });

    (Object.keys(bufferedEvents) as Events.BufferedEvents[]).forEach(
      function (ev) {
        bufferBools[ev] = true;

        self.addEventListener(
          ev,
          function (e) {
            if (bufferBools[ev]) {
              bufferBools[ev] = false;
              packageLog(e, bufferedEvents[ev]);
              setTimeout(function () {
                bufferBools[ev] = true;
              }, config.resolution);
            }
          },
          true,
        );
      },
    );

    (Object.keys(refreshEvents) as Events.RefreshEvents[]).forEach(
      function (ev) {
        document.addEventListener(
          ev,
          function (e) {
            packageLog(e, events[ev]);
          },
          true,
        );
      },
    );

    windowEvents.forEach(function (ev) {
      self.addEventListener(
        ev,
        function (e) {
          packageLog(e, function () {
            return { window: true };
          });
        },
        true,
      );
    });

    return true;
  } catch {
    return false;
  }
}

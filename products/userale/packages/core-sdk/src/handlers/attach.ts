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

import { Packager } from "@/Packager";
import { Events } from "@/types";
import { Configuration } from "@/Configuration";
import {
  defineDetails,
  extractWheelDetails,
  extractScrollDetails,
  extractResizeDetails,
} from "@/handlers/eventDetails";

//@todo: Investigate drag events and their behavior
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

const bufferedEvents: Events.EventDetailsMap<Events.BufferedEvents> = {
  wheel: extractWheelDetails,
  scroll: extractScrollDetails,
  resize: extractResizeDetails,
};

const refreshEvents: Events.EventDetailsMap<Events.RefreshEvents> = {
  submit: null,
};

/**
 * Hooks the event handlers for each event type of interest.
 * @param  {Configuration} config Configuration singleton to use.
 * @param  {Packager} packager Packager instance to route events through.
 * @return {boolean} Whether the operation succeeded.
 */
export function attachHandlers(
  config: Configuration,
  packager: Packager,
): boolean {
  try {
    const events = defineDetails(config);

    const bufferBools: Events.EventBoolMap<Events.BufferedEvents> =
      {} as Events.EventBoolMap<Events.BufferedEvents>;

    (Object.keys(events) as Events.AllowedEvents[]).forEach(function (ev) {
      document.addEventListener(
        ev,
        function (e) {
          packager.packageLog(e, events[ev]);
        },
        true,
      );
    });

    intervalEvents.forEach(function (ev) {
      document.addEventListener(
        ev,
        function (e) {
          packager.packageIntervalLog(e);
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
              packager.packageLog(e, bufferedEvents[ev]);
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
            packager.packageLog(e, events[ev]);
          },
          true,
        );
      },
    );

    windowEvents.forEach(function (ev) {
      self.addEventListener(
        ev,
        function (e) {
          packager.packageLog(e, function () {
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

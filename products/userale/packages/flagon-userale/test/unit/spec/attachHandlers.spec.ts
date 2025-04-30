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
import { jest } from "@jest/globals";

jest.unstable_mockModule("@/packageLogs", () => ({
  packageLog: jest.fn(),
}));

import { attachHandlers } from "@/attachHandlers";
import { Events } from "@/types";
import { Configuration } from "@/configure";
import { packageLog } from "@/packageLogs";

const config = Configuration.getInstance();

describe("attachHandlers", () => {
  beforeEach(() => config.reset());

  it("attaches all the event handlers without duplicates", (done) => {
    let duplicateEvents = 0;
    const missingDocumentEvents: Events.AllowedEvents[] = [
      "click",
      "dblclick",
      "mousedown",
      "mouseup",
      "focus",
      "blur",
      "input",
      "change",
      "dragstart",
      "dragend",
      "drag",
      "drop",
      "keydown",
      "mouseover",
      "submit",
    ];
    const missingWindowEvents: (Events.WindowEvents | Events.BufferedEvents)[] =
      ["wheel", "scroll", "resize", "load", "blur", "focus"];
    const missingIntervalEvents: Events.IntervalEvents[] = [
      "click",
      "focus",
      "blur",
      "input",
      "change",
      "mouseover",
      "submit",
    ];
    const missingDocumentAndIntervalEvents = missingDocumentEvents.concat(
      missingIntervalEvents,
    );

    // Acts as a kind of Proxy for addEventListener. Keeps track of added listeners.
    const listenerHook =
      (eventList: Events.AllowedEvents[]) => (ev: Events.AllowedEvents) => {
        const evIndex = eventList.indexOf(ev);
        if (evIndex !== -1) {
          eventList.splice(evIndex, 1);
        } else {
          duplicateEvents++;
        }
      };
    jest
      .spyOn(document, "addEventListener")
      .mockImplementation(
        listenerHook(missingDocumentAndIntervalEvents) as any,
      );
    jest
      .spyOn(window, "addEventListener")
      .mockImplementation(listenerHook(missingWindowEvents) as any);
    config.update({ logDetails: true });

    attachHandlers(config);

    expect(duplicateEvents).toBe(0);
    expect(missingDocumentAndIntervalEvents.length).toBe(0);
    expect(missingWindowEvents.length).toBe(0);

    done();
  });

  it("debounces bufferedEvents", (done) => {
    let testingEvent = false;
    const bufferedEvents: Events.BufferedEvents[] = [
      "wheel",
      "scroll",
      "resize",
    ];
    const rate = 500;
    jest
      .spyOn(global.document, "addEventListener")
      .mockImplementation(() => { });
    // Tries to call an event 3 times. Twice in quick succession, then once after the set delay.
    // Number of actual calls to packageLog are recorded in callCount. Should amount to exactly 2 calls.
    const listenerHook = (ev: string, fn: CallableFunction) => {
      if (
        !testingEvent &&
        bufferedEvents.indexOf(ev as Events.BufferedEvents) !== -1
      ) {
        testingEvent = true;
        fn();
        fn();
        setTimeout(() => {
          fn();
          expect(packageLog).toHaveBeenCalledTimes(2);
        }, rate + 1);
      }
    };
    jest
      .spyOn(global.window, "addEventListener")
      .mockImplementation(listenerHook as any);
    config.update({ resolution: rate });

    attachHandlers(config);

    done();
  });

  describe("defineDetails", () => {
    // TODO: clarify what constitutes "high detail events" and what is "correct"
    it.skip("configures high detail events correctly", () => { });
  });
});

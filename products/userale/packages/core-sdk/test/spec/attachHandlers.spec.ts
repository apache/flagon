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
import { attachHandlers } from "@/handlers/attach";
import { Events } from "@/types";
import { Configuration } from "@/Configuration";
import type { Packager } from "@/Packager";

const config = Configuration.getInstance();

function makeMockPackager(): Packager {
  return {
    packageLog: jest.fn(),
    packageIntervalLog: jest.fn(),
  } as unknown as Packager;
}

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

    attachHandlers(config, makeMockPackager());

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
    const mockPackager = makeMockPackager();

    jest
      .spyOn(global.document, "addEventListener")
      .mockImplementation(() => {});

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
          expect(mockPackager.packageLog).toHaveBeenCalledTimes(2);
        }, rate + 1);
      }
    };
    jest
      .spyOn(global.window, "addEventListener")
      .mockImplementation(listenerHook as any);
    config.update({ resolution: rate });

    attachHandlers(config, mockPackager);

    done();
  });

  describe("defineDetails", () => {
    it.skip("configures high detail events correctly", () => {});
  });
});

/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

import { Configuration, UserALE } from "flagon-userale"
import type { PlasmoCSConfig } from "plasmo"

import { getPort } from "@plasmohq/messaging/port"

export const config: PlasmoCSConfig = {
  matches: ["<all_urls>"],
  all_frames: true
}

const logPort = getPort("log")

chrome.runtime.sendMessage({ type: "content-script-ready" })

// Capture events only — the rerouteLog callback forwards every log to the
// background service worker via the port, returning false so nothing is
// queued locally. The sender is never started, so no fetch calls are made
// from the page context (which would be blocked by CORS on HTTPS sites).
const userale = new UserALE(Configuration.getInstance())
userale.addCallbacks({
  rerouteLog(log) {
    logPort.postMessage({ body: log })
    return false
  }
})
userale.capture()

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type == "tab-event") {
    const { type, tab, data } = message.payload
    userale.packageCustomLog({ type }, () => data, true)
    sendResponse({ status: "received" })
    return false
  }

  if (message.type === "issue-report") {
    userale.packageCustomLog(
      { type: message.type },
      () => message.payload,
      true
    )
    sendResponse({ status: "received" })
    return false
  }
})

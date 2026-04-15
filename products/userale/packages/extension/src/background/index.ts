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

import { getStoredOptions } from "~/utils/storage"
import { sendToContent } from "~utils/messaging"
import type { StoredOptions } from "~utils/storage"

export const userale = new UserALE(Configuration.getInstance())

let allowListRegExp: RegExp

export function setOptions(options: StoredOptions) {
  userale.options({ url: options.loggingUrl })
  userale.start()
  allowListRegExp = new RegExp(options.allowList)
}

export function getAllowListRegExp() {
  return allowListRegExp
}

// Top level await is not supported so immediately execute this async function to set options from storage
;(async () => {
  const options = await getStoredOptions()
  setOptions(options)
})()

// Tracks tabs where the content script has registered itself, mapped to their last known URL.
// Used to (a) filter tab events to only instrumented tabs and (b) emit onRemoved with the correct pageUrl.
const readyTabs = new Map<number, string>()

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "content-script-ready" && sender.tab?.id != null) {
    readyTabs.set(sender.tab.id, sender.tab.url ?? "")
    return false
  }

  if (message.type === "config_change") {
    setOptions(message.body)
    sendResponse({})
    return false
  }
})

// Tab event handlers
// https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/tabs

// Sends a tab event to the content script of the given tab.
// All tab events route through here so the readyTabs guard is applied in one place.
function sendTabEventFromTab(
  tab: chrome.tabs.Tab,
  data: Record<string, any>,
  type: string
) {
  if (tab.id == null || !readyTabs.has(tab.id)) return
  sendToContent(tab.id, {
    type: "tab-event",
    payload: { type, tab, data }
  }).catch((err) =>
    console.warn(`Failed to send ${type} to tab ${tab.id}:`, err.message)
  )
}

// Takes a tabId and event data, gets the full tab object, then delegates to sendTabEventFromTab.
function sendTabEvent(tabId: number, data: Record<string, any>, type: string) {
  chrome.tabs.get(tabId, (tab) => {
    if (!tab) return
    sendTabEventFromTab(tab, data, type)
  })
}

chrome.tabs.onActivated.addListener((activeInfo) =>
  sendTabEvent(activeInfo.tabId, activeInfo, "tabs.onActivated")
)

chrome.tabs.onAttached.addListener((tabId, attachInfo) =>
  sendTabEvent(tabId, attachInfo, "tabs.onAttached")
)

chrome.tabs.onCreated.addListener((tab) =>
  sendTabEventFromTab(tab, {}, "tabs.onCreated")
)

chrome.tabs.onDetached.addListener((tabId, detachInfo) =>
  sendTabEvent(tabId, detachInfo, "tabs.onDetached")
)

chrome.tabs.onMoved.addListener((tabId, moveInfo) =>
  sendTabEvent(tabId, moveInfo, "tabs.onMoved")
)

chrome.tabs.onRemoved.addListener((tabId) => {
  readyTabs.delete(tabId)
})

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (tab.url) readyTabs.set(tabId, tab.url)
  sendTabEventFromTab(tab, changeInfo, "tabs.onUpdated")
})

chrome.tabs.onZoomChange.addListener((zoomChangeInfo) =>
  sendTabEvent(zoomChangeInfo.tabId, zoomChangeInfo, "tabs.onZoomChange")
)

chrome.tabs.onHighlighted.addListener((highlightInfo) => {
  const data = { ...highlightInfo }
  for (const tabId of highlightInfo.tabIds) {
    sendTabEvent(tabId, data, "tabs.onHighlighted")
  }
})

chrome.tabs.onReplaced.addListener((addedTabId, removedTabId) => {
  // Transfer the URL from the removed tab to the added tab if it was instrumented
  const pageUrl = readyTabs.get(removedTabId)
  readyTabs.delete(removedTabId)
  if (pageUrl != null) readyTabs.set(addedTabId, pageUrl)
  sendTabEvent(addedTabId, { addedTabId, removedTabId }, "tabs.onReplaced")
})

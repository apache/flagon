import { getStoredOptions } from "~/utils/storage";
import { setOptions } from "./messages/config_change";
import { sendToContent } from "~utils/messaging";

// Top level await is not supported so immediately execute this async function to set options from storage
(async () => {
    const options = await getStoredOptions();
    setOptions(options);
})();

// Takes a tabId and event data, gets the tab, and sends it
function sendTabEvent(tabId: number, data: Record<string, any>, type: string) {
  chrome.tabs.get(tabId, (tab) => {
    if (!tab) return
    sendTabEventFromTab(tab, data, type)
  });
}

// Sends an event directly from a tab object
function sendTabEventFromTab(tab: chrome.tabs.Tab, data: Record<string, any>, type: string) {
  const payload = {
    type,
    tab,
    data
  };

  sendToContent(tab.id!, { type: "tab-event", payload }).catch((err) =>
    console.warn(`Failed to send ${type} to tab ${tab.id}:`, err.message)
  );
}

// Tab event handlers 
// https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/tabs

// TODO handle events that are sent when the tab isn't active.
// For example:
// onCreated events are sent before the content script listener is ready.
// onDeleted events are sent afeter the content script listener is shut down.

chrome.tabs.onActivated.addListener((activeInfo) =>
  sendTabEvent(activeInfo.tabId, activeInfo, "tabs.onActivated")
);

chrome.tabs.onAttached.addListener((tabId, attachInfo) =>
  sendTabEvent(tabId, attachInfo, "tabs.onAttached")
);

chrome.tabs.onCreated.addListener((tab) =>
  sendTabEventFromTab(tab, {}, "tabs.onCreated")
);

chrome.tabs.onDetached.addListener((tabId, detachInfo) =>
  sendTabEvent(tabId, detachInfo, "tabs.onDetached")
);

chrome.tabs.onMoved.addListener((tabId, moveInfo) =>
  sendTabEvent(tabId, moveInfo, "tabs.onMoved")
);

chrome.tabs.onRemoved.addListener((tabId, removeInfo) =>
  sendTabEvent(tabId, removeInfo, "tabs.onRemoved")
);

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) =>
  sendTabEventFromTab(tab, changeInfo, "tabs.onUpdated")
);

chrome.tabs.onZoomChange.addListener((zoomChangeInfo) =>
  sendTabEvent(zoomChangeInfo.tabId, zoomChangeInfo, "tabs.onZoomChange")
);

chrome.tabs.onHighlighted.addListener((highlightInfo) => {
    // Note: No tabId is available, so send with windowId and tabIds
    const data = { ...highlightInfo }
    // Loop over highlightInfo.tabIds and call sendTabEvent on each
    for (const tabId of highlightInfo.tabIds) {
        sendTabEvent(tabId, data, "tabs.onHighlighted")
    }
});

chrome.tabs.onReplaced.addListener((addedTabId, removedTabId) => {
    const data = { addedTabId, removedTabId }
    sendTabEvent(addedTabId, data, "tabs.onReplaced")
});
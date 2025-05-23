import type { PlasmoCSConfig } from "plasmo";
import { getPort } from "@plasmohq/messaging/port";
import * as userale from "flagon-userale";

export const config: PlasmoCSConfig = {
  matches: ["<all_urls>"],
  all_frames: true
};

const logPort = getPort("log");

userale.addCallbacks({
  rerouteLog(log) {
    console.log(log);
    logPort.postMessage({body: log});
    return false;
  }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if( message.type == "tab-event") {
    const { type, tab, data } = message.payload;
    userale.packageCustomLog(
      {type},
      () => { return data; },
      true,
    );
    sendResponse({ status: "received" });
  } else if (message.type === "issue-report") {
    userale.packageCustomLog(
      {type: message.type},
      () => { return message.payload; },
      true,
    );
    sendResponse({ status: "received" });
  }  

  return true 
})
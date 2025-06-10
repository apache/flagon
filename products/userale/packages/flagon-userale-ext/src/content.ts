import * as userale from "flagon-userale"
import type { PlasmoCSConfig } from "plasmo"

import { getPort } from "@plasmohq/messaging/port"

export const config: PlasmoCSConfig = {
  matches: ["<all_urls>"],
  all_frames: true
}

const logPort = getPort("log")

userale.addCallbacks({
  rerouteLog(log) {
    console.log(log)
    logPort.postMessage(log)
    return false
  }
})

userale.start()

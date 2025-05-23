import type { PlasmoMessaging } from "@plasmohq/messaging";
import * as userale from "flagon-userale";
import { getAllowListRegExp } from "~/background/messages/config_change";

const handler: PlasmoMessaging.PortHandler = async (req, res) => {
  let log = req.body
  log.browserSessionId = browserSessionId;
  let allowListRegExp = getAllowListRegExp();
  console.log(allowListRegExp);
  if (allowListRegExp.test(log.pageUrl)) {
    userale.log(log);
  }
}

let browserSessionId = generateSessionId();

// TODO move this to a shared utils workspace (this is from packages/flagon-userale/src/, but shouldn't be publicly exported)
function generateSessionId(): string {
    // 32 digit hex -> 128 bits of info -> 2^64 ~= 10^19 sessions needed for 50% chance of collison
    const len = 32;
    const arr = new Uint8Array(len / 2);
    self.crypto.getRandomValues(arr);
    return Array.from(arr, (dec) => {
      return dec.toString(16).padStart(2, "0");
    }).join("");
}
 
export default handler;
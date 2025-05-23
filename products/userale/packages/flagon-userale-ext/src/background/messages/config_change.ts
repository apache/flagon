import type { PlasmoMessaging } from "@plasmohq/messaging";
import * as userale from "flagon-userale";
import type { StoredOptions } from "~utils/storage";
 
let allowListRegExp: RegExp;

const handler: PlasmoMessaging.MessageHandler = async (req, res) => {
  setOptions(req.body);
}

export function setOptions(options: StoredOptions) {
  userale.options({url: options.loggingUrl});
  allowListRegExp = new RegExp(options.allowList);
}

export function getAllowListRegExp() {
  return allowListRegExp;
}

export default handler
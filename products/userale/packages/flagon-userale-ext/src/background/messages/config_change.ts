import * as userale from "flagon-userale"

import type { PlasmoMessaging } from "@plasmohq/messaging"

//import { getStoredOptions } from "~/utils/storage";

const handler: PlasmoMessaging.MessageHandler = async (req, _res) => {
  // call
  userale.options(req)
}

export default handler

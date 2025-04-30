import type { PlasmoMessaging } from "@plasmohq/messaging";
import * as userale from "flagon-userale";
 
const handler: PlasmoMessaging.PortHandler = async (req, res) => {
  console.log(req);
  // todo apply browser session id to logs
  // // log.browserSessionId = browserSessionId;
  // todo filter logs based off filter url in getstorageoptions
  // // req = filterUrl(req);
  if (req) {
    console.log(req);
    userale.log(req);
  }
  
}
 
export default handler;
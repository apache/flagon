import * as userale from "flagon-userale";
//import { getStoredOptions,} from "~/utils/storage";

console.log("Service worker loaded!");

//TODO apply logging url from getstoredoptions to userale.setup

userale.setup();

//TODO Create browser session id similar to how http session id is created and export it be used in background/ports/log.ts

//TODO attach tab event listeners and add log them to userale. This can mostly be copied from the old code, but use .log() instead of .packagecustomlog()
import type { Settings } from "./types";
/**
 * Extracts the initial configuration settings from the
 * currently executing script tag.
 * @return {Object} The extracted configuration object
 */
export declare function getInitialSettings(): Settings.Config;
/**
 * defines sessionId, stores it in sessionStorage, checks to see if there is a sessionId in
 * storage when script is started. This prevents events like 'submit', which refresh page data
 * from refreshing the current user session
 *
 */
export declare function getsessionId(sessionKey: string, value: any): any;
/**
 * Creates a function to normalize the timestamp of the provided event.
 * @param  {Event} e An event containing a timeStamp property.
 * @return {typeof timeStampScale~tsScaler}   The timestamp normalizing function.
 */
export declare function timeStampScale(e: Event): Settings.TimeFunction;
//# sourceMappingURL=getInitialSettings.d.ts.map
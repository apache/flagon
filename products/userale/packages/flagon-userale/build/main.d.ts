import type { Settings, Logging } from "@/types";
export declare let started: boolean;
export { defineCustomDetails as details } from "@/attachHandlers";
export { registerAuthCallback as registerAuthCallback } from "@/utils";
export { addCallbacks as addCallbacks, removeCallbacks as removeCallbacks, packageLog as packageLog, packageCustomLog as packageCustomLog, getSelector as getSelector, buildPath as buildPath, } from "@/packageLogs";
export type { Logging } from "@/types";
export declare const version: string;
/**
 * Used to start the logging process if the
 * autostart configuration option is set to false.
 */
export declare function start(): void;
/**
 * Halts the logging process. Logs will no longer be sent.
 */
export declare function stop(): void;
/**
 * Updates the current configuration
 * object with the provided values.
 * @param  {Partial<Settings.Config>} newConfig The configuration options to use.
 * @return {Settings.Config}           Returns the updated configuration.
 */
export declare function options(newConfig: Partial<Settings.Config> | undefined): Settings.Config;
/**
 * Appends a log to the log queue.
 * @param  {Logging.CustomLog} customLog The log to append.
 * @return {boolean}          Whether the operation succeeded.
 */
export declare function log(customLog: Logging.CustomLog | undefined): boolean;
//# sourceMappingURL=main.d.ts.map
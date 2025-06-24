import { Configuration } from "@/configure";
import { Logging } from "@/types";
/**
 * Initializes the log queue processors.
 * @param  {Array<Logging.Log>} logs   Array of logs to append to.
 * @param  {Configuration} config Configuration object to use when logging.
 */
export declare function initSender(logs: Array<Logging.Log>, config: Configuration): void;
/**
 * Checks the provided log array on an interval, flushing the logs
 * if the queue has reached the threshold specified by the provided config.
 * @param  {Array<Logging.Log>} logs   Array of logs to read from.
 * @param  {Configuration} config Configuration singleton to be read from.
 * @return {Number}        The newly created interval id.
 */
export declare function sendOnInterval(logs: Array<Logging.Log>, config: Configuration): NodeJS.Timeout;
export declare function sendOnClose(logs: Array<Logging.Log>, config: Configuration): void;
/**
 * Sends the provided array of logs to the specified url,
 * retrying the request up to the specified number of retries.
 * @param  {Array<Logging.Log>} logs    Array of logs to send.
 * @param  {Configuration} config     configuration singleton.
 * @param  {Number} retries Maximum number of attempts to send the logs.
 */
export declare function sendLogs(logs: Array<Logging.Log>, config: Configuration, retries: number): Promise<void>;
//# sourceMappingURL=sendLogs.d.ts.map
import { Configuration } from "@/configure";
import { Callbacks } from "@/types";
export declare let headersCallback: Callbacks.HeadersCallback | null;
/**
 * Fetches the most up-to-date custom headers object from the headers callback
 * and updates the config object with the new value.
 * @param {Configuration} config Configuration object to be updated.
 * @param {Callbacks.HeadersCallback} headersCallback Callback used to fetch the newest headers.
 * @returns {void}
 */
export declare function updateCustomHeaders(config: Configuration): void;
/**
 * Registers the provided callback to be used when updating the auth header.
 * @param {Callbacks.HeadersCallback} callback Callback used to fetch the newest headers. Should return an object.
 * @returns {boolean} Whether the operation succeeded.
 */
export declare function registerHeadersCallback(callback: Callbacks.HeadersCallback): boolean;
/**
 * Verify that the provided callback is a function which returns a string
 * @param {Callbacks.HeadersCallback} callback Callback used to fetch the newest header. Should return an object.
 * @throws {Error} If the callback is not a function or does not return a string.
 * @returns {void}
 */
export declare function verifyCallback(callback: Callbacks.HeadersCallback): void;
/**
 * Resets the authCallback to null. Used for primarily for testing, but could be used
 * to remove the callback in production.
 * @returns {void}
 */
export declare function resetHeadersCallback(): void;
//# sourceMappingURL=index.d.ts.map
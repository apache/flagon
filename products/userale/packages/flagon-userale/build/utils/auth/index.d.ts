import { Configuration } from "@/configure";
import { Callbacks } from "@/types";
export declare let authCallback: Callbacks.AuthCallback | null;
/**
 * Fetches the most up-to-date auth header string from the auth callback
 * and updates the config object with the new value.
 * @param {Configuration} config Configuration object to be updated.
 * @param {Function} authCallback Callback used to fetch the newest header.
 * @returns {void}
 */
export declare function updateAuthHeader(config: Configuration): void;
/**
 * Registers the provided callback to be used when updating the auth header.
 * @param {Callbacks.AuthCallback} callback Callback used to fetch the newest header. Should return a string.
 * @returns {boolean} Whether the operation succeeded.
 */
export declare function registerAuthCallback(callback: Callbacks.AuthCallback): boolean;
/**
 * Verify that the provided callback is a function which returns a string
 * @param {Function} callback Callback used to fetch the newest header. Should return a string.
 * @throws {Error} If the callback is not a function or does not return a string.
 * @returns {void}
 */
export declare function verifyCallback(callback: Callbacks.AuthCallback): void;
/**
 * Resets the authCallback to null. Used for primarily for testing, but could be used
 * to remove the callback in production.
 * @returns {void}
 */
export declare function resetAuthCallback(): void;
//# sourceMappingURL=index.d.ts.map
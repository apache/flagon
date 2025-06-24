import { Events, Logging, Settings } from "@/types";
import { Configuration } from "@/configure";
/**
 * Maps a MouseEvent to an object containing useful information.
 * @param  {MouseEvent} e Event to extract data from
 */
export declare function extractMouseDetails(e: MouseEvent): {
    clicks: number;
    ctrl: boolean;
    alt: boolean;
    shift: boolean;
    meta: boolean;
};
/** Maps a KeyboardEvent to an object containing useful infromation
 * @param {KeyboardEvent} e Event to extract data from
 */
export declare function extractKeyboardDetails(e: KeyboardEvent): {
    key: string;
    code: string;
    ctrl: boolean;
    alt: boolean;
    shift: boolean;
    meta: boolean;
};
/**
 * Maps an InputEvent to an object containing useful information.
 * @param  {InputEvent} e Event to extract data from
 */
export declare function extractInputDetails(e: InputEvent): {
    value: string;
};
/**
 * Maps a ChangeEvent to an object containing useful information.
 * @param  {Events.ChangeEvent} e Event to extract data from
 */
export declare function extractChangeDetails(e: Events.ChangeEvent): {
    value: any;
};
/**
 * Maps a WheelEvent to an object containing useful information.
 * @param  {WheelEvent} e Event to extract data from
 */
export declare function extractWheelDetails(e: WheelEvent): {
    x: number;
    y: number;
    z: number;
};
/**
 * Maps a ScrollEvent to an object containing useful information.
 */
export declare function extractScrollDetails(): {
    x: number;
    y: number;
};
/**
 * Maps a ResizeEvent to an object containing useful information.
 */
export declare function extractResizeDetails(): {
    width: number;
    height: number;
};
/**
 * Defines the way information is extracted from various events.
 * Also defines which events we will listen to.
 * @param  {Settings.Config} config Configuration object to read from.
 */
export declare function defineDetails(config: Settings.DefaultConfig): void;
/**
 * Defines the way information is extracted from various events.
 * Also defines which events we will listen to.
 * @param  {Settings.Config} options UserALE Configuration object to read from.
 * @param   {Events.AllowedEvents}    type of html event (e.g., 'click', 'mouseover', etc.), such as passed to addEventListener methods.
 */
export declare function defineCustomDetails(options: Settings.DefaultConfig, type: Events.AllowedEvents): Logging.DynamicDetailFunction | null | undefined;
/**
 * Hooks the event handlers for each event type of interest.
 * @param  {Configuration} config Configuration singleton to use.
 * @return {boolean}        Whether the operation succeeded
 */
export declare function attachHandlers(config: Configuration): boolean;
//# sourceMappingURL=attachHandlers.d.ts.map
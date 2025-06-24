import type { Settings } from "@/types";
export declare class Configuration {
    [key: string]: Settings.ConfigValueTypes;
    private static instance;
    autostart: boolean;
    authHeader: Settings.AuthHeader;
    browserSessionId: Settings.SessionId;
    custIndex: Settings.CustomIndex;
    headers: Settings.Headers;
    httpSessionId: Settings.SessionId;
    logCountThreshold: number;
    logDetails: boolean;
    on: boolean;
    resolution: number;
    sessionId: Settings.SessionId;
    time: Settings.TimeFunction;
    toolName: Settings.ToolName;
    toolVersion: Settings.Version;
    transmitInterval: number;
    url: string;
    userFromParams: Settings.UserFromParams;
    useraleVersion: Settings.Version;
    userId: Settings.UserId;
    version: Settings.Version;
    websocketsEnabled: boolean;
    private constructor();
    static getInstance(): Configuration;
    private initialize;
    /**
     * Resets the configuration to its initial state.
     */
    reset(): void;
    /**
     * Shallow merges a newConfig with the configuration class, updating it.
     * Retrieves/updates the userid if userFromParams is provided.
     * @param  {Partial<Settings.Config>} newConfig Configuration object to merge into the current config.
     */
    update(newConfig: Partial<Settings.Config>): void;
    /**
     * Attempts to extract the userid from the query parameters of the URL.
     * @param  {string} param The name of the query parameter containing the userid.
     * @return {string | null}       The extracted/decoded userid, or null if none is found.
     */
    static getUserIdFromParams(param: string): string | null;
}
//# sourceMappingURL=configure.d.ts.map
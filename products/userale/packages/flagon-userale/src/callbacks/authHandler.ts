import { CallbackHandler } from "@/callbacks/callbackHandler";
import { Configuration } from "@/configure";

export const authHandler = new CallbackHandler<string>({
  getValue: () => "",
  validate: (value) => {
    if (typeof value !== "string") {
      throw new Error("Auth callback must return a string");
    }
  },
  setValue: (config: Configuration, value: string) => {
    config.authHeader = value;
  },
  description: "auth",
});

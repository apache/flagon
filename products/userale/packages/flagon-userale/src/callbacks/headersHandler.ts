import { CallbackHandler } from "@/callbacks/callbackHandler";
import { Config } from "@/config";

export const headersHandler = new CallbackHandler<Record<string, string>>({
  getValue: () => ({}),
  validate: (value) => {
    if (typeof value !== "object" || value === null) {
      throw new Error("Headers callback must return an object");
    }
    for (const [k, v] of Object.entries(value)) {
      if (typeof k !== "string" || typeof v !== "string") {
        throw new Error("Headers must have string keys and values");
      }
    }
  },
  setValue: (config: Config, value: Record<string, string>) => {
    config.headers = value;
  },
  description: "headers",
});

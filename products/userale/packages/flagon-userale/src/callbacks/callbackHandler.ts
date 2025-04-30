import type { CallbackHandlerOptions } from "@/types"

export class CallbackHandler<T> {
  private callback: (() => T) | null = null;
  private readonly options: CallbackHandlerOptions<T>;

  constructor(options: CallbackHandlerOptions<T>) {
    this.options = options;
  }

  update(config: any): void {
    if (this.callback) {
      try {
        const value = this.callback();
        this.options.validate(value);
        this.options.setValue(config, value);
      } catch (e) {
        console.error(`Error in ${this.options.description} callback: ${e}`);
      }
    }
  }

  register(callback: () => T): boolean {
    try {
      if (typeof callback !== "function") {
        throw new Error(`${this.options.description} must be a function`);
      }
      const result = callback();
      this.options.validate(result);
      this.callback = callback;
      return true;
    } catch {
      return false;
    }
  }

  reset(): void {
    this.callback = null;
  }
}

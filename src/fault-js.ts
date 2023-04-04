export type FaultDefinition = Record<string, string>;

// export interface Error

// export type ExtractFault =

export function defineFault<F extends FaultDefinition, C extends keyof F>(name: string, definition: F) {
  return class Fault extends Error {
    readonly name = name;
    readonly code: C;

    constructor(code: C, message?: string) {
      super(definition[code]);
      this.code = code;
      if (message) this.message = message;

      // @ref https://stackoverflow.com/a/32749533
      if (typeof Error.captureStackTrace === 'function') {
        Error.captureStackTrace(this, this.constructor);
      } else {
        this.stack = new Error(message).stack;
      }
    }

    because(cause: Error) {
      this.cause = cause;
      return this;
    }
  };
}

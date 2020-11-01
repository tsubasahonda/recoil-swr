type LoadableState<T> =
  | {
      type: "loading";
      promise: Promise<T>;
    }
  | {
      type: "hasValue";
      result: T;
    }
  | {
      type: "hasError";
      error: unknown;
    };

export class Loadable<T> {
  #state: LoadableState<T>;

  constructor(promise: Promise<T>) {
    const p = promise.then(
      (result) => {
        this.#state = {
          type: "hasValue",
          result,
        };
        return result;
      },
      (error) => {
        this.#state = {
          type: "hasError",
          error,
        };
        throw error;
      }
    );
    this.#state = {
      type: "loading",
      promise: p,
    };
  }

  get(): T {
    switch (this.#state.type) {
      case "loading": {
        throw this.#state.promise;
      }
      case "hasValue": {
        return this.#state.result;
      }
      case "hasError": {
        throw this.#state.error;
      }
    }
  }

  getLoadable(): LoadableState<T> {
    return this.#state;
  }
}

export type MountainType = {
  title: string;
  description: string;
  height: string;
  countries: string[];
  continent: string;
  image: string;
  slug: string;
  updatedAt: string;
};

export type LoadableState<T> =
  | {
      type: "hasError";
      error: Error;
    }
  | {
      type: "loading";
    }
  | {
      type: "hasValue";
      data: T;
    };

import React, { ReactNode, Suspense, useEffect } from "react";
import {
  RecoilRoot,
  atom,
  useRecoilValue,
  useSetRecoilState,
  useRecoilValueLoadable,
} from "recoil";
import Link from "next/link";
import { fetcher } from "../libs/fetch";

import useSWR, { mutate } from "swr";

import { Loadable } from "../libs/loadable";
import { selector } from "recoil";

const isServer = typeof window === "undefined";

type MountainType = {
  title: string;
  description: string;
  height: string;
  countries: string[];
  continent: string;
  image: string;
  slug: string;
  updatedAt: string;
};

const dataAtom = atom<MountainType[] | undefined>({
  key: "DataAtom",
  default: undefined,
});
const titleAtom = atom<string>({
  key: "Title",
  default: "Popular Repos",
});
const errorAtom = atom<{ error: boolean; message: string }>({
  key: "ErrorAtom",
  default: {
    error: false,
    message: "",
  },
});

const loadableDataSelector = selector<MountainType[]>({
  key: "LoadableDataSelector",
  get: async ({ get }) => {
    const res = get(dataAtom);
    const error = get(errorAtom);
    return new Promise<MountainType[]>((resolve, reject) => {
      try {
        if (error.error) {
          reject(new Error(error.message));
        }
        if (res != undefined) {
          resolve(res);
        }
      } catch (e) {
        reject(e);
      }
    });
  },
  set: (_, newValue) => {},
});

const useRequest = () => {
  const setData = useSetRecoilState(dataAtom);
  const { data, error } = useSWR<MountainType[]>("/mountains", fetcher);

  const setErrorState = useSetRecoilState(errorAtom);

  useEffect(() => {
    if (error) {
      setErrorState({
        error: true,
        message: "エラーが検知されました",
      });
    }
  }, [error]);

  useEffect(() => {
    setData(data);
  }, [data]);
};

const useData = () => {
  const data = useRecoilValue(loadableDataSelector);
  return data;
};

const useLoadableData = () => {
  const data = useRecoilValueLoadable(loadableDataSelector);

  return data;
};

function LoadableReposComponent() {
  const data = useLoadableData();
  const title = "Measure";
  if (data?.state === "loading") {
    return <h2>ローディング</h2>;
  }
  if (data?.state === "hasError") {
    return <h2>This is Error</h2>;
  }
  return (
    <>
      <h1>{title}</h1>
      <p>
        <button
          onClick={() => {
            mutate(
              "/mountains",
              data.state === "hasValue" && [...data.contents, "hoge"]
            );
          }}
        >
          Load Users
        </button>
      </p>
      {data.contents.map((mountain) => (
        <p key={mountain.slug}>
          <Link href="/mountains" as={`/${mountain.slug}`}>
            <a>{mountain.title}</a>
          </Link>
        </p>
      ))}
    </>
  );
}

function ReposComponent() {
  const data = useData();
  const title = "Measure";

  return (
    <>
      <h1>{title}</h1>
      <p>
        <button
          onClick={() => {
            mutate("/mountains", data && [...data, "hoge"]);
          }}
        >
          Load Users
        </button>
      </p>
      {data.map((mountain) => (
        <p key={mountain.slug}>
          <Link href="/mountains" as={`/${mountain.slug}`}>
            <a>{mountain.title}</a>
          </Link>
        </p>
      ))}
    </>
  );
}

class ErrorBoundary extends React.Component<
  { fallback: ReactNode },
  { hasError: boolean; error: Error | null }
> {
  state = { hasError: false, error: null };
  static getDerivedStateFromError(error: unknown) {
    return {
      hasError: true,
      error,
    };
  }
  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

function HomePage() {
  useRequest();
  // const errorState = useRecoilValue(errorAtom);

  // if (errorState.error) {
  //   return <h2 style={{ textAlign: "center" }}>{errorState.message}</h2>;
  // }
  return (
    <div style={{ textAlign: "center" }}>
      <h1>Trending Projects</h1>

      {!isServer ? (
        <ErrorBoundary fallback={<h2>Could not fetch posts.</h2>}>
          <Suspense fallback={<div>loading...</div>}>
            <LoadableReposComponent />
          </Suspense>
        </ErrorBoundary>
      ) : null}
    </div>
  );
}

const App = () => {
  return (
    <RecoilRoot>
      <HomePage />
    </RecoilRoot>
  );
};

export default App;

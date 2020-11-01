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

const dataLoadableAtom = atom<Loadable<string[]> | undefined>({
  key: "DataLoadableAtom",
  default: undefined,
});
const dataAtom = atom<string[] | undefined>({
  key: "DataAtom",
  default: undefined,
});
const titleAtom = atom<string>({
  key: "Title",
  default: "Popular Repos",
});

const loadableDataSelector = selector<string[]>({
  key: "LoadableDataSelector",
  get: async ({ get }) => {
    const res = get(dataAtom);
    return new Promise<string[]>((resolve, reject) => {
      try {
        if (res != null) {
          resolve(res);
        }
      } catch (e) {
        reject(e);
      }
    });
  },
});

const useData = () => {
  const data = useRecoilValue(loadableDataSelector);
  return data;
};

const useLoadableData = () => {
  const data = useRecoilValueLoadable(loadableDataSelector);
  if (data.state === "hasValue") {
    return data.contents;
  }
};

const useRequest = () => {
  const setData = useSetRecoilState(dataAtom);
  const { data } = useSWR<string[]>("/api/data", fetcher, {
    suspense: false,
  });

  useEffect(() => {
    setData(data);
  }, [data]);
};

function ReposComponent() {
  const data = useLoadableData();
  const title = "Measure";
  return (
    <>
      <h1>{title}</h1>
      <p>
        <button
          onClick={() => {
            mutate("/api/data", data && [...data, "hoge"]);
          }}
        >
          Load Users
        </button>
      </p>
      {data?.map((project) => (
        <p key={project}>
          <Link href="/[user]/[repo]" as={`/${project}`}>
            <a>{project}</a>
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
  return (
    <div style={{ textAlign: "center" }}>
      <h1>Trending Projects</h1>
      {!isServer ? (
        <ErrorBoundary fallback={<h2>Could not fetch posts.</h2>}>
          <Suspense fallback={<div>loading...</div>}>
            <ReposComponent />
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

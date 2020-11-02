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

const fuji: MountainType = {
  title: "Fuji",
  description: "Highest mountain of Japan",
  height: "3336",
  countries: ["Japan"],
  continent: "Eurasia",
  image: "",
  slug: "fuji",
  updatedAt: "2020/12/12",
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
  const addRepos = (mountain: MountainType) => {
    if (data != undefined) {
      mutate("/mountains", [...data, mountain]);
    }
  };

  return { data, addRepos };
};

function ReposComponent() {
  const { data, addRepos } = useData();

  return (
    <>
      <h1 style={{ color: "gray" }}>Suspense</h1>
      <p>
        <button
          onClick={() => {
            addRepos(fuji);
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

const useLoadableData = () => {
  const data = useRecoilValueLoadable(loadableDataSelector);
  const addRepos = (mountain: MountainType) => {
    if (data.state === "hasValue") {
      mutate("/mountains", [...data.contents, mountain]);
    }
  };

  return { data, addRepos };
};

function LoadableReposComponent() {
  const { data, addRepos } = useLoadableData();
  if (data?.state === "loading") {
    return <h2>ローディング</h2>;
  }
  if (data?.state === "hasError") {
    return <h2>This is Error</h2>;
  }
  return (
    <>
      <h1 style={{ color: "gray" }}>Not Suspense</h1>
      <p>
        <button
          onClick={() => {
            addRepos(fuji);
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
          <LoadableReposComponent />
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

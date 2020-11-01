import React, {
  ReactNode,
  Suspense,
  useEffect,
  useMemo,
  useState,
} from "react";
import { RecoilRoot, atom, useRecoilValue, useSetRecoilState } from "recoil";
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
const dataAtom = atom<string[] | undefined | null>({
  key: "DataAtom",
  default: null,
});
const titleAtom = atom<string>({
  key: "Title",
  default: "Popular Repos",
});

const dataSelector = selector<{
  title: string;
  repos: Loadable<string[]> | undefined;
}>({
  key: "DataSelector",
  get: ({ get }) => {
    const res = get(dataAtom);
    const repos =
      res === null
        ? undefined
        : res == undefined
        ? new Loadable<string[]>(new Promise(() => {}))
        : new Loadable<string[]>(Promise.resolve(res));
    return {
      title: get(titleAtom),
      repos: repos,
    };
  },
});

// const dataSelector = selector<{
//   title: string;
//   repos: Loadable<string[]> | undefined;
// }>({
//   key: "DataSelector",
//   get: ({ get }) => {
//     return {
//       title: get(titleAtom),
//       repos: get(dataLoadableAtom),
//     };
//   },
// });

const useData = () => {
  const data = useRecoilValue(dataSelector);
  return {
    title: data.title,
    repos: data.repos?.get(),
  };
};

const useRequest = () => {
  // const setDataLoadable = useSetRecoilState(dataLoadableAtom);

  // useEffect(() => {
  //   if (!data) {
  //     setDataLoadable(new Loadable(new Promise(() => {})));
  //     return;
  //   }
  //   setDataLoadable(new Loadable(Promise.resolve(data)));
  // }, [data]);
  const setData = useSetRecoilState(dataAtom);
  const { data } = useSWR<string[]>("/api/data", fetcher, {
    suspense: false,
  });

  useEffect(() => {
    setData(data);
  }, [data]);
};

function ReposComponent({
  loadable,
}: {
  loadable: Loadable<string[]> | undefined;
}) {
  // const { repos, title } = useData();
  const title = "Measure";
  // const { data } = useSWR<string[]>("/api/data", fetcher);
  // const [loadable, setLoadable] = useState<Loadable<string[]> | undefined>();
  // useEffect(() => {
  //   if (!data) {
  //     setLoadable(new Loadable<string[]>(new Promise(() => {})));
  //     return;
  //   }
  //   setLoadable(new Loadable<string[]>(Promise.resolve(data)));
  // }, [data]);
  return (
    <>
      <h1>{title}</h1>
      <p>
        <button
          onClick={() => {
            mutate(
              "/api/data",
              loadable ? [...loadable.get(), "hoge"] : ["hoge"]
            );
          }}
        >
          Load Users
        </button>
      </p>
      {loadable?.get().map((project) => (
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
  // useRequest();
  const { data } = useSWR<string[]>("/api/data", fetcher);
  const [loadable, setLoadable] = useState<Loadable<string[]> | undefined>();
  useEffect(() => {
    if (!data) {
      setLoadable(new Loadable<string[]>(new Promise(() => {})));
      return;
    }
    setLoadable(new Loadable<string[]>(Promise.resolve(data)));
  }, [data]);
  return (
    <div style={{ textAlign: "center" }}>
      <h1>Trending Projects</h1>
      {!isServer ? (
        <ErrorBoundary fallback={<h2>Could not fetch posts.</h2>}>
          <Suspense fallback={<div>loading...</div>}>
            <ReposComponent loadable={loadable} />
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

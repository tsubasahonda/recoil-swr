import React, { useEffect, Suspense, ReactNode } from "react";
import {
  RecoilRoot,
  atom,
  useSetRecoilState,
  useRecoilValue,
  selectorFamily,
} from "recoil";
import Link from "next/link";
import { fetcher } from "../libs/fetch";
import { MountainType, LoadableState } from "../libs/types";

import useSWR from "swr";

const isServer = typeof window === "undefined";

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

const mountainsState = atom<MountainType[]>({
  key: "MountainsState",
  default: [],
});

const mountainsSelector = selectorFamily<MountainType[], string>({
  key: "MountainsSelector",
  get: (continent) => ({ get }) => {
    const mountains = get(mountainsState);
    const filtered = mountains?.filter(
      (mountain) => mountain.continent === continent
    );
    return filtered;
  },
});

const useMountains = (continent: string) => {
  const setMountains = useSetRecoilState(mountainsState);
  const { data } = useSWR<MountainType[]>("/mountains", fetcher, {
    suspense: true,
  });
  useEffect(() => {
    if (data) setMountains(data);
  }, [data]);
  const mountains = useRecoilValue(mountainsSelector(continent));

  return [mountains] as const;
};

function Mountains() {
  const continent = "North America";
  const [mountains] = useMountains(continent);

  return (
    <>
      <h1 style={{ color: "gray" }}>{continent}</h1>
      {mountains.map((mountain) => (
        <p key={mountain.slug}>
          <Link href="/mountains" as={`/${mountain.slug}`}>
            <a>{mountain.title}</a>
          </Link>
        </p>
      ))}
    </>
  );
}

const useMountainsLoadable = (
  continent: string
): LoadableState<MountainType[]> => {
  const setMountains = useSetRecoilState(mountainsState);
  const { data, error } = useSWR<MountainType[]>("/mountains", fetcher);
  useEffect(() => {
    if (data) setMountains(data);
  }, [data]);
  const mountains = useRecoilValue(mountainsSelector(continent));

  if (error) {
    return {
      type: "hasError",
      error: error,
    };
  }

  if (!data) {
    return {
      type: "loading",
    };
  }

  return {
    type: "hasValue",
    data: mountains,
  };
};

function MountainsLoadable() {
  const continent = "South America";
  const data = useMountainsLoadable(continent);
  if (data.type === "loading") {
    return <div>loading...</div>;
  }

  if (data.type === "hasError") {
    throw data.error;
  }

  return (
    <>
      <h1 style={{ color: "gray" }}>{continent}</h1>
      {data.data.map((mountain) => (
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
  return (
    <div style={{ textAlign: "center" }}>
      <h1>Trending Projects</h1>

      {!isServer ? (
        <ErrorBoundary fallback={<h2>Could not fetch posts.</h2>}>
          <Suspense fallback={<div>suspended...</div>}>
            <Mountains />
          </Suspense>
          <MountainsLoadable />
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

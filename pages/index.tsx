import React, { useEffect, Suspense, ReactNode } from "react";
import {
  RecoilRoot,
  atom,
  DefaultValue,
  useSetRecoilState,
  useRecoilValue,
  selectorFamily,
} from "recoil";
import Link from "next/link";
import { fetcher } from "../libs/fetch";

import useSWR from "swr";

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

const mountainsState = atom<MountainType[] | undefined>({
  key: "MountainsState",
  default: undefined,
});

const mountainsSelector = selectorFamily<MountainType[], string>({
  key: "MountainsSelector",
  get: (continent) => async ({ get }) => {
    const mountains = get(mountainsState);
    return new Promise<MountainType[]>((resolve, reject) => {
      try {
        if (mountains == undefined) {
          return;
        }
        if (continent == undefined) {
          resolve(mountains);
        }
        const filtered = mountains.filter(
          (mountain) => mountain.continent === continent
        );
        resolve(filtered);
      } catch (e) {
        reject(e);
      }
    });
  },
});

const useMountainsRequest = () => {
  const setMountains = useSetRecoilState(mountainsState);
  const { data } = useSWR<MountainType[]>("/mountains", fetcher);
  useEffect(() => {
    if (data) setMountains(data);
  }, [data]);
};

const useMountains = (continent: string) => {
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
  useMountainsRequest();
  return (
    <div style={{ textAlign: "center" }}>
      <h1>Trending Projects</h1>

      {!isServer ? (
        <ErrorBoundary fallback={<h2>Could not fetch posts.</h2>}>
          <Suspense fallback={<div>loading...</div>}>
            <Mountains />
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

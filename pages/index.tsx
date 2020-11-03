import React, { useEffect } from "react";
import { RecoilRoot, atom, useRecoilState, DefaultValue } from "recoil";
import Link from "next/link";
import { fetcher } from "../libs/fetch";

import useSWR, { mutate } from "swr";

import { selector } from "recoil";
import { useSetRecoilState } from "recoil";

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

const mountainsState = atom<MountainType[]>({
  key: "MountainsState",
  default: [],
});

const continentState = atom<string | undefined>({
  key: "ContinentState",
  default: undefined,
});

const mountainsSelector = selector<MountainType[]>({
  key: "MountainsSelector",
  get: ({ get }) => {
    const mountains = get(mountainsState);
    const continent = get(continentState);
    if (continent) {
      return mountains.filter((mountain) => mountain.continent === continent);
    }
    return mountains;
  },
  set: ({ set }, newValue) => {
    if (newValue instanceof DefaultValue) return;
    set(mountainsState, newValue);
  },
});

const useMountains = (continent: string) => {
  const [mountains, setMountains] = useRecoilState(mountainsSelector);
  const setContinent = useSetRecoilState(continentState);
  const { data } = useSWR<MountainType[]>("/mountains", fetcher);

  useEffect(() => {
    if (data) setMountains(data);
  }, [data]);

  useEffect(() => {
    setContinent(continent);
  }, [continent]);

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

function HomePage() {
  return (
    <div style={{ textAlign: "center" }}>
      <h1>Trending Projects</h1>

      {!isServer ? <Mountains /> : null}
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

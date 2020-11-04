import { useCallback } from "react";
import useSWR from "swr";
import { fetcher } from "../libs/fetch";
import { MountainType } from "../libs/types";

// const useMountains = () => {
//   const { data, mutate } = useSWR("/mountains", fetcher);

//   const addMountains = useCallback(
//     (mountain: MountainType) => {
//       // fetcher('/mountains', 'post', { mountain: mountains });
//       mutate([...data, mountain]);
//     },
//     [data, mutate]
//   );

//   return {
//     data,
//     addMountains,
//   };
// };

const useMountains = (): [
  MountainType[] | undefined,
  (mountains: MountainType[]) => void
] => {
  const { data, mutate } = useSWR<MountainType[]>("/mountains", fetcher);
  console.log("hoge");

  const setMountains = useCallback(
    (mountains: MountainType[]) => {
      const newData = data ? [...data, ...mountains] : mountains;
      // fetcher('/mountains', 'post', { mountain: mountains });
      mutate(newData);
    },
    [data, mutate]
  );

  return [data, setMountains];
};

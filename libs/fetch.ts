import fetch from "isomorphic-unfetch";
const baseUrl = "https://api.nuxtjs.dev";
const sleep = (msec: number) =>
  new Promise((resolve) => setTimeout(resolve, msec));

export const fetcher = async (url: string) => {
  const res = await fetch(`${baseUrl}${url}`);
  // If the status code is not in the range 200-299,
  // we still try to parse and throw it.
  if (!res.ok) {
    const error: any = new Error("An error occurred while fetching the data.");
    // Attach extra info to the error object.
    error.info = await res.json();
    error.status = res.status;
    throw error;
  }
  await sleep(2000);
  return res.json();
};

export default async function <JSON = any>(
  input: RequestInfo,
  init?: RequestInit
): Promise<JSON> {
  const res = await fetch(input, init);
  return res.json();
}

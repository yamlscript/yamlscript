export * as rss from "./rss.ts";
export { _ } from "../deps.ts";
export {
  assert,
  assertAlmostEquals,
  assertArrayIncludes,
  assertEquals,
  assertExists,
  assertMatch,
  assertNotEquals,
  assertNotMatch,
  assertObjectMatch,
  assertRejects,
  assertThrows,
} from "../deps.ts";
export const readTextFile = Deno.readTextFile;
export const readJsonFile = async (path: string): Promise<unknown> => {
  const content = await readTextFile(path);
  return JSON.parse(content);
};
export const writeTextFile = Deno.writeTextFile;
export const writeJsonFile = async (
  path: string,
  data: unknown,
): Promise<void> => {
  const content = JSON.stringify(data);
  await writeTextFile(path, content);
};

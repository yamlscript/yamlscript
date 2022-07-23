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
import { parse, stringify } from "../deps.ts";
export * as YAML from "https://deno.land/std@0.149.0/encoding/yaml.ts";
export { default as getArgs } from "./get_args.ts";
export const readTextFile = Deno.readTextFile;
export const readJSONFile = async (path: string): Promise<unknown> => {
  const content = await readTextFile(path);
  return JSON.parse(content);
};
export const writeTextFile = Deno.writeTextFile;
export const writeJSONFile = async (
  path: string,
  data: unknown,
): Promise<void> => {
  const content = JSON.stringify(data);
  await writeTextFile(path, content);
};

export async function readYAMLFile(path: string): Promise<unknown> {
  const content = await readTextFile(path);
  return parse(content);
}
export async function writeYAMLFile(
  path: string,
  data: Record<string, unknown>,
): Promise<void> {
  const content = stringify(data);
  await writeTextFile(path, content);
}

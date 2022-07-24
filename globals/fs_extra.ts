import { parse, stringify } from "../deps.ts";

const readTextFile = Deno.readTextFile;
const writeTextFile = Deno.writeTextFile;

export const readJSONFile = async (path: string): Promise<unknown> => {
  const content = await readTextFile(path);
  return JSON.parse(content);
};
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

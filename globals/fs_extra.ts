import {
  copy as copyFn,
  dirname,
  ensureDir,
  ensureFile,
  parse,
  stringify,
} from "../deps.ts";

const readTextFile = Deno.readTextFile;
const writeTextFile = Deno.writeTextFile;

export const readJSONFile = async (path: string): Promise<unknown> => {
  const content = await readTextFile(path);
  return JSON.parse(content);
};
export const readJSONFileWithDefaultValue = async (
  path: string,
  defaultValue: unknown,
): Promise<unknown> => {
  try {
    const content = await readTextFile(path);
    return JSON.parse(content);
  } catch (_) {
    return defaultValue;
  }
};
export const writeJSONFile = async (
  path: string,
  data: unknown,
): Promise<void> => {
  const content = JSON.stringify(data);
  await ensureFile(path);
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
  await ensureFile(path);
  await writeTextFile(path, content);
}

// write text file ensure path
export async function ensureAndWriteTextFile(
  path: string,
  data: string,
): Promise<void> {
  await ensureFile(path);
  await writeTextFile(path, data);
}

// copy with overwrite true, and ensure target dir exists
export async function copy(
  src: string,
  dest: string,
): Promise<void> {
  // ensure target dir exists
  await ensureDir(dirname(dest));
  await copyFn(src, dest, { overwrite: true });
}

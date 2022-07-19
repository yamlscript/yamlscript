import { RunSingleOptions } from "./interface.ts";
import { basename, dirname, ensureDir, resolve } from "./deps.ts";

export const get = (obj: unknown, path: string, defaultValue = undefined) => {
  const travel = (regexp: RegExp) =>
    String.prototype.split
      .call(path, regexp)
      .filter(Boolean)
      .reduce(
        (res, key) =>
          res !== null && res !== undefined
            ? (res as Record<string, string>)[key]
            : res,
        obj,
      );
  const result = travel(/[,[\]]+?/) || travel(/[,[\].]+?/);
  return result === undefined || result === obj ? defaultValue : result;
};

export const changeExt = (path: string, ext: string) => {
  return path.replace(/\.[^.]+$/, ext);
};
export const createDistFile = async (
  content: string,
  options: RunSingleOptions,
) => {
  const moduleFilerelativePath = changeExt(options.relativePath, ".module.js");
  const runFilerelativePath = changeExt(options.relativePath, ".js");

  const moduleFileName = basename(moduleFilerelativePath);
  const moduleFilePath = resolve(options.dist, moduleFilerelativePath);
  await ensureDir(dirname(moduleFilePath));
  await Deno.writeTextFile(moduleFilePath, content);

  // then create run file
  const runFileContent =
    `import main from "./${moduleFileName}";\nmain().catch(console.error);`;
  const runFilePath = resolve(options.dist, runFilerelativePath);
  await Deno.writeTextFile(runFilePath, runFileContent);
};
export function isObject(obj: unknown): boolean {
  return typeof obj === "object" &&
    !Array.isArray(obj) &&
    obj !== null;
}

export function isClass(v: unknown): boolean {
  return typeof v === "function" && /^\s*class\s+/.test(v.toString());
}

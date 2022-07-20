import { BuildContext, BuildTasksOptions, PublicContext } from "./interface.ts";
import { basename, dirname, ensureDir, parse, resolve } from "./deps.ts";
import { BuiltCode } from "./_interface.ts";
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
  let filename = path.replace(/\.[^.]+$/, "");
  // remove .ysh if exist
  filename = filename.replace(/\.ysh$/, "");
  return `${filename}${ext}`;
};
export const createDistFile = async (
  content: string,
  options: BuildTasksOptions,
): Promise<BuiltCode> => {
  const moduleFilerelativePath = changeExt(options.relativePath, ".mod.js");
  const runFilerelativePath = changeExt(options.relativePath, ".js");
  const dist = options.dist || "dist";
  const moduleFileName = basename(moduleFilerelativePath);
  const moduleFilePath = resolve(dist, moduleFilerelativePath);
  await ensureDir(dirname(moduleFilePath));
  await Deno.writeTextFile(moduleFilePath, content);

  // then create run file
  const runFileContent =
    `import main from "./${moduleFileName}";\nmain().catch(console.error);`;
  const runFilePath = resolve(dist, runFilerelativePath);
  await Deno.writeTextFile(runFilePath, runFileContent);
  return {
    moduleFileCode: content,
    runFileCode: runFileContent,
    moduleFilePath: moduleFilePath,
    runFilePath: runFilePath,
  };
};
export function isObject(obj: unknown): boolean {
  return typeof obj === "object" &&
    !Array.isArray(obj) &&
    obj !== null;
}

export function isClass(v: unknown): boolean {
  return typeof v === "function" && /^\s*class\s+/.test(v.toString());
}
export async function parseYamlFile(file: string): Promise<unknown> {
  const content = await Deno.readTextFile(file);
  return parse(content);
}

export function getDefaultPublicContext() {
  const defaultBuildContext: BuildContext = {
    env: {},
    os: {},
  };
  const defaultPublicContext: PublicContext = {
    build: defaultBuildContext,
  };
  return defaultPublicContext;
}

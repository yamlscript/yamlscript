import { BuildContext, BuildTasksOptions, PublicContext } from "./interface.ts";
import { dirname, ensureDir, parse, resolve } from "./deps.ts";
import { BuiltCode, TasksCode } from "./_interface.ts";
import pkg from "./pkg.json" assert { type: "json" };
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
  // remove .ys if exist
  const suffixRegex = new RegExp(`\.${pkg.bin}$`);
  filename = filename.replace(suffixRegex, "");
  return `${filename}${ext}`;
};
export const createDistFile = async (
  codeResult: TasksCode,
  options: BuildTasksOptions,
): Promise<BuiltCode> => {
  const moduleFilerelativePath = changeExt(options.relativePath, ".js");
  const dist = options.dist || "dist";
  const moduleFilePath = resolve(dist, moduleFilerelativePath);
  await ensureDir(dirname(moduleFilePath));
  await Deno.writeTextFile(moduleFilePath, codeResult.moduleFileCode);

  let runtimeFilePath: string | undefined;

  // check if need to create runtime file
  if (options.shouldBuildRuntime) {
    const runtimeFilerelativePath = changeExt(
      options.relativePath,
      ".runtime.js",
    );
    runtimeFilePath = resolve(dist, runtimeFilerelativePath);
    await ensureDir(dirname(runtimeFilePath));
    await Deno.writeTextFile(runtimeFilePath, codeResult.runtimeFileCode);
  }
  return {
    ...codeResult,
    moduleFilePath: moduleFilePath,
    runtimeFilePath: runtimeFilePath,
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

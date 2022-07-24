import { BuildContext, BuildTasksContext, PublicContext } from "./interface.ts";
import { dirname, ensureDir, parse, resolve } from "./deps.ts";
import { BuiltCode, TasksCode } from "./_interface.ts";
import pkg from "./pkg.json" assert { type: "json" };
import log from "./log.ts";
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

export const getDistFilePath = (
  relativePath: string,
  ext: string,
  distDir?: string,
): string => {
  const dist = distDir || "dist";
  const moduleFilerelativePath = changeExt(relativePath, ext);
  const moduleFilePath = resolve(dist, moduleFilerelativePath);
  return moduleFilePath;
};

export const createDistFile = async (
  codeResult: TasksCode,
  options: BuildTasksContext,
): Promise<BuiltCode> => {
  const moduleFilePath = getDistFilePath(
    options.relativePath,
    ".js",
    options.dist,
  );
  await ensureDir(dirname(moduleFilePath));
  await Deno.writeTextFile(moduleFilePath, codeResult.moduleFileCode);

  let runtimeFilePath: string | undefined;

  // check if need to create runtime file
  if (options.shouldBuildRuntime) {
    runtimeFilePath = getDistFilePath(
      options.relativePath,
      ".runtime.js",
      options.dist,
    );
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

// deno-lint-ignore ban-types
export function isAsyncFunction(fn: Function): boolean {
  if (
    fn.constructor.name === "AsyncFunction"
  ) {
    return true;
  } else {
    return false;
  }
}
export async function hasPermissionSlient(
  permission: Deno.PermissionDescriptor,
): Promise<boolean> {
  const permissionState = await Deno.permissions.query(permission);
  const is = permissionState.state === "granted";
  if (!is) {
    log.debug(
      `--allow-${permission.name} flag now set, skip ${permission.name} permission`,
    );
    return false;
  } else {
    return true;
  }
}
export function withIndent(code: string, indent: number): string {
  if (!indent) {
    return code;
  }
  return code.split("\n").map((line) => {
    // if line is only \n
    if (line.trim() === "") {
      return line;
    } else {
      return `${" ".repeat(indent)}${line}`;
    }
  }).join(
    "\n",
  );
}

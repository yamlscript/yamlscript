import { BuildContext, PublicContext, TasksContext } from "./interface.ts";
import {
  dirname,
  ensureDir,
  expandGlob,
  fromFileUrl,
  isGlob,
  parse,
  relative,
  resolve,
} from "./deps.ts";
import { BuiltCode, StrictTasksContext, TasksCode } from "./_interface.ts";
import pkg from "./pkg.json" assert { type: "json" };
import log from "./log.ts";
import { GLOBAL_PACKAGE_URL, SYNC_FUNCTIONS } from "./constant.ts";
const _toString = Object.prototype.toString;
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
  // to relative path
  const finalRelativePath = relative(Deno.cwd(), moduleFilePath);
  return finalRelativePath;
};

export const createDistFile = async (
  codeResult: TasksCode,
  options: StrictTasksContext,
): Promise<BuiltCode> => {
  const moduleFilePath = getDistFilePath(
    options.relativePath,
    ".js",
    options.dist,
  );
  await ensureDir(dirname(moduleFilePath));
  await Deno.writeTextFile(moduleFilePath, codeResult.code);

  return {
    ...codeResult,
    path: moduleFilePath,
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
const _isFunctionLike = (value: unknown): boolean =>
  value !== null && typeof value === "function";

export function isAsyncFunction(use: string, value: unknown): boolean {
  const definitelySync = SYNC_FUNCTIONS.includes(use);
  // lodash
  if (use.startsWith("_.")) {
    return false;
  }
  if (definitelySync) {
    return false;
  }
  const definitelyAsync = _isFunctionLike(value) &&
    _toString.call(value) === "[object AsyncFunction]";
  return (
    definitelyAsync || true
  );
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
/**
 * consider template string
 * @param code
 * @param indent
 * @returns
 */
export function withIndent(code: string, indent: number): string {
  if (!indent) {
    return code;
  }
  let isStartTemplateString = false;
  return code.split("\n").map((line) => {
    const matches = line.matchAll(/\\?\`/g);

    let finalLine = "";
    // if line is only \n
    if (line.trim() === "") {
      finalLine = line;
    } else {
      if (isStartTemplateString) {
        finalLine = line;
      } else {
        finalLine = `${" ".repeat(indent)}${line}`;
      }
    }
    for (const match of matches) {
      if (match[0]) {
        if (match[0][0] === "`") {
          isStartTemplateString = !isStartTemplateString;
        }
      }
    }
    return finalLine;
  }).join(
    "\n",
  );
}

export async function getPublicContext(): Promise<PublicContext> {
  // try get env
  const isHasEnvPermission = await hasPermissionSlient({
    name: "env",
  });
  let env = {};
  if (isHasEnvPermission) {
    env = Deno.env.toObject();
  }
  const buildContext: BuildContext = {
    env: env,
    os: {},
  };
  const publicContext: PublicContext = {
    build: buildContext,
  };
  return publicContext;
}

export async function getFilesFromGlob(args: string[]): Promise<string[]> {
  const files: string[] = [];
  for (const str of args) {
    if (isGlob(str)) {
      // find all files
      for await (const file of expandGlob(str)) {
        files.push(file.path);
      }
    } else {
      // to abosolute path
      files.push(resolve(str));
    }
  }
  return files;
}

export function getUniqueStrings(
  arr: string[],
): string[] {
  const set = new Set(arr);
  return Array.from(set);
}

export function absolutePathToRelativePath(
  absolutePath: string,
): string {
  const relativePath = relative(Deno.cwd(), absolutePath);
  return relativePath;
}
export function importCodeToDynamicImport(
  code: string,
  options?: TasksContext,
): string {
  const finalCode = code.split("import ").filter((_, index) => index >= 1).map(
    (line) => {
      const fromToken = " from ";
      const fromStart = line.indexOf(fromToken);

      if (fromStart !== -1) {
        let importStr = line.substring(
          0,
          fromStart,
        );
        importStr = importStr.replace("* as ", "");
        // importStr.replace("as", ":");
        const fromStr = line.substring(fromStart + fromToken.length).trim()
          .replace(/;$/, "").replace('"', "").replace('"', "");
        const url = getGlobalsFrom(fromStr, options);
        return `const ${importStr} = await import("${url}");`;
      } else {
        throw new Error(`import code error ${line}`);
      }
    },
  ).join("\n");
  return finalCode + "\n";
}
export function getGlobalsFrom(url: string, options?: TasksContext) {
  if (
    options && options.relativePath && options.dist && options.dev
  ) {
    // dev
    // return dev url
    // get path
    // for dev
    // get relative path
    if (url.startsWith(".")) {
      const currentDirname = resolve(
        dirname(fromFileUrl(import.meta.url)),
        "./globals",
      );

      const globalModFilePath = resolve(currentDirname, url);
      const targetPath = getDistFilePath(
        options.relativePath,
        ".js",
        options.dist,
      );
      url = relative(
        dirname(targetPath),
        globalModFilePath,
      );
    }
  } else {
    if (url.startsWith(".")) {
      // add global
      url = new URL(url, GLOBAL_PACKAGE_URL).href;
    }
  }
  return url;
}
export function formatImportCode(
  code: string,
  options: TasksContext,
): string {
  const finalCode = code.split("import ").filter((_, index) => index >= 1).map(
    (line) => {
      const fromToken = " from ";
      const fromStart = line.indexOf(fromToken);

      if (fromStart > -1) {
        const importStr = line.substring(
          0,
          fromStart,
        );
        // importStr.replace("as", ":");
        const fromStr = line.substring(fromStart + fromToken.length).trim()
          .replace(/;$/, "").replace('"', "").replace('"', "");
        const url = getGlobalsFrom(fromStr, options);
        return `import ${importStr} from "${url}";`;
      } else {
        throw new Error(`import code error ${line}`);
      }
    },
  ).join("\n");
  return finalCode + "\n";
}
export async function getGlobalsCode() {
  console.log("import.meta.url", import.meta.url);
  console.log("deno.main module", Deno.mainModule);
  const globaModCode = await Deno.readTextFile(
    new URL("./globals/mod.ts", import.meta.url),
  );
  // get import code start to import code end
  const startToken = "// import code start";
  const endToken = "// import code end";
  const importCodeStart = globaModCode.indexOf(startToken);
  const importCodeEnd = globaModCode.indexOf(endToken);
  if (importCodeStart >= 0 && importCodeEnd >= 0) {
    const importCode = globaModCode.substring(
      importCodeStart + startToken.length,
      importCodeEnd,
    );
    return importCode.trim();
  } else {
    throw new Error("global/mod.ts not found");
  }
}
export const groupBy = function (xs: Record<string, string>[], key: string) {
  const initGroups: Record<string, Record<string, string>[]> = {};
  return xs.reduce(function (rv, x) {
    (rv[x[key]] = rv[x[key]] || []).push(x);
    return rv;
  }, initGroups);
};

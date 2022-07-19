import { RunSingleOptions } from "./interface.ts";
import { compile } from "./template.ts";
import * as globals from "./globals/mod.ts";
import { get, ctxKeys, createDistFile } from "./util.ts";
import {
  GLOBAL_PACKAGE_URL,
  DEFAULT_USE_NAME,
  RUNTIME_FUNCTION_OPTIONS_NAME,
} from "./constant.ts";
import log from "./log.ts";
import { green } from "./deps.ts";
export async function runSingle(options: RunSingleOptions) {
  log.debug("run single options", JSON.stringify(options, null, 2));
  log.info(`start run ${options.relativePath}`);
  const { tasks } = options;
  // for precompiled code to import modules
  let importCode = "";
  // for runtime code to import modules
  let runtimeImportCode = "";
  // one by one
  let functionBody = "";

  for (const task of tasks) {
    const { from: rawFrom, use: rawUse, args: rawArgs } = task;
    const ctx = {
      title: "test",
    };
    let use = DEFAULT_USE_NAME;
    if (rawUse && rawUse.trim() !== "") {
      const useTemplateFn = compile(rawUse, ctxKeys);
      use = useTemplateFn(ctx);
    }

    let inlineInfo = ``;
    let from: string | undefined;
    if (rawFrom && rawFrom.trim() !== "") {
      const fromTemplateFn = compile(rawFrom, ctxKeys);
      from = fromTemplateFn(ctx);
    }
    // add compile code
    if (from) {
      let importPath = "";
      if (DEFAULT_USE_NAME === use) {
        // default
        importPath = DEFAULT_USE_NAME;
      } else {
        importPath = `{${use}}`;
      }
      importCode += `import ${importPath} from "${from}";\n`;
      runtimeImportCode += `const ${importPath} = import("${from}");\n`;
      inlineInfo += `use ${green(importPath)} from {${from}}`;
    } else if (get(globals, use)) {
      importCode += `import { ${use} } from "${GLOBAL_PACKAGE_URL}";\n`;
      runtimeImportCode += `const { ${use} } = ${RUNTIME_FUNCTION_OPTIONS_NAME}.globals;\n`;
      inlineInfo += `use { ${green(use)} } from "${GLOBAL_PACKAGE_URL}"`;
    } else if (
      get(globalThis, use) &&
      typeof get(globalThis, use) === "function"
    ) {
      inlineInfo += `use ${green(use)}`;
    } else {
      // not found use
      log.fatal(
        `can't found function ${green(use)}, did you forget \`${green(
          "from"
        )}\` param?`
      );
    }
    // check rawArgs is array, or object, or other pure type
    const argsTemplateFn = compile(JSON.stringify(rawArgs), ctxKeys);
    const argsString = argsTemplateFn(ctx);
    const args = JSON.parse(argsString);

    if (Array.isArray(args)) {
      // array, then put to args
      const argsFlatten = args.map((item) => JSON.stringify(item)).join(",");
      const argsPrint = args
        .map((item) => JSON.stringify(item, null, 2))
        .join(" ");

      inlineInfo += ` with args: ${argsPrint}`;

      functionBody += `await ${use}(${argsFlatten});\n`;
    } else {
      // as the first one args
      functionBody += `await ${use}(${JSON.stringify(args)});\n`;
      inlineInfo += ` with args: ${JSON.stringify(args, null, 2)}`;
    }
    log.debug(inlineInfo);
  }

  const runtimeCode = `${runtimeImportCode}\n${functionBody}`;

  const compiledModuleCode =
    importCode + `export default async function main(){\n${functionBody}\n}`;
  if (options.isBuild) {
    await createDistFile(compiledModuleCode, options);
  } else {
    // run
    const AsyncFunction = Object.getPrototypeOf(
      async function () {}
    ).constructor;

    const runtimeFn = new AsyncFunction(
      RUNTIME_FUNCTION_OPTIONS_NAME,
      runtimeCode
    );
    runtimeFn({
      globals: globals,
    }).catch((e: Error) => {
      log.debug("runtimeCode", runtimeCode);
      log.fatal(e.message);
    });
  }
}

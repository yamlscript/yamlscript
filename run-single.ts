import { RunSingleOptions } from "./interface.ts";
import { compile } from "./template.ts";
import * as buildin from "./global/mod.ts";
import { get, ctxKeys, createDistFile, getGlobalPackageUrl } from "./util.ts";
import log from "./log.ts";
import { gray, green } from "./deps.ts";
export async function runSingle(options: RunSingleOptions) {
  log.debug("run single options", JSON.stringify(options, null, 2));

  const { tasks } = options;

  let importCode = "";
  // one by one
  let functionBody = "";

  for (const task of tasks) {
    const { use: rawUse, args: rawArgs } = task;
    const ctx = {
      title: "test",
    };
    const useTemplateFn = compile(rawUse, ctxKeys);
    const use = useTemplateFn(ctx);
    log.debug("use", use);
    // add compile code
    if (get(buildin, use)) {
      importCode += `import { ${use} } from "${getGlobalPackageUrl()}";\n`;
    } else if (
      typeof (globalThis as Record<string, unknown>)[use] === "function"
    ) {
      console.log("here");

      // const result = await (get(globalThis, use) as Function)(argsObject);
      // console.log("result2", result);
    }
    // check rawArgs is array, or object, or other pure type
    const argsTemplateFn = compile(JSON.stringify(rawArgs), ctxKeys);
    const argsString = argsTemplateFn(ctx);
    const args = JSON.parse(argsString);
    log.debug("args", JSON.stringify(args, null, 2));
    if (Array.isArray(args)) {
      // array, then put to args
      functionBody += `await ${use}(${args
        .map((item) => JSON.stringify(item))
        .join(",")});\n`;
    } else {
      // as the first one args
      functionBody += `await ${use}(${JSON.stringify(args)});\n`;
    }

    // check result if internal
    // if (get(buildin, use)) {
    //   const result = await (get(buildin, useString) as Function)(argsObject);
    //   console.log("result", result);
    // } else if (
    //   typeof (globalThis as Record<string, unknown>)[useString] === "function"
    // ) {
    //   const result = await (get(globalThis, useString) as Function)(argsObject);
    //   console.log("result2", result);
    // }
  }
  const compiledModuleCode =
    importCode + `export default async function main(){\n${functionBody}\n}`;
  console.log("compiledModuleCode", compiledModuleCode);
  if (options.buildDenoDeploy) {
    await createDistFile(compiledModuleCode, options);
  }
}

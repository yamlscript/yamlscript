import {
  BuildTasksOptions,
  GlobalContext,
  RunTasksOptions,
  Task,
  TasksOptions,
} from "./interface.ts";
import {
  BuiltCode,
  FileCode,
  LiteralCode,
  StrictLiteralCode,
  StrictTasksOptions,
  TasksCode,
} from "./_interface.ts";

import { compile, convertValueToLiteral } from "./template.ts";
import * as globals from "./globals/mod.ts";
import { createDistFile, get, isObject } from "./util.ts";
import {
  COMPILED_CONTEXT_KEYS,
  DEFAULT_USE_NAME,
  GLOBAL_PACKAGE_URL,
  LOOP_ITEM_INDEX,
  LOOP_ITEM_NAME,
  LOOP_LENGTH_NAME,
  LOOP_VARIABLE_NAME,
  RUNTIME_FUNCTION_OPTIONS_NAME,
} from "./constant.ts";
import log from "./log.ts";
import { green } from "./deps.ts";
import config from "./config.json" assert { type: "json" };
import main from "./dist/examples/rss-notify.module.js";
const contextConfig = config.context;
export function compileTasks(
  tasks: Task[],
  originalOptions: TasksOptions,
): TasksCode {
  log.debug("run single options", JSON.stringify(originalOptions, null, 2));
  const options = getDefaultTasksOptions(originalOptions);
  // for precompiled code to import modules
  const fileCode = initFileCode();

  // one by one
  for (const task of tasks) {
    const { loop: rawLoop } = task;

    // first transform top level from and use code
    const importResult = transformUse(task, options);
    concatFileCode(fileCode, importResult);
    // change use to final value
    task.use = importResult.use as string;

    // transform main function body

    // check if loop
    if (rawLoop) {
      const loopResult = transformLoop(task, {
        ...options,
        indent: options.indent + 2,
      });
      concatFileCode(fileCode, loopResult);
    } else {
      const useCallResult = transformUseCall(task, {
        ...options,
        indent: options.indent + 2,
      });
      concatFileCode(fileCode, useCallResult);
    }
  }
  return getTasksCode(fileCode);
}

export function buildTasks(
  tasks: Task[],
  options: BuildTasksOptions,
): Promise<BuiltCode> {
  const codeResult = compileTasks(tasks, options);
  return createDistFile(codeResult.moduleFileCode, options);
}
export function runTasks(tasks: Task[], options: RunTasksOptions) {
  const codeResult = compileTasks(tasks, options);
  return runAsyncFunction(codeResult.runtimeCode);
}
export function runAsyncFunction(runtimeCode: string) {
  // run
  const AsyncFunction = Object.getPrototypeOf(
    async function () {},
  ).constructor;

  const runtimeFn = new AsyncFunction(
    RUNTIME_FUNCTION_OPTIONS_NAME,
    runtimeCode,
  );
  return runtimeFn({
    globals: globals,
  }).catch((e: Error) => {
    log.debug("runtimeCode", runtimeCode);
    log.fatal(e.message);
  });
}

function getTasksCode(fileCode: FileCode): TasksCode {
  const runtimeCode =
    `${fileCode.runtimeImportCode}\n${fileCode.mainFunctionBody}`;

  const compiledModuleCode = fileCode.importCode +
    `export default async function main(){\n${fileCode.mainFunctionBody}\n}`;
  return {
    moduleFileCode: compiledModuleCode,
    runtimeCode,
  };
}

// affect function
function concatFileCode(fileCode: FileCode, literalCode: LiteralCode): void {
  const strickLiteralCode = formatLiteralCode(literalCode);
  fileCode.importCode += strickLiteralCode.importCode;
  fileCode.runtimeImportCode += strickLiteralCode.runtimeImportCode;
  fileCode.mainFunctionBody += strickLiteralCode.mainFunctionBody;
}

function initFileCode(): FileCode {
  const importCode = "";
  // for runtime code to import modules
  const runtimeImportCode = "";
  const mainFunctionBody =
    `  let ${contextConfig.lastTaskResultName}=null, ${contextConfig.rootName}=null, ${contextConfig.envName}=null;\n`;
  return {
    importCode,
    runtimeImportCode,
    mainFunctionBody,
  };
}

function transformLoop(task: Task, options: StrictTasksOptions): LiteralCode {
  const { loop: rawLoop } = task;
  let mainFunctionBody = "";
  let isLoopValid = false;
  // start build function body
  if (rawLoop && typeof rawLoop === "string" && rawLoop.trim()) {
    // consider as direct literal code
    mainFunctionBody += `for(let i=0;i<${
      convertValueToLiteral(rawLoop, { public: options.compiledContext })
    };i++){`;
    isLoopValid = true;
  } else if (rawLoop && Array.isArray(rawLoop)) {
    // loop array
    // compiled loop
    for (let i = 0; i < rawLoop.length; i++) {
      mainFunctionBody += `{
  const item = ${
        convertValueToLiteral(rawLoop[i], { public: options.compiledContext })
      };
  const index = ${i};\n`;
      // transform useCall
      mainFunctionBody = withIndent(mainFunctionBody, options.indent + 2);
      const useCallResult = transformUseCall(task, {
        ...options,
        indent: options.indent + 2,
      });
      mainFunctionBody += useCallResult.mainFunctionBody;

      mainFunctionBody += `}\n`;
    }
  } else {
    throw new Error("invalid loop params");
  }

  // start build function body
  if (isLoopValid) {
    mainFunctionBody += `}`;
  }
  return {
    mainFunctionBody,
  };
}

function transformUseCall(
  task: Task,
  options: StrictTasksOptions,
): LiteralCode {
  let mainFunctionBody = "";
  const { args: rawArgs, use } = task;
  const { indent } = options;
  // check if it's setVars
  // if it's setVars
  if (use === "setVars") {
    if (rawArgs && isObject(rawArgs)) {
      if (isObject(rawArgs) && !Array.isArray(rawArgs)) {
        const keys = Object.keys(rawArgs);
        for (const key of keys) {
          mainFunctionBody += `const ${key}=${
            convertValueToLiteral(rawArgs[key], {
              public: options.compiledContext,
            })
          };\n`;
        }
      } else {
        throw new Error("invalid args, setVars args must be object");
      }
    } else {
      // invalid setVars
      throw new Error("invalid args, setVars args must be object");
    }
  } else {
    if (Array.isArray(rawArgs)) {
      // array, then put args to literal args
      const argsFlatten = rawArgs.map((
        arg,
      ) => (convertValueToLiteral(arg, { public: options.compiledContext })))
        .join(",");

      mainFunctionBody +=
        `${contextConfig.lastTaskResultName} = await ${use}(${argsFlatten});\n`;
    } else {
      // as the first one args
      mainFunctionBody +=
        `${contextConfig.lastTaskResultName} = await ${use}(${(convertValueToLiteral(
          rawArgs,
          { public: options.compiledContext },
        ))});\n`;
    }
  }
  mainFunctionBody = withIndent(mainFunctionBody, indent);
  return {
    mainFunctionBody,
  };
}

/**
 * parse from and use
 * @param raw
 */
function transformUse(task: Task, options: StrictTasksOptions): LiteralCode {
  const { from: rawFrom, use: rawUse } = task;
  let importCode = "";
  let runtimeImportCode = "";
  let use = DEFAULT_USE_NAME;
  if (rawUse && rawUse.trim() !== "") {
    const useTemplateFn = compile(rawUse, COMPILED_CONTEXT_KEYS);
    use = useTemplateFn(
      options.compiledContext as unknown as Record<string, unknown>,
    );
  }

  if (use === "setVars") {
    // no more import
    return { use: use };
  }

  let debugLog = ``;
  let from: string | undefined;
  if (rawFrom && rawFrom.trim() !== "") {
    const fromTemplateFn = compile(rawFrom, COMPILED_CONTEXT_KEYS);
    from = fromTemplateFn(
      options.compiledContext as unknown as Record<string, unknown>,
    );
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
    runtimeImportCode += `const ${importPath} = await import("${from}");\n`;
    debugLog += `use ${green(importPath)} from {${from}}`;
  } else if (get(globals, use)) {
    importCode += `import { ${use} } from "${GLOBAL_PACKAGE_URL}";\n`;
    runtimeImportCode +=
      `const { ${use} } = ${RUNTIME_FUNCTION_OPTIONS_NAME}.globals;\n`;
    debugLog += `use { ${green(use)} } from "globals/mod.ts"`;
  } else if (
    get(globalThis, use) &&
    typeof get(globalThis, use) === "function"
  ) {
    debugLog += `use ${green(use)}`;
  } else {
    // not found use
    log.fatal(
      `can't found function ${green(use)}, did you forget \`${
        green(
          "from",
        )
      }\` param?`,
    );
  }
  return {
    use: use,
    importCode,
    runtimeImportCode,
    debugLog,
  };
}

function formatLiteralCode(result: LiteralCode): StrictLiteralCode {
  return {
    use: result.use ?? "",
    mainFunctionBody: result.mainFunctionBody ?? "",
    debugLog: result.debugLog ?? "",
    infoLog: result.infoLog ?? "",
    importCode: result.importCode ?? "",
    runtimeImportCode: result.runtimeImportCode ?? "",
    functions: result.functions ?? [],
    subTasks: result.subTasks ?? [],
  };
}

function getDefaultTasksOptions(
  tasksOptions: TasksOptions,
): StrictTasksOptions {
  return {
    ...tasksOptions,
    indent: tasksOptions.indent ?? 0,
  };
}

function withIndent(code: string, indent: number): string {
  return code.split("\n").map((line) => `${" ".repeat(indent)}${line}`).join(
    "\n",
  );
}

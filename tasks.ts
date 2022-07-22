import {
  BuildTasksOptions,
  RunTasksOptions,
  Task,
  TasksOptions,
  UseType,
} from "./interface.ts";
import {
  BuiltCode,
  FileCode,
  GetDefaultTaskOptionsOptions,
  ImportResult,
  LiteralCode,
  StrictLiteralCode,
  StrictTask,
  StrictTasksOptions,
  TasksCode,
} from "./_interface.ts";

import {
  compile,
  convertValueToLiteral,
  getCommand,
  getConditionResult,
  isCommand,
  isVariable,
} from "./template.ts";
import * as globals from "./globals/mod.ts";
import {
  createDistFile,
  get,
  getDefaultPublicContext,
  isAsyncFunction,
  isObject,
} from "./util.ts";
import {
  COMPILED_CONTEXT_KEYS,
  DEFAULT_USE_NAME,
  GLOBAL_PACKAGE_URL,
  GLOBAL_RUNTIME_CMD_PACKAGE_URL,
  LOOP_ITEM_INDEX,
  LOOP_ITEM_NAME,
  LOOP_LENGTH_NAME,
  LOOP_VARIABLE_NAME,
  RUNTIME_FUNCTION_OPTIONS_NAME,
} from "./constant.ts";
import log from "./log.ts";
import { green } from "./deps.ts";
import config from "./config.json" assert { type: "json" };
const contextConfig = config.context;
export function compileTasks(
  tasks: Task[],
  originalOptions: TasksOptions,
): TasksCode {
  log.debug("run single options", JSON.stringify(originalOptions, null, 2));
  let options = getDefaultTasksOptions(originalOptions);
  // for precompiled code to import modules
  const fileCode = initFileCode();
  let mainIndent = options.indent + 2;
  // one by one
  for (let taskIndex = 0; taskIndex < tasks.length; taskIndex++) {
    const originalTask = tasks[taskIndex];
    const task = getDefaultTaskOptions(originalTask, {
      taskIndex,
    });
    const { loop: rawLoop, if: rawIf } = task;

    // check compiled if condition
    if (rawIf !== undefined && !rawIf) {
      // dont generate any code
      continue;
    } else if (typeof rawIf === "string") {
      const conditionCompiledResult = getConditionResult(rawIf, options.public);
      if (
        typeof conditionCompiledResult === "boolean" &&
        conditionCompiledResult === false
      ) {
        continue;
      }
    }
    // first transform top level from and use code
    const importResult = transformImport(task, options);
    concatFileCode(fileCode, importResult);
    // change use to final value
    task.use = importResult.use as string;
    task.from = importResult.from as string;
    task.useType = importResult.useType;
    task.command = importResult.command;
    // transform main function body
    if (importResult.tasksOptions) {
      options = importResult.tasksOptions;
    }
    const ifResult = transformIf(task, {
      ...options,
      indent: mainIndent,
    });
    concatFileCode(fileCode, ifResult);

    const isNeedCloseBlock = ifResult.isNeedCloseBlock;
    // add Indent TODO: add indent to all code

    // check if loop
    if (rawLoop) {
      const loopResult = transformLoop(task, {
        ...options,
        indent: isNeedCloseBlock ? mainIndent + 2 : mainIndent,
      });
      concatFileCode(fileCode, loopResult);
    } else {
      const useCallResult = transformUseCall(task, {
        ...options,
        indent: isNeedCloseBlock ? mainIndent + 2 : mainIndent,
      });
      concatFileCode(fileCode, useCallResult);
    }

    if (isNeedCloseBlock) {
      fileCode.mainFunctionBody += withIndent(`}\n`, mainIndent);
    }
  }
  return getTasksCode(fileCode);
}

/**
 * parse from and use
 * should check import path duplicate
 * @param raw
 */
function transformImport(
  task: StrictTask,
  originalOptions: StrictTasksOptions,
): ImportResult {
  const { from: rawFrom, use: rawUse } = task;
  const options = {
    ...originalOptions,
  };
  const varsMap = {
    ...options.varsMap,
  };

  options.varsMap = varsMap;
  let importCode = "";
  let runtimeImportCode = "";
  let use = "";
  let useType = UseType.Default;
  if (rawUse && rawUse.trim() !== "") {
    const useTemplateFn = compile(rawUse, COMPILED_CONTEXT_KEYS);
    use = useTemplateFn(options.public) as string;
  }

  if (use === "setVars" || use === "setGlobalVars") {
    // no more import
    return { use: use, tasksOptions: options, useType: UseType.SetVars };
  } else if (isCommand(use)) {
    if (!varsMap["__yamlscript_create_process"]) {
      importCode =
        `import { __yamlscript_create_process } from "${GLOBAL_RUNTIME_CMD_PACKAGE_URL}";\n`;
      runtimeImportCode =
        `const { __yamlscript_create_process } = await import("${GLOBAL_RUNTIME_CMD_PACKAGE_URL}");\n`;
      setVarsMap(
        varsMap,
        "__yamlscript_create_process",
        UseType.GlobalsFunction,
      );
    }

    const newUse = DEFAULT_USE_NAME + "_" + task.taskIndex;

    return {
      use: newUse,
      tasksOptions: options,
      importCode,
      runtimeImportCode,
      useType: UseType.Command,
      command: getCommand(use),
    };
  } else if (isVariable(use)) {
    // if it's variable, then it's a runtime function, just use it
    // but we don't know if it's a async or not, we can assume it's async, // TODO  or maybe we can add a sync option to specify it's sync
    return {
      use: use,
      tasksOptions: options,
      useType: UseType.AsyncRuntimeFunction,
    };
  }

  let debugLog = ``;
  let from: string | undefined;
  if (rawFrom && rawFrom.trim() !== "") {
    const fromTemplateFn = compile(rawFrom, COMPILED_CONTEXT_KEYS);
    from = fromTemplateFn(options.public) as string;
  }
  // add compile code
  if (from) {
    let importPath = "";
    let runtimeImportPath = "";
    let importVar = "";
    if (!use) {
      // default
      // use if empty, we will give it a default random name
      use = DEFAULT_USE_NAME + "_" + task.taskIndex;
      importVar = use;
      importPath = `{ default as ${importVar} }`;
      runtimeImportPath = `{ default: ${importVar} }`;
    } else {
      const importPathValue = getImportPathValue(use);
      importPath = importPathValue[0];
      importVar = importPathValue[1];
      runtimeImportPath = importPath;
    }
    // check if import already
    if (!varsMap[importVar]) {
      importCode += `import ${importPath} from "${from}";\n`;
      runtimeImportCode +=
        `  const ${runtimeImportPath} = await import("${from}");\n`;

      // get import var type
      // TODO, cause import is an async operation, we should consider if we should check it. now we just treat it as async operation

      setVarsMap(options.varsMap, importVar, UseType.AsyncThirdPartyFunction);
      // TODO: check function type
      // async or other
      debugLog += `use ${green(importPath)} from {${from}}`;
    }
    useType = UseType.AsyncThirdPartyFunction;
  } else if (use && get(globals, use)) {
    //
    // deno-lint-ignore ban-types
    const fn = get(globals, use) as Function;
    const importPathValue = getImportPathValue(use);
    const importPath = importPathValue[0];
    const importVar = importPathValue[1];
    // check if it's a async function
    if (isAsyncFunction(fn)) {
      useType = UseType.AsyncGlobalsFunction;
    } else {
      useType = UseType.GlobalsFunction;
    }
    // check if import already
    if (!varsMap[importVar]) {
      setVarsMap(options.varsMap, importVar, useType);
      // TODO check useType
      importCode += `import ${importPath} from "${GLOBAL_PACKAGE_URL}";\n`;
      runtimeImportCode +=
        `const ${importPath} = ${RUNTIME_FUNCTION_OPTIONS_NAME}.globals;\n`;
      debugLog += `use { ${green(use)} } from "globals/mod.ts"`;
    }
  } else if (
    use && get(globalThis, use) &&
    typeof get(globalThis, use) === "function"
  ) {
    // global runtime use
    // do not need to import
    debugLog += `use ${green(use)}`;
    // deno-lint-ignore ban-types
    const fn = get(globalThis, use) as Function;
    // check type
    if (isAsyncFunction(fn)) {
      useType = UseType.AsyncRuntimeFunction;
    } else {
      useType = UseType.RuntimeFunction;
    }
  } else {
    if (use) {
      // not found use
      log.fatal(
        `can't found function ${green(use)}, did you forget \`${
          green(
            "from",
          )
        }\` param?`,
      );
    } else {
      // ignore, no use.
    }
  }
  return {
    use: use,
    useType: useType,
    from,
    importCode,
    runtimeImportCode,
    debugLog,
    tasksOptions: options,
  };
}
function transformIf(
  task: StrictTask,
  options: StrictTasksOptions,
): LiteralCode {
  const { if: rawIf } = task;
  const literalCode: LiteralCode = {
    mainFunctionBody: "",
  };
  const mainIndent = options.indent;
  if (rawIf === true || rawIf === undefined) {
    // dont generate any code
  } else if (typeof rawIf === "string") {
    const conditionCompiledResult = getConditionResult(rawIf, options.public);
    if (
      typeof conditionCompiledResult === "boolean" &&
      conditionCompiledResult === true
    ) {
      // no need to generate code
    } else {
      literalCode.mainFunctionBody += `if (${conditionCompiledResult}) {\n`;
      // TODO add transform use

      literalCode.isNeedCloseBlock = true;
    }
  } else {
    // invalid
    throw new Error(
      `invalid if condition: ${rawIf}, you can only use boolean or string`,
    );
  }
  literalCode.mainFunctionBody = withIndent(
    literalCode.mainFunctionBody!,
    mainIndent,
  );
  return literalCode;
}
function transformLoop(
  task: StrictTask,
  options: StrictTasksOptions,
): LiteralCode {
  const { loop: rawLoop } = task;
  const mainIndent = options.indent;
  const literalCode: LiteralCode = {
    mainFunctionBody: "",
    mainFunctionBodyTop: "",
  };

  // start build function body
  if (rawLoop && typeof rawLoop === "string" && rawLoop.trim()) {
    // consider as direct literal code
    const arrayLiberal = convertValueToLiteral(rawLoop, options.public);
    literalCode.mainFunctionBody +=
      `for(let index = 0; index < ${arrayLiberal}.length; index++){
  const item = ${arrayLiberal}[index];\n`;
    // transform use call
    const useCallResult = transformUseCall(task, {
      ...options,
      indent: options.indent,
    });
    concatLiteralCode(literalCode, useCallResult);
    literalCode.mainFunctionBody += `}\n`;
  } else if (rawLoop && Array.isArray(rawLoop)) {
    // loop array
    // compiled loop
    for (let i = 0; i < rawLoop.length; i++) {
      literalCode.mainFunctionBody += `{
  const item = ${convertValueToLiteral(rawLoop[i], options.public)};
  const index = ${i};\n`;
      // transform useCall
      const useCallResult = transformUseCall(task, {
        ...options,
        indent: options.indent,
      });
      concatLiteralCode(literalCode, useCallResult);

      literalCode.mainFunctionBody += `}\n`;
    }
  } else {
    throw new Error("invalid loop params");
  }

  literalCode.mainFunctionBody = withIndent(
    literalCode.mainFunctionBody!,
    mainIndent,
  );
  literalCode.mainFunctionBodyTop = withIndent(
    literalCode.mainFunctionBodyTop!,
    mainIndent,
  );
  return literalCode;
}

function transformUseCall(
  task: StrictTask,
  options: StrictTasksOptions,
): LiteralCode {
  let mainFunctionBody = "";
  let mainFunctionBodyTop = "";
  const { args, use, useType } = task;
  const { indent } = options;
  // check if it's setVars
  // if it's setVars
  if (use === "setVars") {
    if (args && args.length === 1 && isObject(args[0])) {
      if (!Array.isArray(args[0])) {
        const keys = Object.keys(args[0] as Record<string, unknown>);
        for (const key of keys) {
          mainFunctionBody += `const ${key}=${
            convertValueToLiteral(
              (args[0] as Record<string, unknown>)[key],
              options.public,
            )
          };\n`;
        }
      } else {
        throw new Error("invalid args, setVars args must be object");
      }
    } else {
      // invalid setVars
      throw new Error("invalid args, setVars args must be object");
    }
  } else if (use === "setGlobalVars") {
    if (args && args.length === 1 && isObject(args[0])) {
      if (!Array.isArray(args[0])) {
        const keys = Object.keys(args[0] as Record<string, unknown>);
        for (const key of keys) {
          mainFunctionBodyTop += `let ${key} = null;\n`;
          mainFunctionBody += `${key} = ${
            convertValueToLiteral(
              (args[0] as Record<string, unknown>)[key],
              options.public,
            )
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
    // check if use is command
    if (useType === UseType.Command) {
      const command = task.command!;
      const { args } = task;
      const argsFlatten = args.map((
        arg,
      ) => (convertValueToLiteral(arg, options.public)))
        .join(",");

      mainFunctionBody =
        `const ${task.use} =  __yamlscript_create_process(${argsFlatten});
result = await ${task.use}\`${command}\`;\n`;
    } else if (use) {
      // consider as function
      // array, then put args to literal args
      // constructor.name
      const argsFlatten = args.map((
        arg,
      ) => (convertValueToLiteral(arg, options.public)))
        .join(",");
      mainFunctionBody +=
        `${contextConfig.lastTaskResultName} = await ${use}(${argsFlatten});\n`;
    }
  }
  mainFunctionBody = withIndent(mainFunctionBody, indent);
  // always 2;
  mainFunctionBodyTop = withIndent(mainFunctionBodyTop, 2);
  return {
    mainFunctionBodyTop,
    mainFunctionBody,
  };
}

function parseBuildIf(ifValue: boolean | string | undefined): boolean {
  if (ifValue === false) {
    return false;
  } else if (ifValue === true) {
    return true;
  } else if (ifValue === undefined) {
    return true;
  } else {
    return false;
    // const ifLiteral = convertValueToLiteral(ifValue);
  }
}

/**
 * !! this function has an affect on the options.varsMap
 * @param varsMap
 * @param importVar
 * @returns
 */
function setVarsMap(
  varsMap: Record<string, UseType>,
  importVar: string,
  importVarType: UseType,
) {
  if (varsMap[importVar]) {
    throw new Error(`duplicate  var name ${importVar}`);
  } else {
    varsMap[importVar] = importVarType;
  }
}
function formatLiteralCode(result: LiteralCode): StrictLiteralCode {
  return {
    mainFunctionBody: result.mainFunctionBody ?? "",
    mainFunctionBodyTop: result.mainFunctionBodyTop ?? "",
    debugLog: result.debugLog ?? "",
    infoLog: result.infoLog ?? "",
    importCode: result.importCode ?? "",
    runtimeImportCode: result.runtimeImportCode ?? "",
    functions: result.functions ?? [],
    subTasks: result.subTasks ?? [],
    tasksOptions: result.tasksOptions
      ? getDefaultTasksOptions(result.tasksOptions)
      : getDefaultTasksOptions({}),
  };
}

function getDefaultTasksOptions(
  tasksOptions: TasksOptions,
): StrictTasksOptions {
  return {
    ...tasksOptions,
    public: tasksOptions.public ?? getDefaultPublicContext(),
    indent: tasksOptions.indent ?? 0,
    varsMap: tasksOptions.uniqueVars ?? {},
  };
}
function getDefaultTaskOptions(
  task: Task,
  options: GetDefaultTaskOptionsOptions,
): StrictTask {
  const { args: rawArgs } = task;
  let argsArray: unknown[] = [];
  if (rawArgs && !Array.isArray(rawArgs)) {
    argsArray = [rawArgs];
  } else if (Array.isArray(rawArgs)) {
    argsArray = rawArgs;
  }
  return {
    ...task,
    args: argsArray,
    taskIndex: options.taskIndex,
    useType: UseType.Default,
  };
}

function withIndent(code: string, indent: number): string {
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

function getImportPathValue(use: string): string[] {
  let importPath = `{ ${use} }`;
  let importVar = use;
  const useDotIndex = use.indexOf(".");
  // test if use include ., like rss.entries, _.get
  if (useDotIndex > 0) {
    importVar = use.slice(0, useDotIndex);
    importPath = `{ ${use.slice(0, useDotIndex)} }`;
  }
  return [importPath, importVar];
}

export function buildTasks(
  tasks: Task[],
  options: BuildTasksOptions,
): Promise<BuiltCode> {
  const codeResult = compileTasks(tasks, options);
  return createDistFile(codeResult, options);
}
export function runTasks(tasks: Task[], options?: RunTasksOptions) {
  options = options ?? {};
  const codeResult = compileTasks(tasks, options);
  return runAsyncFunction(codeResult.runtimeFunctionBodyCode);
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
  const runtimeFunctionBodyCode =
    `${fileCode.runtimeImportCode}\n${fileCode.mainFunctionBody}`;
  const runtimeFileCode =
    `export default async function main() {\n${runtimeFunctionBodyCode}\n}
if (import.meta.main) {
  main();
}`;
  const compiledModuleCode = fileCode.importCode +
    `export default async function main(){\n${fileCode.mainFunctionBody}}
if (import.meta.main) {
  main();
}`;
  return {
    moduleFileCode: compiledModuleCode,
    runtimeFunctionBodyCode,
    runtimeFileCode,
  };
}

// affect function
function concatFileCode(fileCode: FileCode, literalCode: LiteralCode): void {
  const strickLiteralCode = formatLiteralCode(literalCode);
  fileCode.importCode += strickLiteralCode.importCode;
  fileCode.runtimeImportCode += strickLiteralCode.runtimeImportCode;
  if (strickLiteralCode.mainFunctionBodyTop) {
    fileCode.mainFunctionBody = strickLiteralCode.mainFunctionBodyTop +
      fileCode.mainFunctionBody;
  }

  fileCode.mainFunctionBody += strickLiteralCode.mainFunctionBody;
}
// affect function
function concatLiteralCode(l1: LiteralCode, l2: LiteralCode): void {
  l1.mainFunctionBody = l1.mainFunctionBody ?? "";
  l1.mainFunctionBodyTop = l1.mainFunctionBodyTop ?? "";
  l1.debugLog = l1.debugLog ?? "";
  l1.infoLog = l1.infoLog ?? "";
  l1.importCode = l1.importCode ?? "";
  l1.runtimeImportCode = l1.runtimeImportCode ?? "";
  l1.functions = l1.functions ?? [];
  l1.subTasks = l1.subTasks ?? [];
  l1.tasksOptions = l1.tasksOptions
    ? getDefaultTasksOptions(l1.tasksOptions)
    : getDefaultTasksOptions({});

  const strickLiteralCode2 = formatLiteralCode(l2);
  l1.importCode += strickLiteralCode2.importCode;
  l1.runtimeImportCode += strickLiteralCode2.runtimeImportCode;
  l1.mainFunctionBodyTop += strickLiteralCode2.mainFunctionBodyTop;
  l1.mainFunctionBody += strickLiteralCode2.mainFunctionBody;
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

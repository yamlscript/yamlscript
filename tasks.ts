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
  LiteralCode,
  StrictLiteralCode,
  StrictTask,
  StrictTasksOptions,
  TasksCode,
} from "./_interface.ts";

import {
  compile,
  convertValueToLiteral,
  getCommandProgram,
  getConditionResult,
  isCommand,
  isVariable,
} from "./template.ts";
import * as globals from "./globals/mod.ts";
import {
  createDistFile,
  get,
  getDefaultPublicContext,
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
    // transform main function body
    if (importResult.tasksOptions) {
      options = importResult.tasksOptions;
    }
    const ifResult = transformIf(task, options);
    concatFileCode(fileCode, ifResult);

    let isNeedCloseBlock = ifResult.isNeedCloseBlock;
    // add Indent TODO: add indent to all code

    // check if loop
    if (rawLoop) {
      const loopResult = transformLoop(task, {
        ...options,
        indent: mainIndent,
      });
      concatFileCode(fileCode, loopResult);
    } else {
      const useCallResult = transformUseCall(task, {
        ...options,
        indent: mainIndent,
      });
      concatFileCode(fileCode, useCallResult);
    }

    if (isNeedCloseBlock) {
      fileCode.mainFunctionBody += `}\n`;
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
): LiteralCode {
  const { from: rawFrom, use: rawUse } = task;
  const options = {
    ...originalOptions,
  };
  const varsMap = {
    ...options.varsMap,
  };
  const usesMap = {
    ...options.usesMap,
  };
  options.varsMap = varsMap;
  options.usesMap = usesMap;
  let importCode = "";
  let runtimeImportCode = "";
  let use = "";
  if (rawUse && rawUse.trim() !== "") {
    const useTemplateFn = compile(rawUse, COMPILED_CONTEXT_KEYS);
    use = useTemplateFn(options.public) as string;
  }

  if (use === "setVars" || use === "setGlobalVars") {
    // no more import
    usesMap[use] = { type: UseType.SetVars };
    return { use: use, tasksOptions: options };
  } else if (isCommand(use)) {
    usesMap[use] = { type: UseType.Command };
    importCode =
      `import { __yamlscript_run_cmd } from "${GLOBAL_RUNTIME_CMD_PACKAGE_URL}";\n`;
    runtimeImportCode =
      `const { __yamlscript_run_cmd } = await import("${GLOBAL_RUNTIME_CMD_PACKAGE_URL}");\n`;
    setVarsMap(varsMap, "__yamlscript_run_cmd");
    return { use: use, tasksOptions: options, importCode, runtimeImportCode };
  } else if (isVariable(use)) {
    // if it's variable, then it's a runtime function, just use it
    // but we don't know if it's a async or not, we can assume it's async, // TODO  or maybe we can add a sync option to specify it's sync
    usesMap[use] = { type: UseType.AsyncRuntimeFunction };
    return { use: use, tasksOptions: options };
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
      setVarsMap(options.varsMap, importVar);
      // TODO: check function type
      // async or other
      usesMap[use] = { type: UseType.Default };
      debugLog += `use ${green(importPath)} from {${from}}`;
    }
  } else if (use && get(globals, use)) {
    //
    const importPathValue = getImportPathValue(use);
    const importPath = importPathValue[0];
    const importVar = importPathValue[1];

    // check if import already
    if (!varsMap[importVar]) {
      setVarsMap(options.varsMap, importVar);
      // TODO check useType
      usesMap[use] = { type: UseType.Default };
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
  let mainFunctionBody = "";
  const mainIndent = options.indent;
  if (rawIf === true) {
    // dont generate any code
    return { mainFunctionBody };
  } else if (rawIf === undefined) {
    // no if, just return
    return { mainFunctionBody };
  } else if (typeof rawIf === "string") {
    const conditionCompiledResult = getConditionResult(rawIf, options.public);
    if (
      typeof conditionCompiledResult === "boolean" &&
      conditionCompiledResult === true
    ) {
      return { mainFunctionBody };
    } else {
      mainFunctionBody += `if (${conditionCompiledResult}) {\n`;

      return {
        mainFunctionBody,
        isNeedCloseBlock: true,
      };
    }
  } else {
    // invalid
    throw new Error(
      `invalid if condition: ${rawIf}, you can only use boolean or string`,
    );
  }
}
function transformLoop(
  task: StrictTask,
  options: StrictTasksOptions,
): LiteralCode {
  const { loop: rawLoop } = task;
  let mainFunctionBody = "";
  let importCode = "";
  let runtimeImportCode = "";
  const mainIndent = options.indent;
  // start build function body
  if (rawLoop && typeof rawLoop === "string" && rawLoop.trim()) {
    // consider as direct literal code
    const arrayLiberal = convertValueToLiteral(rawLoop, options.public);
    mainFunctionBody +=
      `for(let index = 0; index < ${arrayLiberal}.length; index++){
  const item = ${arrayLiberal}[index];\n`;
    // transform use call
    const useCallResult = transformUseCall(task, {
      ...options,
      indent: options.indent,
    });
    // TODO import code
    mainFunctionBody += useCallResult.mainFunctionBody;
    importCode += useCallResult.importCode;
    runtimeImportCode += useCallResult.runtimeImportCode;
    mainFunctionBody += `}\n`;
  } else if (rawLoop && Array.isArray(rawLoop)) {
    // loop array
    // compiled loop
    for (let i = 0; i < rawLoop.length; i++) {
      mainFunctionBody += `{
  const item = ${convertValueToLiteral(rawLoop[i], options.public)};
  const index = ${i};\n`;
      // transform useCall
      const useCallResult = transformUseCall(task, {
        ...options,
        indent: options.indent,
      });
      mainFunctionBody += useCallResult.mainFunctionBody;

      mainFunctionBody += `}\n`;
    }
  } else {
    throw new Error("invalid loop params");
  }

  mainFunctionBody = withIndent(mainFunctionBody, mainIndent);
  return {
    mainFunctionBody,
    importCode,
    runtimeImportCode,
  };
}

function transformUseCall(
  task: StrictTask,
  options: StrictTasksOptions,
): LiteralCode {
  let mainFunctionBody = "";
  let importCode = "";
  let runtimeImportCode = "";
  const { args, use } = task;
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
          const setGlobalVarsCode = `const ${key}=${
            convertValueToLiteral(
              (args[0] as Record<string, unknown>)[key],
              options.public,
            )
          };\n`;
          importCode += setGlobalVarsCode;
          runtimeImportCode += setGlobalVarsCode;
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
    if (isCommand(use)) {
      mainFunctionBody += transformCommandCall(task, options).mainFunctionBody;
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
  return {
    mainFunctionBody,
    importCode,
    runtimeImportCode,
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
  varsMap: Record<string, boolean>,
  importVar: string,
) {
  if (varsMap[importVar]) {
    throw new Error(`duplicate  var name ${importVar}`);
  } else {
    varsMap[importVar] = true;
  }
}
function formatLiteralCode(result: LiteralCode): StrictLiteralCode {
  return {
    use: result.use ?? "",
    from: result.from ?? "",
    mainFunctionBody: result.mainFunctionBody ?? "",
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
    usesMap: tasksOptions.usesMap ?? {},
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

function transformCommandCall(
  task: StrictTask,
  options: StrictTasksOptions,
): LiteralCode {
  let cmdArrayString = `"${getCommandProgram(task.use)}"`;
  const { args } = task;

  if (args.length > 0) {
    cmdArrayString += ",";
    cmdArrayString += args.map((
      arg,
    ) => (convertValueToLiteral(arg, options.public)))
      .join(",");
  }

  const mainFunctionBody = `__yamlscript_run_cmd(${cmdArrayString});\n`;
  return { mainFunctionBody };
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
    `async function main() {\n${runtimeFunctionBodyCode}\n}\nmain();`;
  const compiledModuleCode = fileCode.importCode +
    `export default async function main(){\n${fileCode.mainFunctionBody}}`;
  return {
    moduleFileCode: compiledModuleCode,
    runtimeFunctionBodyCode,
    runtimeFileCode,
    runFileCode: compiledModuleCode,
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

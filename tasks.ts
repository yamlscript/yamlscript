import {
  BuildTasksOptions,
  ParentType,
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
  MetaResult,
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
  getDistFilePath,
  isAsyncFunction,
  isObject,
} from "./util.ts";
import {
  COMPILED_CONTEXT_KEYS,
  DEFAULT_USE_NAME,
  DEFINE_FUNCTION_TOKEN,
  DEFINE_GLOBAL_VARIABLE_TOKEN,
  DEFINE_VARIABLE_TOKEN,
  DEV_FLAG,
  GLOBAL_PACKAGE_URL,
  GLOBAL_RUNTIME_CMD_PACKAGE_URL,
  LAST_TASK_RESULT_NAME,
  LOOP_ITEM_INDEX_NAME,
  LOOP_ITEM_NAME,
  LOOP_VARIABLE_NAME,
  RUNTIME_FUNCTION_OPTIONS_NAME,
} from "./constant.ts";
import log from "./log.ts";
import { dirname, fromFileUrl, green, relative, resolve } from "./deps.ts";
import config from "./config.json" assert { type: "json" };
export function getCompiledCode(
  tasks: Task[],
  originalOptions: TasksOptions,
): TasksCode {
  log.debug("run single options", JSON.stringify(originalOptions, null, 2));
  const options = getDefaultTasksOptions(originalOptions);
  // for precompiled code to import modules
  const fileCode = getInitialFileCode();
  const mainIndent = options.indent + 2;
  // one by one
  for (let taskIndex = 0; taskIndex < tasks.length; taskIndex++) {
    const originalTask = tasks[taskIndex];
    const task = getDefaultTaskOptions(originalTask, {
      taskIndex,
    });
    const { loop: rawLoop, if: rawIf, name: rawName, id: rawId } = task;
    // transfor name

    task.name = convertValueToLiteral(rawName || rawId || "", options.public);
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
    const importResult = transformMeta(task, options);
    concatFileCode(fileCode, importResult);
    // change use to final value
    task.use = importResult.use as string;
    task.from = importResult.from as string;
    task.useType = importResult.useType;
    task.command = importResult.command;
    // transform main function body

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

    // add success print
    fileCode.mainFunctionBody += appendPrintInfo(
      `"Task #${taskIndex} done.${task.name ? ' %s", ' : '"'}${task.name}`,
      {
        ...options,
        indent: mainIndent,
      },
    );

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
function transformMeta(
  task: StrictTask,
  options: StrictTasksOptions,
): MetaResult {
  const { from: rawFrom, use: rawUse, id: rawId } = task;

  const varsMap = options.varsMap;

  let importCode = "";
  let runtimeImportCode = "";
  let use = templateCompiledString(rawUse, options.public);
  let useType = UseType.Default;
  let command: string | undefined;
  let from: string | undefined;
  let debugLog = "";
  let id: string | undefined;
  if (rawId) {
    const idString = templateCompiledString(rawId, options.public);
    id = idString;
  }

  if (
    use === DEFINE_VARIABLE_TOKEN
  ) {
    // no more import
    useType = UseType.DefineVariable;
  } else if (use === DEFINE_GLOBAL_VARIABLE_TOKEN) {
    useType = UseType.DefineGlobalVariable;
  } else if (use === DEFINE_FUNCTION_TOKEN) {
    useType = UseType.DefineFunction;
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
    command = getCommand(use);
    useType = UseType.Command;
    use = newUse;
    importCode += `const ${newUse} = ${command};\n`;
  } else if (isVariable(use)) {
    // if it's variable, then it's a runtime function, just use it
    // but we don't know if it's a async or not, we can assume it's async, // TODO  or maybe we can add a sync option to specify it's sync
    // TODO consider better check
    useType = UseType.AsyncRuntimeFunction;
  } else {
    // add compile code
    if (rawFrom) {
      const fromString = templateCompiledString(rawFrom, options.public);
      from = fromString;
      let importPath = "";
      let runtimeImportPath = "";
      let importVar = "";
      if (!use || use === "default" || use.startsWith("default.")) {
        // default
        // use if empty, we will give it a default random name
        if (use.startsWith("default.")) {
          importVar = DEFAULT_USE_NAME + "_" + task.taskIndex;
          use = importVar +
            use.slice("default".length);
        } else {
          use = DEFAULT_USE_NAME + "_" + task.taskIndex;
          importVar = use;
        }
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

        if (
          Deno.env.get(DEV_FLAG) && Deno.env.get(DEV_FLAG) !== "false" &&
          options.relativePath && options.dist
        ) {
          // for dev
          // get relative path
          const currentDirname = dirname(fromFileUrl(import.meta.url));
          const globalModFilePath = resolve(currentDirname, "./globals/mod.ts");

          const targetPath = getDistFilePath(
            options.relativePath,
            ".js",
            options.dist,
          );
          const relativeGlobalModFilePath = relative(
            dirname(targetPath),
            globalModFilePath,
          );

          importCode +=
            `import ${importPath} from "${relativeGlobalModFilePath}";\n`;
        } else {
          importCode += `import ${importPath} from "${GLOBAL_PACKAGE_URL}";\n`;
        }

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
        // consider as user custom runtime function
        useType = UseType.AsyncRuntimeFunction;
        // log.fatal(
        //   `can't found function ${green(use)}, did you forget \`${
        //     green(
        //       "from",
        //     )
        //   }\` param?`,
        // );
      } else {
        // ignore, no use.
      }
    }
  }
  return {
    id,
    use,
    from,
    importCode,
    runtimeImportCode,
    useType,
    command,
    debugLog,
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
  const { loop: rawLoop, id } = task;
  const mainIndent = options.indent;
  const literalCode: LiteralCode = {
    mainFunctionBody: "",
    mainFunctionBodyTop: "",
  };
  const tempParentType = options.parentType;
  options.parentType = ParentType.Loop;
  // check if loop has a id
  if (id) {
    literalCode.mainFunctionBody += `let ${id} = [];\n`;
  }
  // start build function body
  if (rawLoop && typeof rawLoop === "string" && rawLoop.trim()) {
    // consider as direct literal code
    const arrayLiberal = convertValueToLiteral(rawLoop, options.public);
    literalCode.mainFunctionBody +=
      `${LOOP_ITEM_INDEX_NAME} = 0;\nfor await (const ${LOOP_ITEM_NAME} of ${arrayLiberal}){\n`;
    // transform use call
    const useCallResult = transformUseCall(task, {
      ...options,
      indent: options.indent,
    });
    concatLiteralCode(literalCode, useCallResult);
    literalCode.mainFunctionBody += `${LOOP_ITEM_INDEX_NAME}++;\n`;
    literalCode.mainFunctionBody += `}\n${LOOP_ITEM_INDEX_NAME}=undefined;\n`;
  } else if (rawLoop && Array.isArray(rawLoop)) {
    // loop array
    // compiled loop
    for (let i = 0; i < rawLoop.length; i++) {
      literalCode.mainFunctionBody += `{
  const ${LOOP_ITEM_NAME} = ${
        convertValueToLiteral(rawLoop[i], options.public)
      };
  const ${LOOP_ITEM_INDEX_NAME} = ${i};\n`;
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
  options.parentType = tempParentType;
  return literalCode;
}

function transformUseCall(
  task: StrictTask,
  options: StrictTasksOptions,
): LiteralCode {
  let mainFunctionBody = "";
  let mainFunctionBodyTop = "";
  let importCode = "";
  let runtimeImportCode = "";
  const { args, use, useType, id } = task;
  const { indent } = options;

  const varsMap = options.varsMap;

  // check if it's def
  if (
    useType === UseType.DefineVariable
  ) {
    // if it's def
    if (args && args.length === 1 && isObject(args[0])) {
      if (!Array.isArray(args[0])) {
        const keys = Object.keys(args[0] as Record<string, unknown>);
        for (const key of keys) {
          if (varsMap[key]) {
            // overwrite it
            mainFunctionBody += `${key} = ${
              convertValueToLiteral(
                (args[0] as Record<string, unknown>)[key],
                options.public,
              )
            };\n`;
          } else {
            mainFunctionBody += `let ${key} = ${
              convertValueToLiteral(
                (args[0] as Record<string, unknown>)[key],
                options.public,
              )
            };\n`;
          }
        }
      } else {
        throw new Error("invalid args, def args must be object");
      }
    }
  } else if (useType === UseType.DefineGlobalVariable) {
    const globalVars: string[] = [];
    if (args && args.length === 1 && isObject(args[0])) {
      if (!Array.isArray(args[0])) {
        const keys = Object.keys(args[0] as Record<string, unknown>);
        for (const key of keys) {
          // check if it already exists

          if (varsMap[key]) {
            throw new Error(`global variable ${key} already exists`);
          } else {
            globalVars.push(key);
            mainFunctionBodyTop += `let ${key} = null;\n`;
            mainFunctionBody += `${key} = ${
              convertValueToLiteral(
                (args[0] as Record<string, unknown>)[key],
                options.public,
              )
            };\n`;
          }
        }
      } else {
        throw new Error("invalid args, def args must be object");
      }
    }
    globalVars.forEach((key) => {
      setVarsMap(
        varsMap,
        key,
        UseType.DefineGlobalVariable,
      );
    });
  } else if (useType === UseType.DefineFunction) {
    // check required id
    if (!id) {
      throw new Error(
        "define function must have id, id will be the function's name",
      );
    } else {
      mainFunctionBody += `async function ${id}(...args){\n`;

      // insert function body
      // check args

      const functionResult = getCompiledCode(args as Task[], options);
      // merge result
      mainFunctionBody += functionResult.mainFunctionBody;
      importCode += functionResult.importCode;
      runtimeImportCode += functionResult.runtimeImportCode;
      // add return
      mainFunctionBody += `return result;\n`;
      // insert end block
      mainFunctionBody += "}\n";
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
${LAST_TASK_RESULT_NAME} = await ${task.use}\`${command}\`;\n`;
      mainFunctionBody += assignId(task, options);
    } else if (use) {
      // consider as function
      // array, then put args to literal args
      // constructor.name
      const argsFlatten = args.map((
        arg,
      ) => (convertValueToLiteral(arg, options.public)))
        .join(",");
      mainFunctionBody +=
        `${LAST_TASK_RESULT_NAME} = await ${use}(${argsFlatten});\n`;
      mainFunctionBody += assignId(task, options);
    }
  }

  // check if need to catch error
  if (task.catch) {
    mainFunctionBody = `try {\n${
      withIndent(mainFunctionBody, 2)
    }} catch (_error) {\n  // ignore\n}\n`;
  }

  mainFunctionBody = withIndent(mainFunctionBody, indent);

  // always 2;
  mainFunctionBodyTop = withIndent(mainFunctionBodyTop, 2);
  return {
    mainFunctionBodyTop,
    mainFunctionBody,
    importCode,
    runtimeImportCode,
  };
}
function assignId(task: Task, options: StrictTasksOptions) {
  if (task.id) {
    const { id } = task;
    if (id) {
      // check current parent type

      if (options.parentType === ParentType.Loop) {
        // the result should be push to the array
        return `${id}.push(${LAST_TASK_RESULT_NAME});\n`;
      } else {
        return `const ${id} = ${LAST_TASK_RESULT_NAME};\n`;
      }
    }

    return "";
  } else {
    return "";
  }
}
function appendPrintInfo(message: string, options: StrictTasksOptions): string {
  const { indent } = options;
  return `${
    withIndent(
      `console.log(${message});\n`,
      indent,
    )
  }`;
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
  };
}

function getDefaultTasksOptions(
  tasksOptions?: TasksOptions,
): StrictTasksOptions {
  tasksOptions = tasksOptions || {};
  return {
    ...tasksOptions,
    public: tasksOptions.public ?? getDefaultPublicContext(),
    indent: tasksOptions.indent ?? 0,
    varsMap: tasksOptions.varsMap ?? {},
    parentType: tasksOptions.parentType ?? ParentType.Root,
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
    catch: task.catch ?? false,
    name: task.name ?? "",
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
  const codeResult = getCompiledCode(tasks, options);
  return createDistFile(codeResult, options);
}
export function runTasks(tasks: Task[], options?: RunTasksOptions) {
  options = options ?? {};
  const codeResult = getCompiledCode(tasks, options);
  return runAsyncFunction(codeResult.runtimeFunctionBodyCode);
}
export function runAsyncFunction(runtimeCode: string) {
  // run
  const AsyncFunction = Object.getPrototypeOf(
    async function () {},
  ).constructor;
  try {
    const runtimeFn = new AsyncFunction(
      RUNTIME_FUNCTION_OPTIONS_NAME,
      runtimeCode,
    );
    return runtimeFn({
      globals: globals,
    });
  } catch (error) {
    error.message =
      `Run generated tasks code failed, ${error.message}\nFor more details, you can run \`ys build <file>\` command to check out the generated code`;
    log.fatal(error.message);
  }
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
    ...fileCode,
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

  const strickLiteralCode2 = formatLiteralCode(l2);
  l1.importCode += strickLiteralCode2.importCode;
  l1.runtimeImportCode += strickLiteralCode2.runtimeImportCode;
  l1.mainFunctionBodyTop += strickLiteralCode2.mainFunctionBodyTop;
  l1.mainFunctionBody += strickLiteralCode2.mainFunctionBody;
}
function getInitialFileCode(): FileCode {
  const importCode = "";
  // for runtime code to import modules
  const runtimeImportCode = "";
  const mainFunctionBody =
    `  let ${LAST_TASK_RESULT_NAME} = null, ${LOOP_ITEM_INDEX_NAME} = undefined;\n`;
  return {
    importCode,
    runtimeImportCode,
    mainFunctionBody,
  };
}
function templateCompiledString(
  str: string | undefined,
  ctx: Record<string, unknown>,
): string {
  if (str && str.trim() !== "") {
    const templateFn = compile(str, Object.keys(ctx));
    str = templateFn(ctx) as string;
    return str;
  } else {
    return str || "";
  }
}

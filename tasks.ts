import {
  Dependency,
  DependencyType,
  ParentType,
  Task,
  TasksContext,
  UseType,
} from "./interface.ts";
import {
  BuiltCode,
  ConcatFileCodeOptions,
  FileCode,
  GetDefaultTaskOptionsOptions,
  LiteralCode,
  MetaResult,
  ParseUseResult,
  StrictLiteralCode,
  StrictTask,
  StrictTasksContext,
  TasksCode,
  TasksResult,
} from "./_interface.ts";

import {
  compile,
  convertValueToLiteral,
  getCommand,
  getConditionResult,
  isCommand,
  isVariable,
  removeRootQuotes,
  templateWithKnownKeys,
  variableValueToVariable,
} from "./template.ts";
import * as globals from "./globals/mod.ts";
import {
  createDistFile,
  formatImportCode,
  get,
  getDefaultPublicContext,
  getGlobalsCode,
  getGlobalsFrom,
  groupBy,
  isAsyncFunction,
  parseYamlFile,
  withIndent,
} from "./util.ts";
import pkg from "./pkg.json" assert { type: "json" };
import {
  DEFAULT_FILE_NAME,
  DEFAULT_USE_NAME,
  DEFINE_FUNCTION_TOKEN,
  DEFINE_GLOBAL_VARIABLE_TOKEN,
  DEFINE_VARIABLE_TOKEN,
  GLOBAL_RUNTIME_CMD_PACKAGE_URL,
  IMPORT_TOKEN,
  LAST_TASK_RESULT_NAME,
  LOOP_ITEM_INDEX_NAME,
  LOOP_ITEM_NAME,
  RETURN_TOKEN,
  RUNTIME_FUNCTION_OPTIONS_NAME,
} from "./constant.ts";
import log from "./log.ts";
import { dirname, green, relative, resolve } from "./deps.ts";
export function getCompiledCode(
  tasks: Task[],
  originalOptions: TasksContext,
): TasksResult {
  // log.debug("run single options", JSON.stringify(originalOptions, null, 2));
  const options = getDefaultTasksContext(originalOptions);
  // for precompiled code to import modules
  const fileCode = getInitialFileCode(options);
  const mainIndent = options.indent;
  // one by one
  const tasksMetaResults: MetaResult[] = [];
  const parentId = options.parentId;
  for (let taskIndex = 0; taskIndex < tasks.length; taskIndex++) {
    const originalTask = tasks[taskIndex];
    const taskId = `${parentId ? parentId + "_" : ""}${taskIndex}`;
    const task = getDefaultTaskOptions(originalTask, {
      taskId,
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
    const metaResult = transformMeta(task, options);
    tasksMetaResults.push(metaResult);
    concatFileCode(fileCode, metaResult, { indent: mainIndent });
    // change use to final value
    task.use = metaResult.use as string;
    task.from = metaResult.from as string;
    task.useType = metaResult.useType;
    task.command = metaResult.command;
    task.isInstance = metaResult.isInstance;
    // transform main function body
    // add empty line for pretty
    fileCode.mainFunctionBodyCode += "\n";

    // add comment

    const taskName = task.name
      ? (": " + removeRootQuotes(task.name))
      : task.id
      ? (": " + removeRootQuotes(task.id))
      : "";
    const commentSuffix = withIndent(
      taskName,
      mainIndent,
    );
    fileCode.mainFunctionBodyCode += withIndent(
      `// Task #${task.taskId}${commentSuffix}\n`,
      mainIndent,
    );

    const ifResult = transformIf(task, options);
    concatFileCode(fileCode, ifResult, { indent: mainIndent });

    const isNeedCloseBlock = ifResult.isNeedCloseBlock;

    // check if loop
    if (rawLoop) {
      const loopResult = transformLoop(task, options);
      concatFileCode(fileCode, loopResult, {
        indent: isNeedCloseBlock ? mainIndent + 2 : mainIndent,
      });
    } else {
      const useCallResult = transformUseCall(task, options);
      concatFileCode(fileCode, useCallResult, {
        indent: isNeedCloseBlock ? mainIndent + 2 : mainIndent,
      });
    }

    // add success print
    // TODO: add condition verbose
    if (options.verbose) {
      fileCode.mainFunctionBodyCode += `console.log("Task #${taskIndex} done.${
        task.name ? ' %s", ' : '"'
      }${task.name});\n`;
    }

    if (isNeedCloseBlock) {
      fileCode.mainFunctionBodyCode += withIndent(`}\n`, mainIndent);
    }
  }
  return { ...getTasksCode(fileCode), tasksMetaResults };
}

function transformfromUrl(fromUrl: string): string {
  if (fromUrl.startsWith(".")) {
    if (fromUrl.endsWith(".ys.yml")) {
      // from replace ext to js
      fromUrl = fromUrl.replace(/\.ys\.yml$/, ".js");
      // add compile code
      // build fromPath
      // build dependences
    }
  }
  return fromUrl;
}

export async function getDependencies(
  tasks: Task[],
  originalOptions?: TasksContext,
): Promise<Dependency[]> {
  const options = getDefaultTasksContext(originalOptions);
  let depencencies: Dependency[] = [];
  for (let taskIndex = 0; taskIndex < tasks.length; taskIndex++) {
    const { from: rawFrom } = tasks[taskIndex];
    if (rawFrom) {
      const fromString = templateCompiledString(rawFrom, options.public);

      if (fromString.startsWith(".")) {
        if (fromString.endsWith(".ys.yml")) {
          // from replace ext to js
          // add compile code
          const fromPath = resolve(dirname(options.relativePath), fromString);
          // console.log("fromPath", fromPath);
          // get depencencies recursively
          //TODO
          // continue
          let tasks: Task[] = [];
          try {
            tasks = await parseYamlFile(fromPath) as Task[];
            if (tasks === undefined) {
              tasks = [];
            } else if (!Array.isArray(tasks)) {
              throw new Error(
                `${fromPath} is not a valid ${pkg.brand} file, you should use an array to define tasks.`,
              );
            }
          } catch (error) {
            log.fatal(`parse file ${green(fromPath)} error: ${error.message}`);
          }
          if (tasks.length > 0) {
            options.relativePath = fromPath;
            depencencies = depencencies.concat(
              await getDependencies(tasks, options),
            );
          }

          // build fromPath
          // build dependences
          depencencies.push({
            path: fromPath,
            type: "source",
          });
        }
      }
    }
  }
  // unique
  const groups = groupBy(
    depencencies as unknown as Record<string, string>[],
    "type",
  );
  const uniqueGroups = Object.keys(groups).map((key) => {
    return Array.from(new Set(groups[key].map((item) => item.path))).map(
      (path) => ({ path, type: key as DependencyType } as Dependency),
    );
  });
  const finalDependencies = uniqueGroups.reduce((acc, cur) => {
    return acc.concat(cur);
  }, []);
  return finalDependencies;
}

/**
 * parse from and use
 * should check import path duplicate
 * @param raw
 */
export function transformMeta(
  task: StrictTask,
  options: StrictTasksContext,
): MetaResult {
  const { from: rawFrom, use: rawUse, id: rawId, args } = task;
  const varsMap = options.varsMap;

  let topLevelCode = "";
  let use = "";
  let useType = UseType.Default;
  let isExplicitAsync = false;
  let exportName: string | undefined;
  if (rawUse !== false) {
    if (isCommand(rawUse as string)) {
      use = removeRootQuotes(
        templateWithKnownKeys(rawUse as string, options.public),
      );
    } else {
      use = templateCompiledString(rawUse as string, options.public);
    }
  } else {
    useType = UseType.None;
  }
  let command: string | undefined;
  let from: string | undefined;
  let debugLog = "";
  let id: string | undefined;
  let isInstance = false;
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
  } else if (use === RETURN_TOKEN) {
    useType = UseType.Return;
  } else if (isCommand(use)) {
    if (!varsMap["__yamlscript_create_process"]) {
      topLevelCode = `import { __yamlscript_create_process } from "${
        getGlobalsFrom("./cmd/mod.ts", options)
      }";\n`;

      setVarsMap(
        varsMap,
        "__yamlscript_create_process",
        UseType.GlobalsFunction,
      );
    }

    const newUse = DEFAULT_USE_NAME + "_" + task.taskId;
    command = getCommand(use);
    useType = UseType.Command;
    use = newUse;
  } else if (isVariable(use)) {
    // if it's variable, then it's a runtime function, just use it
    // but we don't know if it's a async or not, we can assume it's async, // TODO  or maybe we can add a sync option to specify it's sync
    // TODO consider better check
    use = variableValueToVariable(use);
    // check is explicit async
    if (use.startsWith("await ")) {
      isExplicitAsync = true;
      useType = UseType.UserFunction;
    } else {
      useType = UseType.AsyncUserFunction;
    }
  } else {
    // check if is a instance
    if (use.startsWith("new ")) {
      // then it's a instance
      isInstance = true;
      use = use.substring(4);
    }

    if (use.startsWith("await ")) {
      isExplicitAsync = true;
      use = use.substring(6);
    }

    // parse if there is an as
    const parseUseNameResult = parseUse(use);
    if (parseUseNameResult.exportName) {
      exportName = parseUseNameResult.exportName;
      use = parseUseNameResult.use;
    }

    // add compile code
    if (rawFrom) {
      const fromString = templateCompiledString(rawFrom, options.public);

      from = transformfromUrl(fromString);

      const importPaths = [];
      const runtimeImportPaths = [];
      const importVars = [];
      if (
        use === IMPORT_TOKEN || rawUse === undefined || use === "default" ||
        use.startsWith("default.")
      ) {
        // default
        // use if empty, we will give it a default random name
        if (use.startsWith("default.")) {
          importVars.push(DEFAULT_USE_NAME + "_" + task.taskId);
          use = importVars[0] +
            use.slice("default".length);
          useType = UseType.AsyncThirdPartyFunction;
          importPaths.push(`{ default as ${importVars[0]} }`);
          runtimeImportPaths.push(`{ default: ${importVars[0]} }`);
        } else if (use === IMPORT_TOKEN && args.length === 0) {
          importVars.push(DEFAULT_USE_NAME + "_" + task.taskId);
          importPaths.push(`{ default as ${importVars[0]} }`);
          runtimeImportPaths.push(`{ default: ${importVars[0]} }`);
          useType = UseType.None;
        } else if (use === IMPORT_TOKEN && args.length > 0) {
          // loop
          useType = UseType.None;

          for (const arg of args) {
            if (typeof arg !== "string") {
              throw new Error(
                `import args must be string, ${arg} is not a string`,
              );
            }
            const argString = templateCompiledString(
              arg as string,
              options.public,
            );
            const argResult = parseUse(argString);
            if (argResult.exportName) {
              importVars.push(argResult.use);
              importPaths.push(`{ ${argString} }`);
              runtimeImportPaths.push(
                `{ ${argResult.exportName}:${argResult.use} }`,
              );
            } else {
              importVars.push(argString);
              importPaths.push(`{ ${argString} }`);
              runtimeImportPaths.push(`{ ${argString} }`);
            }
          }
        } else {
          useType = UseType.AsyncThirdPartyFunction;

          use = DEFAULT_USE_NAME + "_" + task.taskId;
          importVars.push(use);
          if (exportName) {
            importPaths.push(`{ ${exportName} as ${importVars[0]} }`);
            runtimeImportPaths.push(`{ ${exportName}: ${importVars[0]} }`);
          } else {
            importPaths.push(`{ default as ${importVars[0]} }`);
            runtimeImportPaths.push(`{ default: ${importVars[0]} }`);
          }
        }
      } else {
        if (exportName) {
          importPaths.push(`{ ${exportName} as ${use} }`);
          importVars.push(use);
          runtimeImportPaths.push(`{ ${exportName}: ${use} }`);
          useType = UseType.AsyncThirdPartyFunction;
        } else {
          const importPathValue = getImportPathValue(use);
          importPaths.push(importPathValue[0]);
          importVars.push(importPathValue[1]);
          runtimeImportPaths.push(importPaths[0]);
          useType = UseType.AsyncThirdPartyFunction;
        }
      }
      // check if import already
      for (let i = 0; i < importVars.length; i++) {
        const importVar = importVars[i];
        if (!varsMap[importVar]) {
          topLevelCode += `import ${
            importPaths[i] ? importPaths[i] + " from " : ""
          }"${from}";\n`;

          // get import var type
          // TODO, cause import is an async operation, we should consider if we should check it. now we just treat it as async operation
          if (importVar) {
            setVarsMap(
              options.varsMap,
              importVar,
              useType,
            );
          }
          // TODO: check function type
          // async or other
          debugLog += `use ${green(importPaths.join(","))} from ${from}`;
        }
      }
    } else if (use && get(globals, use)) {
      // deno-lint-ignore ban-types
      const fn = get(globals, use) as Function;

      // check if it's a async function
      if (isAsyncFunction(use, fn) || isExplicitAsync) {
        useType = UseType.AsyncGlobalsFunction;
      } else {
        useType = UseType.GlobalsFunction;
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
      if (isAsyncFunction(use, fn) || isExplicitAsync) {
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
  log.debug(debugLog);
  return {
    id,
    use,
    from,
    topLevelCode,
    useType,
    command,
    debugLog,
    isInstance,
  };
}
function transformIf(
  task: StrictTask,
  options: StrictTasksContext,
): LiteralCode {
  const { if: rawIf } = task;
  const literalCode: LiteralCode = {
    mainFunctionBodyCode: "",
  };
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
      literalCode.mainFunctionBodyCode += `if (${conditionCompiledResult}) {\n`;
      // TODO add transform use

      literalCode.isNeedCloseBlock = true;
    }
  } else {
    // invalid
    throw new Error(
      `invalid if condition: ${rawIf}, you can only use boolean or string`,
    );
  }

  return literalCode;
}
function transformLoop(
  task: StrictTask,
  options: StrictTasksContext,
): LiteralCode {
  const { loop: rawLoop, id } = task;
  const literalCode: LiteralCode = {
    mainFunctionBodyCode: "",
    postTopLevelCode: "",
  };
  if (!options.isInitIndexVariable) {
    literalCode.postTopLevelCode += `let ${LOOP_ITEM_INDEX_NAME} = 0;\n`;
    options.isInitIndexVariable = true;
  }

  const tempParentType = options.parentType;
  options.parentType = ParentType.Loop;
  // check if loop has a id
  if (id) {
    literalCode.mainFunctionBodyCode += `let ${id} = [];\n`;
  }
  // start build function body
  if (rawLoop && typeof rawLoop === "string" && rawLoop.trim()) {
    // consider as direct literal code
    const arrayLiberal = convertValueToLiteral(rawLoop, options.public);
    literalCode.mainFunctionBodyCode +=
      `for await (const ${LOOP_ITEM_NAME} of await ${arrayLiberal}){\n`;
    // transform use call
    const useCallResult = transformUseCall(task, options);
    concatLiteralCode(literalCode, useCallResult, { indent: 2 });
    literalCode.mainFunctionBodyCode += `  ${LOOP_ITEM_INDEX_NAME}++;\n`;
    literalCode.mainFunctionBodyCode += `}\n${LOOP_ITEM_INDEX_NAME}=0;\n`;
  } else if (rawLoop && Array.isArray(rawLoop)) {
    // loop array
    // compiled loop
    for (let i = 0; i < rawLoop.length; i++) {
      literalCode.mainFunctionBodyCode += `{
  const ${LOOP_ITEM_NAME} = ${
        convertValueToLiteral(rawLoop[i], options.public)
      };
  ${LOOP_ITEM_INDEX_NAME} = ${i};\n`;
      // transform useCall
      const useCallResult = transformUseCall(task, options);
      concatLiteralCode(literalCode, useCallResult, { indent: 2 });

      literalCode.mainFunctionBodyCode += `}\n`;
    }
    // index reset to 0
    literalCode.mainFunctionBodyCode += `${LOOP_ITEM_INDEX_NAME} = 0;\n`;
  } else {
    throw new Error("invalid loop params");
  }

  options.parentType = tempParentType;

  return literalCode;
}

function transformUseCall(
  task: StrictTask,
  options: StrictTasksContext,
): LiteralCode {
  let mainFunctionBodyCode = "";
  let postTopLevelCode = "";
  let topLevelCode = "";
  let functions: string[] = [];
  const { args, use, useType, id } = task;

  const varsMap = options.varsMap;

  // check if it's def
  if (useType === UseType.None) {
    // ignore;
  } else if (
    useType === UseType.DefineVariable
  ) {
    // if it's def
    if (!id) {
      // id is required
      throw new Error(
        `Task #${task.taskId}: id is required for def operation`,
      );
    }
    if (args && args.length === 1) {
      if (varsMap[id]) {
        // overwrite it
        mainFunctionBodyCode += `${id} = ${
          convertValueToLiteral(
            args[0] as Record<string, unknown>,
            options.public,
          )
        };\n`;
      } else {
        mainFunctionBodyCode += `let ${id} = ${
          convertValueToLiteral(
            args[0] as Record<string, unknown>,
            options.public,
          )
        };\n`;
      }
    } else {
      throw new Error(
        `invalid def args at task ${task.taskId}, def args can only take one param`,
      );
    }
  } else if (useType === UseType.DefineGlobalVariable) {
    if (!id) {
      // id is required
      throw new Error("id is required for def operation");
    }
    if (args && args.length === 1) {
      // check if it already exists

      if (varsMap[id]) {
        // throw new Error(`global variable ${id} already exists`);
        mainFunctionBodyCode += `${id} = ${
          convertValueToLiteral(
            args[0] as Record<string, unknown>,
            options.public,
          )
        };\n`;
      } else {
        postTopLevelCode += `let ${id} = null;\n`;
        mainFunctionBodyCode += `${id} = ${
          convertValueToLiteral(
            args[0] as Record<string, unknown>,
            options.public,
          )
        };\n`;
      }
      setVarsMap(
        varsMap,
        id,
        UseType.DefineGlobalVariable,
      );
    }
  } else if (useType === UseType.DefineFunction) {
    let functionCode = "";
    // check required id
    if (!id) {
      throw new Error(
        `Task #${task.taskId} defn operation must have an id, and id will be the function's name`,
      );
    } else {
      // add result init variable
      if (!options.isInitLastTaskResultVariable) {
        postTopLevelCode += `let ${LAST_TASK_RESULT_NAME} = null;\n`;
        options.isInitLastTaskResultVariable = true;
      }
      functionCode += `${
        task.export ? "export " : ""
      }async function ${id}(...args){\n`;

      // insert function body
      // check args
      const originalIndent = options.indent;
      options.indent = originalIndent + 2;
      const originalTaskId = task.taskId;
      options.parentId = originalTaskId;
      const originalGlobalsCode = options.globalsCode;
      options.globalsCode = "";
      const functionResult = getCompiledCode(args as Task[], options);
      functionCode += functionResult.mainFunctionBodyCode;
      options.parentId = originalTaskId;
      options.indent = originalIndent;
      options.globalsCode = originalGlobalsCode;
      // merge result
      functions = functions.concat(functionResult.functions);
      topLevelCode += functionResult.topLevelCode;
      postTopLevelCode += functionResult.postTopLevelCode;
      // add return
      // check if the latest task is alread return
      if (
        functionResult.tasksMetaResults.length > 0 &&
        functionResult
            .tasksMetaResults[functionResult.tasksMetaResults.length - 1]
            .useType !== UseType.Return
      ) {
        functionCode += `\n  return result;\n`;
      }

      // insert end block
      functionCode += "}\n";
    }
    if (task.export) {
      functions.push(functionCode);
    } else {
      mainFunctionBodyCode += functionCode;
    }
  } else if (useType === UseType.Return) {
    if (args && args.length === 1) {
      mainFunctionBodyCode += `return ${
        convertValueToLiteral(args[0], options.public)
      };\n`;
    } else if (!args || args.length === 0) {
      mainFunctionBodyCode += `return;\n`;
    } else {
      throw new Error(
        `Task #${task.taskId} return operator takes at most one argument, but got ${args.length}`,
      );
    }
  } else {
    // add result init variable
    if (!options.isInitLastTaskResultVariable) {
      postTopLevelCode += `let ${LAST_TASK_RESULT_NAME} = null;\n`;
      options.isInitLastTaskResultVariable = true;
    }
    // check if use is command
    if (useType === UseType.Command) {
      const command = task.command!;
      const { args } = task;
      const argsFlatten = args.map((
        arg,
      ) => (convertValueToLiteral(arg, options.public)))
        .join(",");

      mainFunctionBodyCode =
        `const ${task.use} =  __yamlscript_create_process(${argsFlatten});
${LAST_TASK_RESULT_NAME} = await ${task.use}\`${command}\`;\n`;
      mainFunctionBodyCode += assignId(task, options);
    } else if (use) {
      // consider as function
      // array, then put args to literal args
      // constructor.name
      const argsFlatten = args.map((
        arg,
      ) => (convertValueToLiteral(arg, options.public)))
        .join(",");
      const isSyncFunction = useType === UseType.GlobalsFunction ||
        useType === UseType.RuntimeFunction ||
        useType === UseType.ThirdPartyFunction ||
        useType === UseType.UserFunction;
      mainFunctionBodyCode += `${LAST_TASK_RESULT_NAME} = ${
        isSyncFunction ? "" : "await "
      }${task.isInstance ? "new " : ""}${use}(${argsFlatten});\n`;
      mainFunctionBodyCode += assignId(task, options);
    }
  }

  // check if need to catch error
  if (task.throw === false) {
    // change returned result
    mainFunctionBodyCode += `${LAST_TASK_RESULT_NAME} = {
  value: result,
  done: true
};\n`;
    let idDefinition = "";
    if (task.id) {
      idDefinition = `let ${task.id};\n`;
    }
    // assignId;
    const idAssginment = assignId(task, options);
    mainFunctionBodyCode += idAssginment;

    mainFunctionBodyCode = `${idDefinition}try {\n${
      withIndent(mainFunctionBodyCode, 2)
    }} catch (error) {
  ${LAST_TASK_RESULT_NAME} = {
    value: error,
    done: false
  };${idAssginment ? "\n  " + idAssginment : "\n"}}\n`;
  }
  return {
    postTopLevelCode,
    mainFunctionBodyCode,
    topLevelCode,
    functions,
  };
}
function assignId(task: Task, options: StrictTasksContext): string {
  if (task.id) {
    const { id } = task;
    if (id) {
      // check current parent type

      if (options.parentType === ParentType.Loop) {
        // the result should be push to the array
        return `${id}.push(${LAST_TASK_RESULT_NAME});\n`;
      } else {
        // check if throw===false
        if (task.throw === false) {
          return `${id} = ${LAST_TASK_RESULT_NAME};\n`;
        } else {
          return `const ${id} = ${LAST_TASK_RESULT_NAME};\n`;
        }
      }
    }

    return "";
  } else {
    return "";
  }
}

function parseUse(use: string): ParseUseResult {
  const useArr = use.split(" as ");
  let exportName: string | undefined;
  if (useArr.length === 2) {
    exportName = useArr[0];
    use = useArr[1];
  }
  return {
    exportName,
    use,
  };
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
    mainFunctionBodyCode: result.mainFunctionBodyCode ?? "",
    postTopLevelCode: result.postTopLevelCode ??
      "",
    debugLog: result.debugLog ?? "",
    infoLog: result.infoLog ?? "",
    topLevelCode: result.topLevelCode ?? "",
    functions: result.functions ?? [],
    subTasks: result.subTasks ?? [],
  };
}

export function getDefaultTasksContext(
  taskContext?: TasksContext,
): StrictTasksContext {
  taskContext = taskContext || {};
  taskContext.public = taskContext.public ?? getDefaultPublicContext();
  taskContext.indent = taskContext.indent ?? 0;
  taskContext.varsMap = taskContext.varsMap ?? {};
  taskContext.parentType = taskContext.parentType ?? ParentType.Root;
  taskContext.isInitIndexVariable = taskContext.isInitIndexVariable ?? false;
  taskContext.isInitLastTaskResultVariable =
    taskContext.isInitLastTaskResultVariable ?? false;
  if (!taskContext.relativePath) {
    taskContext.relativePath = "./" + DEFAULT_FILE_NAME;
  }
  taskContext.dist = taskContext.dist ?? "dist";
  taskContext.isCompileDependencies = taskContext.isCompileDependencies ??
    false;
  return taskContext as StrictTasksContext;
}
export function getDefaultTaskOptions(
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
    taskId: options.taskId,
    useType: UseType.Default,
    throw: task.throw ?? true,
    name: task.name ?? "",
    isInstance: false,
  };
}

function getImportPathValue(use: string): string[] {
  if (use === "") {
    return ["", ""];
  }

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

export async function buildTasks(
  tasks: Task[],
  options?: TasksContext,
): Promise<BuiltCode> {
  // get global code
  const globalsCode = await getGlobalsCode();
  options = getDefaultTasksContext(options);
  options.globalsCode = globalsCode;

  const codeResult = getCompiledCode(tasks, options);
  // get dependencies
  if (options.isCompileDependencies) {
    const dependencies = await getDependencies(tasks, { ...options });
    // build dependencies
    for (const dependency of dependencies) {
      const type = dependency.type;
      const file = dependency.path;
      const relativePath = relative(Deno.cwd(), file);
      if (type === "source") {
        let subTasks: Task[] = [];
        try {
          subTasks = await parseYamlFile(file) as Task[];
          if (subTasks === undefined) {
            subTasks = [];
          } else if (!Array.isArray(subTasks)) {
            throw new Error(
              `${file} is not a valid ${pkg.brand} file, you should use an array to define subTasks.`,
            );
          }
        } catch (error) {
          log.fatal(`parse file ${green(file)} error: ${error.message}`);
        }
        const newOptions = {
          relativePath: relativePath,
          isCompileDependencies: false,
          dist: options.dist,
          dev: options.dev,
          public: options.public,
          verbose: options.verbose,
        };
        const _ = await buildTasks(subTasks, newOptions);
      }
    }
    const result = await createDistFile(
      codeResult,
      getDefaultTasksContext(options),
    );
    log.info("build task dist file:", result.path, "success");
    return result;
  } else {
    const result = await createDistFile(
      codeResult,
      getDefaultTasksContext(options),
    );
    log.info("build dependent file:", result.path, "success");
    return result;
  }
}

export async function runJs(path: string) {
  const p = Deno.run({
    cmd: ["deno", "run", "-A", "--unstable", path],
  });
  await p.status();
  p.close();
}
export async function runTasks(tasks: Task[], options?: TasksContext) {
  const buildResult = await buildTasks(tasks, options);

  await runJs(buildResult.path);
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
      `Run generated tasks code failed, ${error.message}\nFor more details, you can run \`ys build <file> --runtime"\` command to check out the generated runtime code`;
    log.fatal(error.message);
  }
}

function getTasksCode(fileCode: FileCode): TasksCode {
  const compiledModuleCode = fileCode.topLevelCode + fileCode.postTopLevelCode +
    fileCode.functions.join("") +
    `export default async function main(){\n${
      withIndent(
        fileCode.mainFunctionBodyCode,
        2,
      )
    }}
if (import.meta.main) {
  main();
}`;
  return {
    ...fileCode,
    code: compiledModuleCode,
  };
}

// affect function
function concatFileCode(
  fileCode: FileCode,
  literalCode: LiteralCode,
  options?: ConcatFileCodeOptions,
): void {
  options = options ?? {};
  const indent = options.indent ?? 0;
  const strictLiteralCode = formatLiteralCode(literalCode);
  fileCode.topLevelCode += strictLiteralCode.topLevelCode;
  fileCode.postTopLevelCode += withIndent(
    strictLiteralCode.postTopLevelCode,
    0,
  );
  fileCode.functions = fileCode.functions.concat(strictLiteralCode.functions);
  fileCode.mainFunctionBodyCode += withIndent(
    strictLiteralCode.mainFunctionBodyCode,
    indent,
  );
}
// affect function
function concatLiteralCode(
  l1: LiteralCode,
  l2: LiteralCode,
  options?: ConcatFileCodeOptions,
): void {
  l1.mainFunctionBodyCode = l1.mainFunctionBodyCode ?? "";
  l1.postTopLevelCode = l1.postTopLevelCode ??
    "";
  l1.debugLog = l1.debugLog ?? "";
  l1.infoLog = l1.infoLog ?? "";
  l1.topLevelCode = l1.topLevelCode ?? "";
  l1.functions = l1.functions ?? [];
  l1.subTasks = l1.subTasks ?? [];
  options = options ?? {};
  const indent = options.indent ?? 0;
  const strictLiteralCode2 = formatLiteralCode(l2);
  l1.topLevelCode += strictLiteralCode2.topLevelCode;
  l1.postTopLevelCode += strictLiteralCode2.postTopLevelCode;
  l1.mainFunctionBodyCode += withIndent(
    strictLiteralCode2.mainFunctionBodyCode,
    indent,
  );
}
function getInitialFileCode(ctx: StrictTasksContext): FileCode {
  let topLevelCode = "";

  if (ctx.globalsCode) {
    topLevelCode += formatImportCode(ctx.globalsCode, ctx);
    topLevelCode +=
      `const __dirname = path.resolve(path.relative("${ctx.dist}",path.dirname(path.fromFileUrl(import.meta.url))));\n`;
  }

  // add constant code
  // __dirname variables

  const mainFunctionBodyCode = ``;
  return {
    topLevelCode,
    functions: [],
    postTopLevelCode: "",
    mainFunctionBodyCode,
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

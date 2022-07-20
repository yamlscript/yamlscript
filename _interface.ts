import { PublicContext, Task, TasksOptions } from "./interface.ts";
/**
 * internal files
 */
export interface TemplateSpecs {
  main: (locals: Record<string, unknown>) => string;
}

export type LevelName = "debug" | "info" | "warn" | "error" | "fatal";

export enum Level {
  Debug = 0,
  Info = 1,
  Warn = 2,
  Error = 3,
  Fatal = 4,
}
export interface FileCode {
  importCode: string;
  runtimeImportCode: string;
  mainFunctionBody: string;
}
export enum UseType {
  RuntimeFunction,
  GlobalsFunction,
  ThirdPartyFunction,
  UserFunction,
  AsyncRuntimeFunction,
  AsyncGlobalsFunction,
  AsyncThirdPartyFunction,
  AsyncUserFunction,
  SetVars,
  Command,
  Default,
}

export interface LiteralCode {
  use?: string;
  from?: string;
  useType?: UseType;
  importCode?: string;
  runtimeImportCode?: string;
  mainFunctionBody?: string;
  functions?: string[];
  subTasks?: LiteralCode[];
  infoLog?: string;
  debugLog?: string;
}

export interface StrictLiteralCode extends LiteralCode {
  use: string;
  from: string;
  useType: UseType;
  importCode: string;
  runtimeImportCode: string;
  mainFunctionBody: string;
  functions: string[];
  subTasks: LiteralCode[];
  infoLog: string;
  debugLog: string;
}
export interface TasksCode {
  moduleFileCode: string;
  runtimeCode: string;
}
export interface BuiltCode {
  moduleFileCode: string;
  runFileCode: string;
  runFilePath: string;
  moduleFilePath: string;
}
export interface StrictTasksOptions extends TasksOptions {
  public: PublicContext;
  indent: number;
}
export interface StrictTask extends Task {
  args: unknown[];
  taskIndex: number;
}
export interface GetDefaultTaskOptionsOptions {
  taskIndex: number;
}

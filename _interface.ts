import {
  EntryOptions,
  ParentType,
  PublicContext,
  Task,
  TasksContext,
  UseType,
} from "./interface.ts";
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
  topLevelCode: string;
  runtimetopLevelCode: string;
  mainFunctionBodyCode: string;
  mainFunctionBodyTopLevelCode: string;
}

export interface LiteralCode {
  topLevelCode?: string;
  runtimetopLevelCode?: string;
  mainFunctionBodyTopLevelCode?: string;
  mainFunctionBodyCode?: string;
  functions?: string[];
  subTasks?: LiteralCode[];
  infoLog?: string;
  debugLog?: string;
  isNeedCloseBlock?: boolean;
}

export interface MetaResult extends LiteralCode {
  id?: string;
  use: string;
  from?: string;
  useType: UseType;
  command?: string;
}

export interface StrictLiteralCode extends LiteralCode {
  topLevelCode: string;
  runtimetopLevelCode: string;
  mainFunctionBodyCode: string;
  mainFunctionBodyTopLevelCode: string;
  functions: string[];
  subTasks: LiteralCode[];
  infoLog: string;
  debugLog: string;
}
export interface TasksCode {
  moduleFileCode: string;
  runtimeFunctionBodyCode: string;
  runtimeFileCode: string;
  topLevelCode: string;
  runtimetopLevelCode: string;
  mainFunctionBodyCode: string;
}
export interface TasksResult extends TasksCode {
  tasksMetaResults: MetaResult[];
}
export interface BuiltCode {
  moduleFileCode: string;
  moduleFilePath: string;
  runtimeFileCode: string;
  runtimeFilePath?: string;
  runtimeFunctionBodyCode: string;
}

export interface StrictTasksContext extends TasksContext {
  public: PublicContext;
  indent: number;
  varsMap: Record<string, UseType>;
  parentType: ParentType;
  isInitIndexVariable: boolean;
  isInitLastTaskResultVariable: boolean;
}
export interface StrictTask extends Task {
  args: unknown[];
  useType: UseType;
  command?: string;
  taskIndex: number;
  throw: boolean;
  name: string;
}
export interface GetDefaultTaskOptionsOptions {
  taskIndex: number;
}
export interface StrictEntryOptions extends EntryOptions {
  files: string[];
  dist: string;
  isBuild: boolean;
  shouldBuildRuntime: boolean;
  public: PublicContext;
}
export interface ConcatFileCodeOptions {
  indent?: number;
}

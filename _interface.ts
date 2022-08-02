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
  mainFunctionBodyCode: string;
  postTopLevelCode: string;
  functions: string[];
}

export interface LiteralCode {
  topLevelCode?: string;
  postTopLevelCode?: string;
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
  exportName?: string;
  command?: string;
  isInstance: boolean;
}
export interface ParseUseResult {
  use: string;
  exportName?: string;
}
export interface StrictLiteralCode extends LiteralCode {
  topLevelCode: string;
  mainFunctionBodyCode: string;
  postTopLevelCode: string;
  functions: string[];
  subTasks: LiteralCode[];
  infoLog: string;
  debugLog: string;
}
export interface TasksCode {
  code: string;
  topLevelCode: string;
  postTopLevelCode: string;
  functions: string[];
  mainFunctionBodyCode: string;
}
export interface TasksResult extends TasksCode {
  tasksMetaResults: MetaResult[];
}
export interface BuiltCode {
  code: string;
  path: string;
}

export interface StrictTasksContext extends TasksContext {
  public: PublicContext;
  indent: number;
  varsMap: Record<string, UseType>;
  parentType: ParentType;
  isInitIndexVariable: boolean;
  isInitLastTaskResultVariable: boolean;
  globalsCode: string;
  relativePath: string;
  isCompileDependencies: boolean;
  dist: string;
}
export interface StrictTask extends Task {
  args: unknown[];
  useType: UseType;
  command?: string;
  taskId: string;
  throw: boolean;
  name: string;
  isInstance: boolean;
}
export interface GetDefaultTaskOptionsOptions {
  taskId: string;
}
export interface StrictEntryOptions extends EntryOptions {
  files: string[];
  dist: string;
  isRun: boolean;
  shouldBuildRuntime: boolean;
  public: PublicContext;
}
export interface ConcatFileCodeOptions {
  indent?: number;
}

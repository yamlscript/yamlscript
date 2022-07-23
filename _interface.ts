import {
  EntryOptions,
  ParentType,
  PublicContext,
  Task,
  TasksOptions,
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
  importCode: string;
  runtimeImportCode: string;
  mainFunctionBody: string;
}

export interface LiteralCode {
  importCode?: string;
  runtimeImportCode?: string;
  mainFunctionBodyTop?: string;
  mainFunctionBody?: string;
  functions?: string[];
  subTasks?: LiteralCode[];
  infoLog?: string;
  debugLog?: string;
  isNeedCloseBlock?: boolean;
}

export interface ImportResult extends LiteralCode {
  use: string;
  from?: string;
  useType: UseType;
  command?: string;
}

export interface StrictLiteralCode extends LiteralCode {
  importCode: string;
  runtimeImportCode: string;
  mainFunctionBody: string;
  mainFunctionBodyTop: string;
  functions: string[];
  subTasks: LiteralCode[];
  infoLog: string;
  debugLog: string;
}
export interface TasksCode {
  moduleFileCode: string;
  runtimeFunctionBodyCode: string;
  runtimeFileCode: string;
}
export interface BuiltCode {
  moduleFileCode: string;
  moduleFilePath: string;
  runtimeFileCode: string;
  runtimeFilePath?: string;
  runtimeFunctionBodyCode: string;
}

export interface StrictTasksOptions extends TasksOptions {
  public: PublicContext;
  indent: number;
  varsMap: Record<string, UseType>;
  parentType: ParentType;
}
export interface StrictTask extends Task {
  args: unknown[];
  useType: UseType;
  command?: string;
  taskIndex: number;
  catch: boolean;
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

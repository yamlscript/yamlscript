import {
  EntryOptions,
  PublicContext,
  Task,
  TasksOptions,
  UseProperties,
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
  use?: string;
  from?: string;
  importCode?: string;
  runtimeImportCode?: string;
  mainFunctionBody?: string;
  functions?: string[];
  subTasks?: LiteralCode[];
  infoLog?: string;
  debugLog?: string;
  tasksOptions?: StrictTasksOptions;
  isNeedCloseBlock?: boolean;
}

export interface StrictLiteralCode extends LiteralCode {
  use: string;
  from: string;
  importCode: string;
  runtimeImportCode: string;
  mainFunctionBody: string;
  functions: string[];
  subTasks: LiteralCode[];
  infoLog: string;
  debugLog: string;
  tasksOptions: StrictTasksOptions;
}
export interface TasksCode {
  moduleFileCode: string;
  runFileCode: string;
  runtimeFunctionBodyCode: string;
  runtimeFileCode: string;
}
export interface BuiltCode {
  moduleFileCode: string;
  runFileCode: string;
  runFilePath: string;
  moduleFilePath: string;
  runtimeFileCode: string;
  runtimeFilePath?: string;
  runtimeFunctionBodyCode: string;
}

export interface StrictTasksOptions extends TasksOptions {
  public: PublicContext;
  indent: number;
  varsMap: Record<string, boolean>;
  usesMap: Record<string, UseProperties>;
}
export interface StrictTask extends Task {
  args: unknown[];
  taskIndex: number;
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

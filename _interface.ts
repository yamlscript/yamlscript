import {
  PublicContext,
  Task,
  TasksOptions,
  UseProperties,
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
  use?: string;
  from?: string;
  importCode?: string;
  runtimeImportCode?: string;
  mainFunctionBody?: string;
  functions?: string[];
  subTasks?: LiteralCode[];
  infoLog?: string;
  debugLog?: string;
  tasksOptions?: TasksOptions;
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

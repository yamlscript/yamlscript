export interface Task {
  from?: string;
  use?: string;
  args?: unknown | unknown[];
  loop?: string | number | unknown[];
  if?: boolean | string;
}
export interface BuildContext {
  env: Record<string, string>;
  os: Record<string, string>;
}
export interface GlobalContext {
  env: Record<string, string>;
}
export interface PublicContext {
  build: BuildContext;
  [key: string]: unknown;
}
export interface Context {
  public: PublicContext;
}
export interface EntryOptions {
  files?: string[];
  dist?: string;
  isBuild?: boolean;
  shouldBuildRuntime?: boolean;
  public?: PublicContext;
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

export interface TasksOptions {
  public?: PublicContext;
  indent?: number;
  uniqueVars?: Record<string, UseType>;
}

export interface RunTasksOptions extends TasksOptions {
}

export interface BuildTasksOptions extends TasksOptions {
  dist?: string;
  relativePath: string;
  shouldBuildRuntime?: boolean;
}
export interface RunCmdOptions {
  shell?: string;
  prefix?: string;
  args?: string;
}

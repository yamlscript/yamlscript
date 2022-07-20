export interface Task {
  from?: string;
  use?: string;
  args?: unknown | unknown[];
  loop?: string | number | unknown[];
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
  files: string[];
  dist: string;
  isBuild: boolean;
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
export interface UseProperties {
  type: UseType;
}
export interface TasksOptions {
  public?: PublicContext;
  indent?: number;
  uniqueVars?: Record<string, boolean>;
  usesMap?: Record<string, UseProperties>;
}

export interface RunTasksOptions extends TasksOptions {
  relativePath: string;
}

export interface BuildTasksOptions extends TasksOptions {
  dist?: string;
  relativePath: string;
}

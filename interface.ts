export interface Task {
  id?: string;
  name?: string;
  from?: string;
  use?: string;
  args?: unknown | unknown[];
  loop?: string | number | unknown[];
  if?: boolean | string;
  throw?: boolean;
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
  DefineVariable,
  DefineGlobalVariable,
  DefineFunction,
  Command,
  Return,
  Default,
}
export enum ParentType {
  Root,
  Loop,
}

export interface TasksContext {
  public?: PublicContext;
  indent?: number;
  varsMap?: Record<string, UseType>;
  relativePath?: string;
  dist?: string;
  parentType?: ParentType;
  isInitIndexVariable?: boolean;
  isInitLastTaskResultVariable?: boolean;
}

export interface RunTasksContext extends TasksContext {
}

export interface BuildTasksContext extends TasksContext {
  dist?: string;
  relativePath: string;
  shouldBuildRuntime?: boolean;
}
export interface RunCmdOptions {
  shell?: string;
  prefix?: string;
  args?: string;
}

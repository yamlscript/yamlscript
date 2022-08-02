export interface Task {
  id?: string;
  name?: string;
  from?: string;
  use?: string | boolean;
  args?: unknown | unknown[];
  loop?: string | number | unknown[];
  if?: boolean | string;
  throw?: boolean;
  export?: boolean;
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
  isRun?: boolean;
  shouldBuildRuntime?: boolean;
  public?: PublicContext;
  verbose?: boolean;
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
  None,
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
  parentId?: string;
  isInitIndexVariable?: boolean;
  isInitLastTaskResultVariable?: boolean;
  verbose?: boolean;
  globalsCode?: string;
  isCompileDependencies?: boolean;
  dev?: boolean;
}

export interface RunCmdOptions {
  shell?: string;
  prefix?: string;
  args?: string;
}
export type DependencyType = "asset" | "source";
export interface Dependency {
  path: string;
  type: DependencyType;
}

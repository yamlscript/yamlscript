export interface Task {
  from?: string;
  use?: string;
  args?: unknown[];
  loop?: string | number | unknown[];
}
export interface CompiledContext {
  env: Record<string, string>;
  os: Record<string, string>;
}
export interface GlobalContext {
  env: Record<string, string>;
}
export interface Context {
  public: CompiledContext;
}
export interface EntryOptions {
  files: string[];
  dist: string;
  isBuild: boolean;
  compiledContext: CompiledContext;
}
export interface TasksOptions {
  compiledContext: CompiledContext;
  indent?: number;
}

export interface RunTasksOptions extends TasksOptions {
  relativePath: string;
}

export interface BuildTasksOptions extends TasksOptions {
  dist?: string;
  relativePath: string;
}

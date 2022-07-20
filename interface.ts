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
export interface TasksOptions {
  public?: PublicContext;
  indent?: number;
}

export interface RunTasksOptions extends TasksOptions {
  relativePath: string;
}

export interface BuildTasksOptions extends TasksOptions {
  dist?: string;
  relativePath: string;
}

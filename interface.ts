

export interface Task {
  from: string;
  use: string;
  args: unknown[];
}
export interface CompiledContext {
  env: Record<string, string>;
}
export interface GlobalContext {
  env: Record<string, string>;
}
export interface RunOptions {
  files: string[];
  dist: string;
  isBuild: boolean;
  compiledContext:CompiledContext;
}
export interface RunSingleOptions {
  relativePath: string;
  tasks: Task[];
  isBuild: boolean;
  dist: string;
  compiledContext: CompiledContext;
}

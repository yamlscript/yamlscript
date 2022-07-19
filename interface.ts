export interface RunOptions {
  files: string[];
  dist: string;
  isBuild: boolean;
}

export interface Task {
  from: string;
  use: string;
  args: unknown[];
}
export interface GlobalContext {
  env: Record<string, string>;
}

export interface RunSingleOptions {
  relativePath: string;
  tasks: Task[];
  isBuild: boolean;
  dist: string;
}

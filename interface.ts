export interface RunOptions {
  files: string[];
  buildDenoDeploy: boolean;
  dist: string;
}

export interface Task {
  use: string;
  args: unknown[];
}

export interface RunSingleOptions {
  relativePath: string;
  tasks: Task[];
  buildDenoDeploy: boolean;
  dist: string;
}

export interface RunOptions {
  files: string[];
}

export interface Task {
  use: string;
  args: unknown[];
}

export interface RunSingleOptions {
  tasks: Task[];
}

import { RunOptions } from "./interface.ts";
import { runSingle } from "./run-single.ts";
import { parseTask } from "./parse.ts";
export async function run(options: RunOptions) {
  const { files } = options;

  for (const file of files) {
    // parse file
    const tasks = await parseTask(file);
    await runSingle({
      tasks: tasks,
    });
  }
}

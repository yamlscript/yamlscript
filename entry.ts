import { EntryOptions } from "./interface.ts";
import { buildTasks, runTasks } from "./tasks.ts";
import { parseTask } from "./parse.ts";
export async function run(options: EntryOptions) {
  const { files } = options;
  for (const file of files) {
    // parse file
    const tasks = await parseTask(file);
    if (options.isBuild) {
      await buildTasks(tasks, {
        relativePath: file,
        dist: options.dist,
        compiledContext: options.compiledContext,
        indent: 0,
      });
    } else {
      await runTasks(tasks, {
        indent: 0,
        relativePath: file,
        compiledContext: options.compiledContext,
      });
    }
  }
}

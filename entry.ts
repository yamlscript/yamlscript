import { EntryOptions, Task } from "./interface.ts";
import { buildTasks, runTasks } from "./tasks.ts";
import { parseYamlFile } from "./util.ts";
export async function run(options: EntryOptions) {
  const { files } = options;
  for (const file of files) {
    // parse file
    const tasks = await parseYamlFile(file) as Task[];
    if (options.isBuild) {
      await buildTasks(tasks, {
        relativePath: file,
        dist: options.dist,
        public: options.public,
        indent: 0,
      });
    } else {
      await runTasks(tasks, {
        indent: 0,
        relativePath: file,
        public: options.public,
      });
    }
  }
}

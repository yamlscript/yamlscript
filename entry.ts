import { EntryOptions, Task } from "./interface.ts";
import { StrictEntryOptions } from "./_interface.ts";
import { buildTasks, runTasks } from "./tasks.ts";
import { getDefaultPublicContext, parseYamlFile } from "./util.ts";
import log from "./log.ts";
export async function run(originalOptions: EntryOptions) {
  const options = getDefaultEntryOptions(originalOptions);
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
        shouldBuildRuntime: options.shouldBuildRuntime,
      });
    } else {
      await runTasks(tasks, {
        indent: 0,
        public: options.public,
      });
    }
  }
  // done
  log.info("Done");
}
function getDefaultEntryOptions(options: EntryOptions): StrictEntryOptions {
  const { files, isBuild, shouldBuildRuntime, dist, public: publicContext } =
    options;
  const defaultEntryOptions: StrictEntryOptions = {
    files: files ?? [],
    isBuild: isBuild ?? false,
    shouldBuildRuntime: shouldBuildRuntime ?? false,
    dist: dist ?? "dist",
    public: publicContext ?? getDefaultPublicContext(),
  };
  return defaultEntryOptions;
}

import { EntryOptions, Task } from "./interface.ts";
import { StrictEntryOptions } from "./_interface.ts";
import { buildTasks, runJs } from "./tasks.ts";
import { getDefaultPublicContext, parseYamlFile } from "./util.ts";
import log from "./log.ts";
import { green } from "./deps.ts";
import { DEV_FLAG } from "./constant.ts";
import pkg from "./pkg.json" assert { type: "json" };
export async function run(originalOptions: EntryOptions) {
  const options = getDefaultEntryOptions(originalOptions);
  const isDev = Deno.env.get(DEV_FLAG) &&
      Deno.env.get(DEV_FLAG) !== "false" || false;
  const { files } = options;
  for (const file of files) {
    // parse file
    let tasks: Task[] = [];
    try {
      tasks = await parseYamlFile(file) as Task[];
      if (tasks === undefined) {
        tasks = [];
      } else if (!Array.isArray(tasks)) {
        throw new Error(
          `${file} is not a valid ${pkg.brand} file, you should use an array to define tasks.`,
        );
      }
    } catch (error) {
      log.fatal(`parse file ${green(file)} error: ${error.message}`);
    }

    log.info("build task source file:", file);
    const buildResult = await buildTasks(tasks, {
      relativePath: file,
      dist: options.dist,
      public: options.public,
      indent: 0,
      isCompileDependencies: true,
      dev: isDev,
    });
    if (options.isRun) {
      log.info("run task file:", file);

      await runJs(buildResult.path);
    }
  }
  // done
  log.info("Done");
}
function getDefaultEntryOptions(options: EntryOptions): StrictEntryOptions {
  const { files, isRun, shouldBuildRuntime, dist, public: publicContext } =
    options;
  const defaultEntryOptions: StrictEntryOptions = {
    files: files ?? [],
    isRun: isRun ?? false,
    shouldBuildRuntime: shouldBuildRuntime ?? false,
    dist: dist ?? "dist",
    public: publicContext ?? getDefaultPublicContext(),
  };
  return defaultEntryOptions;
}

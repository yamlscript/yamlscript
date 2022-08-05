import { Command, EnumType, globToRegExp } from "./deps.ts";
import { run } from "./entry.ts";
import log from "./log.ts";
import { EntryOptions } from "./interface.ts";
import { LevelName } from "./_interface.ts";
import pkg from "./pkg.json" assert { type: "json" };
import {
  absolutePathToRelativePath,
  getFilesFromGlob,
  getPublicContext,
  getUniqueStrings,
} from "./util.ts";
const setLogLevel = (options: Record<string, LevelName>) => {
  let logLevel: LevelName = "info";
  if (options.verbose) {
    logLevel = "debug";
  } else {
    logLevel = options.logLevel;
  }
  log.setLevel(logLevel);
};
if (import.meta.main) {
  const runCommand = new Command()
    .description("run files")
    .arguments("[file...:string]").option(
      "-A, --all",
      "run all .ys.yml files in current working directory",
    ).globalOption("-v, --verbose", "Enable verbose output.")
    .option("--dist <dist>", "dist directory.")
    .option(
      "-d, --dir <folde:string>",
      "run all **/*.ys.yml files in the specified directory, use , to separate multiple directories.",
      { collect: true },
    )
    .action(async (options, args) => {
      setLogLevel(options as unknown as Record<string, LevelName>);

      let files: string[] = await getFilesFromGlob(args || []);
      // concat dir
      if (options.dir && Array.isArray(options.dir)) {
        const dir = options.dir;
        for (const dirname of dir) {
          const dirRemoveEndSlash = dirname.replace(/\/$/, "");
          files.push(
            ...await getFilesFromGlob([`${dirRemoveEndSlash}/**/*.ys.yml`]),
          );
        }
      }
      if (options.all) {
        files.push(...await getFilesFromGlob(["**/*.ys.yml"]));
      }
      files = getUniqueStrings(files).map(absolutePathToRelativePath);
      const dist = options.dist || "dist";

      log.debug("files:", files);
      const runOptions: EntryOptions = {
        files: files as string[],
        public: await getPublicContext(),
        isRun: true,
        verbose: options.verbose,
        dist,
      };
      await run(runOptions);
    });
  const buildCommand = new Command()
    .arguments("[file...:string]")
    .description("build yaml file to js file")
    .option("--dist <dist>", "dist directory.")
    .option("--runtime", "also build runtime mode.")
    .option(
      "-A, --all",
      "run all .ys.yml files in current working directory",
    )
    .option(
      "-d, --dir <folde:string>",
      "run all **/*.ys.yml files in the specified directory, use , to separate multiple directories.",
      { collect: true },
    ).globalOption("-v, --verbose", "Enable verbose output.")
    .action(async (options, args) => {
      setLogLevel(options as unknown as Record<string, LevelName>);
      log.debug("cli options:", options);
      log.debug("cli args:", args);
      let files: string[] = await getFilesFromGlob(args || []);
      // concat dir
      if (options.dir && Array.isArray(options.dir)) {
        const dir = options.dir;
        for (const dirname of dir) {
          const dirRemoveEndSlash = dirname.replace(/\/$/, "");
          files.push(
            ...await getFilesFromGlob([`${dirRemoveEndSlash}/**/*.ys.yml`]),
          );
        }
      }
      if (options.all) {
        files.push(...await getFilesFromGlob(["**/*.ys.yml"]));
      }
      files = getUniqueStrings(files).map(absolutePathToRelativePath);
      // transform to relative path

      log.debug("files:", files);
      const dist = options.dist || "dist";
      const verbose = options.verbose || false;
      const runOptions: EntryOptions = {
        files: files,
        isRun: false,
        shouldBuildRuntime: options.runtime,
        public: await getPublicContext(),
        dist,
        verbose: verbose,
      };
      await run(runOptions);
    });

  await new Command()
    .name(pkg.bin)
    .version(pkg.version)
    .description(pkg.description)
    .type("log-level", new EnumType(["debug", "info", "warn", "error"]))
    .globalOption("-v, --verbose", "Enable verbose output.")
    .action(function () {
      this.showHelp();
    }).example(
      "run file",
      "ys run file.ys.yml\n\nys run **/*.ys.yml",
    )
    .command("run", runCommand)
    .command("build", buildCommand)
    .parse(Deno.args);
}

import { Command, EnumType } from "./deps.ts";
import { run } from "./entry.ts";
import log from "./log.ts";
import { CompiledContext, EntryOptions } from "./interface.ts";
import { LevelName } from "./_interface.ts";
import pkg from "./pkg.json" assert { type: "json" };

const setLogLevel = (options: Record<string, LevelName>) => {
  let logLevel: LevelName = "info";
  if (options.debug) {
    logLevel = "debug";
  } else if (options.verbose) {
    logLevel = "debug";
  } else {
    logLevel = options.logLevel;
  }
  log.setLevel(logLevel);
};
if (import.meta.main) {
  const compiledContext: CompiledContext = {
    env: {},
    os: {},
  };
  const runCommand = new Command()
    .description("run files")
    .arguments("[file:string]")
    .action(async (options, ...args) => {
      setLogLevel(options as unknown as Record<string, LevelName>);
      log.debug("cli options:", options);
      log.debug("cli args:", args);
      if (args && args.length > 0) {
        const runOptions: EntryOptions = {
          files: args as string[],
          isBuild: false,
          compiledContext,
          dist: "dist", // will not be used in run
        };
        await run(runOptions);
      } else {
        log.debug("no args");
      }
    });
  const buildCommand = new Command()
    .arguments("[file:string]")
    .description("build yaml file to js file")
    .option("--dist <dist>", "dist directory.")
    .action(async (options, ...args) => {
      setLogLevel(options as unknown as Record<string, LevelName>);
      log.debug("cli options:", options);
      log.debug("cli args:", args);
      if (args && args.length > 0) {
        const dist = options.dist ?? "./dist";
        const runOptions: EntryOptions = {
          files: args as string[],
          isBuild: true,
          compiledContext,
          dist,
        };
        await run(runOptions);
        log.info(`build to ${dist} success`);
      } else {
        console.log("no args");
      }
    });

  await new Command()
    .name(pkg.bin)
    .version(pkg.version)
    .description(pkg.description)
    .type("log-level", new EnumType(["debug", "info", "warn", "error"]))
    .globalOption("-d, --debug", "Enable debug output.")
    .globalOption("-v, --verbose", "Enable verbose output.")
    .globalOption("-l, --log-level <level:log-level>", "Set log level.", {
      default: "info" as const,
    })
    .globalOption("-a, --all", "All.")
    .globalOption("-d, --directory", "directory.")
    .command("run", runCommand)
    .command("build", buildCommand)
    .parse(Deno.args);
}

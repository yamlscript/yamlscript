import { Command, EnumType } from "./deps.ts";
import { run } from "./run.ts";
import log from "./log.ts";
import { RunOptions } from "./interface.ts";
import { LevelName } from "./internal-interface.ts";
import config from "./config.json" assert { type: "json" };

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
  const runCommand = new Command()
    .description("run files")
    .arguments("[file:string]")
    .action(async (options, ...args) => {
      setLogLevel(options as unknown as Record<string, LevelName>);
      log.debug("cli options:", options);
      log.debug("cli args:", args);
      if (args && args.length > 0) {
        const runOptions: RunOptions = {
          files: args as string[],
          isBuild: false,
          dist: "dist", // will not be used in run
        };
        await run(runOptions);
      } else {
        console.log("no args");
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
        const runOptions: RunOptions = {
          files: args as string[],
          isBuild: true,
          dist: options.dist ?? "dist",
        };
        await run(runOptions);
      } else {
        console.log("no args");
      }
      console.log("clone command called");
    });

  await new Command()
    .name(config.bin)
    .version(config.version)
    .description(config.description)
    .type("log-level", new EnumType(["debug", "info", "warn", "error"]))
    .option("-d, --debug", "Enable debug output.")
    .option("-v, --verbose", "Enable verbose output.")
    .option("-l, --log-level <level:log-level>", "Set log level.", {
      default: "info" as const,
    })
    .option("-a, --all", "All.")
    .option("-d, --directory", "directory.")
    .command("run", runCommand)
    .command("build", buildCommand)
    .parse(Deno.args);
}

import { Command, EnumType } from "./deps.ts";
import { run } from "./run.ts";
import log from "./log.ts";
import { RunOptions } from "./interface.ts";
import { LevelName } from "./internal-interface.ts";
import config from "./config.json" assert { type: "json" };
if (import.meta.main) {
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
    .option("--build-deno-deploy", "build for deno deploy.")
    .option("--dist <dist>", "dist directory.")
    .arguments("[file:string]")
    .action(async (options, ...args) => {
      let logLevel: LevelName = "info";
      if (options.debug) {
        logLevel = "debug";
      } else if (options.verbose) {
        logLevel = "debug";
      } else {
        logLevel = options.logLevel;
      }
      log.setLevel(logLevel);
      log.debug("cli options:", options);
      log.debug("cli args:", args);
      if (args && args.length > 0) {
        const runOptions: RunOptions = {
          files: args as string[],
          buildDenoDeploy: options.buildDenoDeploy ?? false,
          dist: options.dist ?? "dist",
        };
        await run(runOptions);
      } else {
        console.log("no args");
      }
    })
    .parse(Deno.args);
}

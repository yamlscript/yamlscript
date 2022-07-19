import { Command, EnumType } from "./deps.ts";
import { run } from "./run.ts";
import { RunOptions } from "./interface.ts";
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
      console.log("cli options", options, args);
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

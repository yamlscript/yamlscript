import { Command, EnumType } from "./deps.ts";
import { run } from "./run.ts";
import { RunOptions } from "./interface.ts";
if (import.meta.main) {
  await new Command()
    .name("yaas")
    .version("0.0.1")
    .description("YAML as a shell for Deno")
    .type("log-level", new EnumType(["debug", "info", "warn", "error"]))
    .env("DEBUG=<enable:boolean>", "Enable debug output.")
    .option("-d, --debug", "Enable debug output.")
    .option("-v, --verbose", "Enable verbose output.")
    .option("-l, --log-level <level:log-level>", "Set log level.", {
      default: "info" as const,
    })
    .option("-a, --all", "All.")
    .option("-d, --directory", "directory.")
    .arguments("[file:string]")
    .action(async (options, ...args) => {
      console.log("options", options, args);
      if (args && args.length > 0) {
        const runOptions: RunOptions = {
          files: args as string[],
        };
        await run(runOptions);
      } else {
        console.log("no args");
      }
    })
    .parse(Deno.args);
}

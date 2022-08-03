import { colors, shq } from "../deps.ts";
// global settings
export type GlobalOptions = typeof colors & {
  get mainModule(): string;
  get args(): Array<string>;
  get verbose(): boolean;
  set verbose(value: boolean);
  get startTime(): number;
  shell: string;
  prefix: string;
  stdin: NonNullable<Deno.RunOptions["stdin"]>;
  stdout: NonNullable<Deno.RunOptions["stdout"]>;
  stderr: NonNullable<Deno.RunOptions["stderr"]>;
  quote: typeof shq;
  time: number;
};

export const __yamlscript_global_options: GlobalOptions = {} as GlobalOptions;

Object.setPrototypeOf(
  __yamlscript_global_options,
  Object.getPrototypeOf(colors),
);

__yamlscript_global_options._stack = [];
__yamlscript_global_options.shell = "/bin/bash";
__yamlscript_global_options.prefix = "set -euo pipefail;";
__yamlscript_global_options.stdin = "inherit";
__yamlscript_global_options.stdout = "piped";
__yamlscript_global_options.stderr = "piped";
__yamlscript_global_options.quote = shq;

let _verbose = false;
Object.defineProperty(__yamlscript_global_options, "verbose", {
  get: (): boolean => _verbose,
  set: (verbose: boolean) => _verbose = verbose,
});

Object.defineProperty(__yamlscript_global_options, "time", {
  get: () => Date.now() - __yamlscript_global_options.startTime,
});

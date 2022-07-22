import { LooseProcessOptions, Process } from "./process.ts";
import { ProcessOutput } from "./process_output.ts";
import { quote } from "./quote.ts";

export function createProcess(options?: LooseProcessOptions): (
  pieces: TemplateStringsArray,
  ...args: Array<string | number | ProcessOutput>
) => Process {
  function exec(
    pieces: TemplateStringsArray,
    ...args: Array<string | number | ProcessOutput>
  ): Process {
    const cmd = quote(
      pieces,
      ...args.map((
        a,
      ) => (a instanceof ProcessOutput ? a.stdout.replace(/\n$/, "") : a)),
    );

    return new Process(cmd, { ...options, errorContext: exec });
  }
  return exec;
}

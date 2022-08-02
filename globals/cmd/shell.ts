import { createProcess } from "./exec.ts";
import { ProcessError } from "./process_error.ts";
import { ProcessOutput } from "./process_output.ts";
import { Process } from "./process.ts";
export function $(
  pieces: TemplateStringsArray,
  ...args: Array<string | number | ProcessOutput>
): Process {
  const cmd = createProcess();
  return cmd(pieces, ...args);
}

/**
 * Run a command and return only its trimmed stdout
 *
 * If the command throws an error or fails in some way,
 * this method will not re-throw that error. It will only
 * have output if the command produces text written
 * to its stdout stream.
 *
 * If you want assurance that a failure in the child process
 * will throw an error, use `$`
 * @see $
 */
export const $o = async (
  pieces: TemplateStringsArray,
  ...args: Array<string | number | ProcessOutput>
): Promise<string> =>
  await $(pieces, ...args)
    .then((o) => (o instanceof ProcessOutput ? o.stdout.trim() : ""))
    .catch((e) => (e instanceof ProcessError ? e.stdout.trim() : ""));

/**
 * Run a command and return only its trimmed stderr
 *
 * If the command throws an error or fails in some way,
 * this method will not re-throw that error. It will only
 * have output if the command produces text written
 * to its stderr stream.
 *
 * If you want assurance that a failure in the child process
 * will throw an error, use `$`
 * @see $
 */
export const $e = async (
  pieces: TemplateStringsArray,
  ...args: Array<string | number | ProcessOutput>
): Promise<string> =>
  await $(pieces, ...args)
    .then((o) => (o instanceof ProcessOutput ? o.stderr.trim() : ""))
    .catch((e) => (e instanceof ProcessError ? e.stderr.trim() : ""));

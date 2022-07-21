import { run } from "https://deno.land/x/run_simple@1.1.0/mod.ts";
export function __yamlscript_run_cmd(cmd: string[]) {
  console.log("cmd", cmd);
  return run(cmd);
}

import { __yamlscript_run_cmd } from "./cmd.ts";

Deno.test("echo cmd #1", async () => {
  const result = await __yamlscript_run_cmd(["echo", "hello"]);
  console.log("result", result);
});

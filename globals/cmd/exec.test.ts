import { assertEquals } from "../../deps.ts";
import { __yamlscript_create_process } from "./mod.ts";

Deno.test("run #1", async () => {
  const str = "Hello World";
  const cmd = __yamlscript_create_process({ verbose: true });
  const result = await cmd`echo ${str}`;
  assertEquals(result.stdout, "Hello World\n");

  const cmd2 = __yamlscript_create_process({ verbose: false });
  const result2 = await cmd2`echo ${str}`;
  assertEquals(result2.stdout, "Hello World\n");
});

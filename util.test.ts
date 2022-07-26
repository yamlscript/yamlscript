import { getFilesFromGlob } from "./util.ts";
import { assert } from "./deps.ts";

Deno.test("getFilesFromGlob #1", async () => {
  const files = await getFilesFromGlob(["docs/**/*.ys.yml"]);
  assert(files.length > 0);
});

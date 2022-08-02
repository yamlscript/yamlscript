import {
  _,
  assert,
  assertAlmostEquals,
  assertArrayIncludes,
  assertEquals,
  assertExists,
  assertMatch,
  assertNotEquals,
  assertNotMatch,
  assertObjectMatch,
  assertRejects,
  assertStringIncludes,
  assertThrows,
} from "../../globals/deps.ts";
import * as fsExtra from "../../globals/fs_extra.ts";
import * as rss from "../../globals/rss.ts";
import * as YAMLScript from "../../globals/yamlscript.ts";
import * as YAML from "https://deno.land/std@0.149.0/encoding/yaml.ts";
import * as TOML from "https://deno.land/std@0.149.0/encoding/toml.ts";
import * as path from "https://deno.land/std@0.149.0/path/mod.ts";
import * as fs from "https://deno.land/std@0.149.0/fs/mod.ts";
import * as dotenv from "https://deno.land/std@0.149.0/dotenv/mod.ts";
import * as datetime from "https://deno.land/std@0.149.0/datetime/mod.ts";
import * as async from "https://deno.land/std@0.150.0/async/mod.ts";
import env from "../../globals/env.ts";
import { __yamlscript_create_process } from "https://deno.land/x/yamlscript@0.0.2/runtimes/cmd/mod.ts";
let result = null;
export default async function main(){

  // Task #0
  const __yamlscript_default_use_0 =  __yamlscript_create_process(`hello`,`world`);
  result = await __yamlscript_default_use_0`echo`;
}
if (import.meta.main) {
  main();
}
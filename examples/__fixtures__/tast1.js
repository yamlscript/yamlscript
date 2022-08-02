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
let result = null;
export default async function main(){

  // Task #0
  result = console.log(`hello`,`${env.name}`);
}
if (import.meta.main) {
  main();
}
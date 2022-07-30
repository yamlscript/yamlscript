import { getFilesFromGlob, importCodeToDynamicImport } from "./util.ts";
import { assert, assertEquals } from "./deps.ts";

Deno.test("getFilesFromGlob #1", async () => {
  const files = await getFilesFromGlob(["docs/**/*.ys.yml"]);
  assert(files.length > 0);
});

Deno.test("importCodeToDynamicImport #2", () => {
  const code = `import { _ } from "./deps.ts";`;
  const result = importCodeToDynamicImport(code);
  assert(result === `const { _ } = import("./deps.ts");`);
});

Deno.test("importCodeToDynamicImport #3", () => {
  const code = `import {
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
} from "./deps.ts";

import * as fsExtra from "./fs_extra.ts";
import * as rss from "./rss.ts";
import * as YAMLScript from "./yamlscript.ts";
import * as YAML from "https://deno.land/std@0.149.0/encoding/yaml.ts";
import * as TOML from "https://deno.land/std@0.149.0/encoding/toml.ts";
import * as path from "https://deno.land/std@0.149.0/path/mod.ts";
import * as fs from "https://deno.land/std@0.149.0/fs/mod.ts";
import * as dotenv from "https://deno.land/std@0.149.0/dotenv/mod.ts";
import * as datetime from "https://deno.land/std@0.149.0/datetime/mod.ts";
import env from "./env.ts";`;
  const result = importCodeToDynamicImport(code);
  assertEquals(
    result,
    `const {
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
} = import("./deps.ts");
const fsExtra = import("./fs_extra.ts");
const rss = import("./rss.ts");
const YAMLScript = import("./yamlscript.ts");
const YAML = import("https://deno.land/std@0.149.0/encoding/yaml.ts");
const TOML = import("https://deno.land/std@0.149.0/encoding/toml.ts");
const path = import("https://deno.land/std@0.149.0/path/mod.ts");
const fs = import("https://deno.land/std@0.149.0/fs/mod.ts");
const dotenv = import("https://deno.land/std@0.149.0/dotenv/mod.ts");
const datetime = import("https://deno.land/std@0.149.0/datetime/mod.ts");
const env = import("./env.ts");`,
  );
});

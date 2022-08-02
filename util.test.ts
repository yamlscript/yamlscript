import {
  getFilesFromGlob,
  importCodeToDynamicImport,
  withIndent,
} from "./util.ts";
import { assert, assertEquals } from "./deps.ts";
import pkg from "./pkg.json" assert { type: "json" };
Deno.test("getFilesFromGlob #1", async () => {
  const files = await getFilesFromGlob(["docs/**/*.ys.yml"]);
  assert(files.length > 0);
});

Deno.test("importCodeToDynamicImport #2", () => {
  const code = `import { _ } from "./deps.ts";`;
  const result = importCodeToDynamicImport(code);
  assert(
    result ===
      `const { _ } = await import("https://deno.land/x/yamlscript@${pkg.version}/globals/deps.ts");
`,
  );
});

Deno.test("importCodeToDynamicImport #3", () => {
  const code = `import {
  _
} from "./deps.ts";

import * as fsExtra from "./fs_extra.ts";
import env from "./env.ts";`;
  const result = importCodeToDynamicImport(code);
  assertEquals(
    result,
    `const {
  _
} = await import("https://deno.land/x/yamlscript@${pkg.version}/globals/deps.ts");
const fsExtra = await import("https://deno.land/x/yamlscript@${pkg.version}/globals/fs_extra.ts");
const env = await import("https://deno.land/x/yamlscript@${pkg.version}/globals/env.ts");
`,
  );
});

Deno.test("withIndent #4", () => {
  const code = `console.log(\`\${1 + 1}\ntest\`,"\n\\\`\ntest");`;
  const result = withIndent(code, 2);
  assertEquals(
    result,
    `  console.log(\`\${1 + 1}\ntest\`,"\n  \\\`\n  test");`,
  );
});

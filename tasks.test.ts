import { buildTasks } from "./tasks.ts";
import { CompiledContext } from "./interface.ts";
import { assertEquals } from "./deps.ts";
const compiledContext: CompiledContext = {
  env: {},
  os: {},
};
const cacheDist = ".ysh/cache";
Deno.test("compileTasks tasks #1", async () => {
  const result = await buildTasks([
    {
      use: "console.log",
      args: [
        "hello",
        "${env.name}",
      ],
    },
  ], {
    compiledContext,
    dist: cacheDist,
    relativePath: "./tast1.yml",
  });
  const expected = await Deno.readTextFile("./__fixtures__/tast1.module.js");
  assertEquals(result.moduleFileCode, expected);
});
Deno.test("compileTasks tasks loop #2", async () => {
  const result = await buildTasks([
    {
      loop: [
        1,
        "secondItem",
      ],
      use: "console.log",
      args: [
        "hello",
        "${item}",
        "${index}",
        "${index+1}1234567",
      ],
    },
  ], {
    compiledContext,
    dist: cacheDist,
    relativePath: "./tast1.yml",
  });
  const expected = await Deno.readTextFile("./__fixtures__/tast1.module.js");
  assertEquals(result.moduleFileCode, expected);
});

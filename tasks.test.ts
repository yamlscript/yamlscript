import { buildTasks, runTasks } from "./tasks.ts";
import { Task } from "./interface.ts";
import { assertEquals } from "./deps.ts";
import { parseYamlFile } from "./util.ts";
import pkg from "./pkg.json" assert { type: "json" };

const cacheDist = "." + pkg.full + "/__fixtures__";
Deno.test("getCompiledCode tasks #1", async () => {
  const result = await buildTasks([
    {
      use: "console.log",
      args: [
        "hello",
        "${env.name}",
      ],
    },
  ], {
    dist: cacheDist,
    relativePath: "./tast1.yml",
  });
  const expected = await Deno.readTextFile(
    "./examples/__fixtures__/tast1.js",
  );
  assertEquals(result.moduleFileCode, expected);
});
Deno.test("getCompiledCode tasks loop #2", async () => {
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
    dist: cacheDist,
    relativePath: "./tast2.yml",
  });
  const expected = await Deno.readTextFile(
    "./examples/__fixtures__/tast2.js",
  );
  assertEquals(result.moduleFileCode, expected);
});
Deno.test("getCompiledCode tasks #3", async () => {
  const result = await buildTasks([
    {
      from: "https://deno.land/std@0.148.0/path/mod.ts",
      use: "extname",
      args: "test.ys.yml",
    },
    {
      use: "console.log",
      args: ["${result}"],
    },
  ], {
    dist: cacheDist,
    relativePath: "./tast3.yml",
  });
  const expected = await Deno.readTextFile(
    "./examples/__fixtures__/tast3.js",
  );
  assertEquals(result.moduleFileCode, expected);
});
Deno.test("getCompiledCode full tasks #4", async () => {
  const tasks = await parseYamlFile(
    "./examples/full.ys.yml",
  ) as Task[];
  const result = await buildTasks(tasks, {
    dist: cacheDist,
    relativePath: "./full.ys.yml",
  });
  // const expected = await Deno.readTextFile("./__fixtures__/tast3.js");
  // assertEquals(result.moduleFileCode, expected);
});
Deno.test("test if condition #5", async () => {
  const tasks = await parseYamlFile(
    "./examples/if.ys.yml",
  ) as Task[];
  await runTasks(tasks);
});

Deno.test("getCompiledCode tasks #6", async () => {
  const result = await buildTasks([
    {
      use: ":echo",
      args: [
        "hello",
        "world",
      ],
    },
  ], {
    dist: cacheDist,
    relativePath: "./tast6.yml",
  });
  // TODO
  // const expected = await Deno.readTextFile(
  //   "./examples/__fixtures__/tast6.js",
  // );
  // assertEquals(result.moduleFileCode, expected);
});

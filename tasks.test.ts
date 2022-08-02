import {
  buildTasks,
  getDefaultTaskOptions,
  getDefaultTasksContext,
  getDependencies,
  runTasks,
  transformMeta,
} from "./tasks.ts";
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
    dev: true,
  });
  const expected = await Deno.readTextFile(
    "./examples/__fixtures__/tast1.js",
  );
  assertEquals(result.code, expected);
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
    dev: true,
  });
  const expected = await Deno.readTextFile(
    "./examples/__fixtures__/tast2.js",
  );
  assertEquals(result.code, expected);
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
    dev: true,
  });
  const expected = await Deno.readTextFile(
    "./examples/__fixtures__/tast3.js",
  );
  assertEquals(result.code, expected);
});
Deno.test("getCompiledCode full tasks #4", async () => {
  const tasks = await parseYamlFile(
    "./examples/full.ys.yml",
  ) as Task[];
  const result = await buildTasks(tasks, {
    dist: cacheDist,
    relativePath: "./full.ys.yml",
    dev: true,
  });
  // const expected = await Deno.readTextFile("./__fixtures__/tast3.js");
  // assertEquals(result.code, expected);
});
Deno.test("test if condition #5", async () => {
  const tasks = await parseYamlFile(
    "./examples/if.ys.yml",
  ) as Task[];
  await runTasks(tasks, { dev: true });
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
    dev: true,
  });
  // TODO
  // const expected = await Deno.readTextFile(
  //   "./examples/__fixtures__/tast6.js",
  // );
  // assertEquals(result.code, expected);
});
Deno.test("getCompiledCode tasks #7", async () => {
  const result = await buildTasks([
    {
      use: "new Date",
    },
  ], {
    dist: cacheDist,
    relativePath: "./tast7.yml",
    dev: true,
  });
  const expected = await Deno.readTextFile(
    "./examples/__fixtures__/tast7.js",
  );
  assertEquals(result.code, expected);
});

Deno.test("transformMeta tasks#8", () => {
  const taskId = "1";
  const originalTask: Task = {
    from: "https://example.com",
    use: "render as render2",
  };
  const task = getDefaultTaskOptions(originalTask, {
    taskId,
  });
  const ctx = getDefaultTasksContext();
  const meta = transformMeta(task, ctx);
  assertEquals(
    meta.topLevelCode,
    'import { render as render2 } from "https://example.com";\n',
  );
});
Deno.test("transformMeta tasks#9", () => {
  const taskId = "1";
  const originalTask: Task = {
    from: "https://example.com",
    use: "new Render",
  };
  const task = getDefaultTaskOptions(originalTask, {
    taskId,
  });
  const ctx = getDefaultTasksContext();
  const meta = transformMeta(task, ctx);
  assertEquals(
    meta.topLevelCode,
    'import { Render } from "https://example.com";\n',
  );
  assertEquals(meta.isInstance, true);
});
Deno.test("transformMeta tasks#10", () => {
  const taskId = "1";
  const originalTask: Task = {
    from: "https://example.com",
    use: '$"Hello".slice',
  };
  const task = getDefaultTaskOptions(originalTask, {
    taskId,
  });
  const ctx = getDefaultTasksContext();
  const meta = transformMeta(task, ctx);
  assertEquals(
    meta.topLevelCode,
    "",
  );
  assertEquals(meta.use, '"Hello".slice');
});

Deno.test("test get dependencies #11", async () => {
  const result = await getDependencies([
    {
      from: "./examples/__fixtures__/dependent.ys.yml",
      use: "hello",
    },
  ]);
  assertEquals(result.length, 3);
});

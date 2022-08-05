import {
  getDefaultTaskOptions,
  getDefaultTasksContext,
  getDependencies,
  runJs,
  runTasks,
  transformMeta,
} from "./tasks.ts";
import { Task } from "./interface.ts";
import { assertEquals, assertRejects } from "./deps.ts";
import { parseYamlFile } from "./util.ts";

Deno.test("test if condition #5", async () => {
  const tasks = await parseYamlFile(
    "./examples/if.ys.yml",
  ) as Task[];
  await runTasks(tasks, { dev: true });
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

Deno.test("runjs #12", async () => {
  await assertRejects(() => {
    return runJs("./examples/__fixtures__/throw.js");
  }, "This is an error");
});

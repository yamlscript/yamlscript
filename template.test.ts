import { assertEquals, assertThrows, parse, parseAll } from "./deps.ts";
import {
  convertValueToLiteral,
  getConditionResult,
  isIncludeTemplate,
  precompile,
  template,
  templateWithKnownKeys,
} from "./template.ts";
// Simple name and function, compact form, but not configurable
Deno.test("template #1", () => {
  const result = template("Test ${name}", {
    name: "Deno",
  });

  assertEquals(result, "Test Deno");
});

Deno.test("template #2", () => {
  assertThrows(
    () => {
      template(
        "Test ${item.test.name} ${item.test.name} ${} ",
        {
          name: "Deno",
          item: {
            test: {
              name: "Deno",
            },
          },
        },
      );
    },
    Error,
    "Unexpected token '}'",
  );
});

Deno.test("template #3", () => {
  const result = template("Test ${name} ${ name.toUpperCase() }", {
    name: "Deno",
  });

  assertEquals(result, "Test Deno DENO");
});
Deno.test("template #4", () => {
  const result = template("${ JSON.stringify({content:name}) }", {
    name: "Deno",
  });

  assertEquals(result, JSON.stringify({ content: "Deno" }));
});

Deno.test("template #5", () => {
  const result = template("${json}", {
    json: JSON.stringify({ content: "Deno" }),
  });

  assertEquals(result, '{"content":"Deno"}');
});

Deno.test("template #6", () => {
  assertThrows(
    () => {
      template(
        "${ } ${} ${ item.test.name }",
        {
          name: "Deno",
          item: {
            test: {
              name: "Deno",
            },
          },
        },
      );
    },
    Error,
    "Invalid template variable: ${ }",
  );
});
Deno.test("precompile #7", () => {
  const result = precompile("Test ${name}", ["name"]);
  assertEquals(
    result,
    "{\"main\":function(__yamlscript_context){var name=__yamlscript_context['name'];;return `Test ${name}`}}",
  );
});

Deno.test("precomiple #8", () => {
  const specs = {
    "main": function (__yamlscript_context: Record<string, unknown>) {
      const name = __yamlscript_context["name"];
      return `Test ${name}`;
    },
  };
  const result = template(specs, { name: "Deno" });
  assertEquals(result, "Test Deno");
});

Deno.test("precompile #9", () => {
  const result = precompile("Test ${name}xxx${title}", ["name", "title"]);
  assertEquals(
    result,
    "{\"main\":function(__yamlscript_context){var name=__yamlscript_context['name'];var title=__yamlscript_context['title'];;return `Test ${name}xxx${title}`}}",
  );
});

Deno.test("isIncludeTemplate #10", () => {
  const result = isIncludeTemplate("Test \\${name}");
  assertEquals(result, false);
});

Deno.test("isIncludeTemplate #10", () => {
  const result = isIncludeTemplate("Test ${name}");
  assertEquals(result, true);
});

Deno.test("isIncludeTemplate #11", () => {
  const result = isIncludeTemplate("Test ${test} \\${name}");
  assertEquals(result, true);
});

Deno.test("convertValueToLiteral #12", () => {
  const result = convertValueToLiteral({
    content: "Deno",
    name: "${name}222",
    os: "${build.os.name}",
    obj: {
      name: "test${build.os.name}22",
    },
  }, {
    build: {
      env: {},
      os: {
        "name": "macos",
      },
    },
  });
  assertEquals(typeof result, "string");
  assertEquals(
    result,
    `{
  "content" : \`Deno\`,
  "name" : \`\${name}222\`,
  "os" : \`macos\`,
  "obj": {
    "name" : \`testmacos22\`
  }
}`,
  );
});
Deno.test("getConditionResult #13", () => {
  const result = getConditionResult("build.os.name === 'macos'", {
    build: {
      env: {},
      os: {
        "name": "macos",
      },
    },
  });
  assertEquals(
    result,
    true,
  );
});
Deno.test("getConditionResult #14", () => {
  const result = getConditionResult("build.os.name === 'linux'", {
    build: {
      env: {},
      os: {
        "name": "macos",
      },
    },
  });
  assertEquals(
    result,
    false,
  );
});
Deno.test("getConditionResult #15", () => {
  const result = getConditionResult("env.name === 'linux'", {
    build: {
      env: {},
      os: {
        "name": "macos",
      },
    },
  });
  assertEquals(
    result,
    "env.name === 'linux'",
  );
});
Deno.test("getConditionResult #16", () => {
  const result = getConditionResult("${test===2}", {
    build: {
      env: {},
      os: {
        "name": "macos",
      },
    },
  });
  assertEquals(
    result,
    "`${test===2}`",
  );
});

Deno.test("convertValueToLiteral #17", () => {
  const result = convertValueToLiteral([
    "${typeof var2}",
    "undefined",
  ], {
    build: {
      env: {},
      os: {
        "name": "macos",
      },
    },
  });
  assertEquals(typeof result, "string");
  assertEquals(
    result,
    `[
  \`\${typeof var2}\`,
  \`undefined\`
]`,
  );
});

Deno.test("escape Apostrophe #18", () => {
  const str = "As you see, we use `loop`";
  const result = templateWithKnownKeys(str, {});
  assertEquals(result, "`As you see, we use \\`loop\\``");
});

Deno.test("escape Apostrophe #19", () => {
  const str =
    "As you see, we use `loop` to define a loop, it can be an literal array, like above, and you can access the item by using \\${item}, the index by using \\${index}, just like javascript template strings. You will use `use` to call a function, it can be any global function from deno. We also have some yamlscript built-in functions, for example, we have `rss.entries` function, which can help you to get the fedd entries. (you can see all built-in function here https://github.com/yamlscript/yamlscript/blob/main/globals/mod.ts )";
  const result = templateWithKnownKeys(str, {});
  assertEquals(
    result,
    "`As you see, we use \\`loop\\` to define a loop, it can be an literal array, like above, and you can access the item by using \\${item}, the index by using \\${index}, just like javascript template strings. You will use \\`use\\` to call a function, it can be any global function from deno. We also have some yamlscript built-in functions, for example, we have \\`rss.entries\\` function, which can help you to get the fedd entries. (you can see all built-in function here https://github.com/yamlscript/yamlscript/blob/main/globals/mod.ts )`",
  );
});

Deno.test("yaml test #20", () => {
  const result = parse("name: test \\${item}");
  assertEquals(result, {
    name: "test \\${item}",
  });
});
Deno.test("convertValueToLiteral #21", () => {
  const result = convertValueToLiteral({
    content: "$var",
  });
  assertEquals(result, '{\n  "content" : var\n}');
});

Deno.test("convert Va #22", () => {
  const result = parseAll(`
apiVersion: v1
kind: Service
metadata:
  name: mock
spec:
...
---
apiVersion: v1
kind: ReplicationController
metadata:
  name: mock
spec:
...  
`) as string[];
  assertEquals(result.length, 2);
});

Deno.test("convert Va #23", () => {
  const result = convertValueToLiteral({ cat: 10 });
  assertEquals('{\n  "cat" : 10\n}', result);
});
Deno.test("convert Va #24", () => {
  const result = convertValueToLiteral(["Hello", true]);
  assertEquals("[\n  `Hello`,\n  true\n]", result);
});

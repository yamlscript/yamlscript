import { assertEquals, assertThrows } from "./deps.ts";
import {
  convertValueToLiteral,
  getConditionResult,
  isIncludeTemplate,
  precompile,
  template,
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
    '{"content":"Deno","name":`${name}222`,"os":"macos",  "obj": {"name":"testmacos22"  }}',
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

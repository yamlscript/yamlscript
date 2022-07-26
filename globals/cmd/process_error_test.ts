import {
  assert,
  assertEquals,
  assertObjectMatch,
  assertRejects,
} from "../../deps.ts";
import { $, ProcessError } from "./mod.ts";

// import { assertRejects } from "../../../inbox/deno_std/testing/asserts.ts";

function createError(): ProcessError {
  return new ProcessError({
    stdout: "foo",
    stderr: "bar",
    combined: "baz",
    retries: 0,
    status: {
      code: 1,
      success: false,
      signal: undefined,
    },
  });
}

Deno.test({
  name: "[process error] should be an instance of error",
  fn() {
    const error = createError();
    assert(error instanceof Error);
    assert(error instanceof ProcessError);
  },
});

Deno.test({
  name: "[process error] should have all properties defined",
  fn() {
    const error = createError();
    assertEquals(error.stdout, "foo");
    assertEquals(error.stderr, "bar");
    assertEquals(error.combined, "baz");
    assertEquals(error.retries, 0);
    assertObjectMatch(error.status, {
      code: 1,
      success: false,
      signal: undefined,
    });
  },
});

Deno.test({
  name: "[process error] should throw an instance of error #5",
  async fn() {
    await assertRejects(() => $`exit 1`, Error);
  },
});

Deno.test({
  name: "[process error] should throw an instance of process error #6",
  async fn() {
    await assertRejects(() => $`exit 1`, ProcessError);
  },
});

Deno.test({
  name: "[process error] should have correct exit code #7",
  async fn() {
    const statusCode = await $`exit 2`.catch((error) =>
      error instanceof ProcessError ? error.status.code : null
    );
    assertEquals(statusCode, 2);
  },
});

import { configDir } from "./user.ts";
Deno.test("user test", () => {
  console.log("configDir", configDir);
});

import { extname } from "https://deno.land/std@0.148.0/path/mod.ts";
export default async function main(){
  let result = null, ctx = null, env = null;
  result = await extname(`test.ys.yml`);
  console.log("Task #0 done.");
  result = await console.log(`${result}`);
  console.log("Task #1 done.");
}
if (import.meta.main) {
  main();
}
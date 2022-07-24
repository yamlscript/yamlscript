import { extname } from "https://deno.land/std@0.148.0/path/mod.ts";
export default async function main(){
  let result = null;

  // Task #0
  result = await extname(`test.ys.yml`);

  // Task #1
  result = await console.log(`${result}`);
}
if (import.meta.main) {
  main();
}
import { assertEquals } from "https://raw.githubusercontent.com/yamlscript/yamlscript/main/globals/mod.ts";
import { _ } from "https://raw.githubusercontent.com/yamlscript/yamlscript/main/globals/mod.ts";
export default async function main(){
  let result=null, ctx=null, env=null;
  const allItems=[1,9,"undefined"];
  const test2="teset";
  console.log(`Task #0 done.`);
  result = await Math.max(1,5,3);
  console.log(`Task #1 get max value done.`);
  result = await assertEquals(result,5);
  console.log(`Task #2 done.`);
  result = await _.get({"foo": {"key":"bar"}},"foo.key");
  console.log(`Task #3 call lodash method get done.`);
  result = await assertEquals(result,"bar");
  console.log(`Task #4 done.`);
  console.log(`Task #5 done.`);
}
if (import.meta.main) {
  main();
}
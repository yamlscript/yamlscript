import { __yamlscript_create_process } from "https://raw.githubusercontent.com/yamlscript/yamlscript/main/runtimes/cmd/mod.ts";
export default async function main(){
  let result=null, ctx=null, env=null;
  const __yamlscript_default_use_0 =  __yamlscript_create_process("hello","world");
  result = await __yamlscript_default_use_0`echo`;
  console.log(`Task #0 done.`);
}
if (import.meta.main) {
  main();
}
import { __yamlscript_create_process } from "https://raw.githubusercontent.com/yamlscript/yamlscript/main/runtimes/cmd/mod.ts";
const __yamlscript_default_use_0 = echo;
export default async function main(){
  let result = null;

  // Task #0
  const __yamlscript_default_use_0 =  __yamlscript_create_process(`hello`,`world`);
  result = await __yamlscript_default_use_0`echo`;
}
if (import.meta.main) {
  main();
}
import { extname } from "https://deno.land/std@0.148.0/path/mod.ts";
export default async function main(){
  let result=null, ctx=null, env=null;
  result = await extname("test.ysh.yml");
  result = await console.log(`${result}`);
}
import { assertEquals } from "https://raw.githubusercontent.com/theowenyoung/ysh/main/globals/mod.ts";
const setLiteralVars=true;
const setStr=true;
export default async function main(){
  let result=null, ctx=null, env=null;
  const var1=true;
  result = await assertEquals(var1,true);
  result = await assertEquals("undefined","undefined");
  const condition=true;
if (condition) {
}
  result = await assertEquals(setLiteralVars,true);
  const str="hello";
if (str === "hello") {
}
  result = await assertEquals(setStr,true);
}
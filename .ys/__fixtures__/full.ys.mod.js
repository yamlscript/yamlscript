import { assertEquals } from "https://raw.githubusercontent.com/theowenyoung/ysh/main/globals/mod.ts";
import { _ } from "https://raw.githubusercontent.com/theowenyoung/ysh/main/globals/mod.ts";
export default async function main(){
  let result=null, ctx=null, env=null;
  const allItems=[1,9,"${build.env.1}"];
  const test2="teset";
  result = await Math.max(1,5,3);
  result = await assertEquals(result,5);
  result = await _.get({  "foo": {"key":"bar"  }},"foo.key");
  result = await assertEquals(result,"bar");
}
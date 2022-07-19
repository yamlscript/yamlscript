import { setVars } from "https://raw.githubusercontent.com/theowenyoung/yaas/main/globals/mod.ts";
import { fetchRSS } from "https://raw.githubusercontent.com/theowenyoung/yaas/main/globals/mod.ts";
import {extname} from "https://deno.land/std@0.148.0/path/mod.ts";
import { setVars } from "https://raw.githubusercontent.com/theowenyoung/yaas/main/globals/mod.ts";
export default async function main(){
let result=null,ctx=null,env=null;
const test="test";
const test2="teset";
result = await fetchRSS("https://actionsflow.github.io/test-page/hn-rss.xml");
result = await console.log(`test${result}`,"test",{"test":"test","name":"test2","value":`${result}`});
result = await extname("test.js");
const test3=`${result}`;
const test4="teset";
result = await console.log(`${result}`);
result = await fetch("https://enyvb91j5zjv9.x.pipedream.net/",{"method":"PPP",  "headers": {"Content-Type":"application/json"  },"body":"${JSON.stringify({test:1})}"});

}
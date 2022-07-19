import { fetchRSS } from "https://raw.githubusercontent.com/theowenyoung/yaas/main/globals/mod.ts";
import {extname} from "https://deno.land/std@0.148.0/path/mod.ts";
export default async function main(){
let result=null,ctx=null,env=null;
result = await fetchRSS("https://actionsflow.github.io/test-page/hn-rss.xml");
result = await console.log("test");
result = await extname("test.js");
result = await console.log(`${result}`);
result = await fetch("https://enyvb91j5zjv9.x.pipedream.net/",{"method":"PPP",  "headers": {"Content-Type":"application/json"  },"body":"${JSON.stringify({test:1})}"});

}
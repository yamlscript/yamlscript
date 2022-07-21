import { rss } from "https://raw.githubusercontent.com/theowenyoung/ysh/main/globals/mod.ts";
const nowIsGreaterThanZero=true;
import { assertEquals } from "https://raw.githubusercontent.com/theowenyoung/ysh/main/globals/mod.ts";
export default async function main(){
  let result=null, ctx=null, env=null;
  {
    const item = "I'm so excited to explain 'YS' with 'YS'!";
    const index = 0;
    result = await console.log(`${index}. ${item}`);
  }
  {
    const item = "What is it?";
    const index = 1;
    result = await console.log(`${index}. ${item}`);
  }
  {
    const item = "YS is written in yaml format and can be compiled into javscript that runs in deno.";
    const index = 2;
    result = await console.log(`${index}. ${item}`);
  }
  {
    const item = "What can it do?";
    const index = 3;
    result = await console.log(`${index}. ${item}`);
  }
  {
    const item = "We can use it to manage our dotfiles, workflows like send feed entries to chat room, or we can even choose to deploy it to a serverless server such as deno deploy.";
    const index = 4;
    result = await console.log(`${index}. ${item}`);
  }
  result = await rss.entries("https://actionsflow.github.io/test-page/hn-rss.xml");
  for(let index = 0; index < result.length; index++){
    const item = result[index];
    result = await fetch("https://enyvb91j5zjv9.x.pipedream.net/",{"method":"POST",  "headers": {"Content-Type":"application/json"  },"body":`{
      "title": "${item.title.value}",
      "link":  "${item.links[0].href}"
    }
    `});
  }
  result = await assertEquals(nowIsGreaterThanZero,true);
}
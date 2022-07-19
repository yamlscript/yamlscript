import { fetchRSS } from "https://raw.githubusercontent.com/theowenyoung/yaas/main/global/mod.ts";
export default async function main(){
await fetchRSS("https://actionsflow.github.io/test-page/hn-rss.xml");
await console.log("yes");
await fetch("https://enyvb91j5zjv9.x.pipedream.net/",{"method":"POST","headers":{"Content-Type":"application/json"},"body":"{\"test\":1}"});

}
import { serve } from "https://deno.land/std@0.145.0/http/server.ts";
import { fetchRSS } from "https://raw.githubusercontent.com/theowenyoung/yaas/main/global/mod.ts";


serve(async (req: Request) => {

  await fetchRSS("https://actionsflow.github.io/test-page/hn-rss.xml");
  await fetch("https://enyvb91j5zjv9.x.pipedream.net/",{"method":"POST","headers":{"Content-Type":"application/json"},"body":"{\"test\":1}"});
  
  const response =new Response("Hello World");

  return response;

});


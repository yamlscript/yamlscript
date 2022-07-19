import { serve } from "https://deno.land/std@0.145.0/http/server.ts";
import main from "./dist/examples/rss-notify.module.js";


serve(async (req: Request) => {

  const result = await main();
  console.log("result",result)
  const response =new Response("Hello World");

  return response;

});


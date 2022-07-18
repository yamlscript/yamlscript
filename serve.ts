import { serve } from "https://deno.land/std@0.145.0/http/server.ts";
import Mustache from "https://esm.sh/mustache@4.2.0";

serve((req: Request) => {

  const view = {
    title: "Joe",
    calc: function () {
      return 2 + 4;
    }
  };
  
  const output = Mustache.render("{{title}} spends {{calc}}", view);
  const response =new Response("Hello World"+output);

  return response;

});
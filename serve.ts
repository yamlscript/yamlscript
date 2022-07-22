import { serve } from "https://deno.land/std@0.145.0/http/server.ts";
import main from "./dist/README.js";

serve(async (req: Request) => {
  const result = await main();
  const response = new Response("Hello World");

  return response;
});

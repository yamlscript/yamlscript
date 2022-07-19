import {escapeJSON} from "./util.ts";
import {assertEquals} from './deps.ts';
Deno.test("escape json #1",()=>{
  const result = escapeJSON('{"name":"Deno"}');
  // const xx = JSON.stringify({root:'{"name":"Deno"}'});

  const xx = JSON.parse(`{"name":"${result}"}`);

  
  
  // assertEquals(result,'{\"name\":\"Deno\"}');

})
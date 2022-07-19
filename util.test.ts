import {escapeJSON} from "./util.ts";
import {assertEquals} from './deps.ts';
Deno.test("escape json 1",()=>{
  const result = escapeJSON('{"name":"Deno"}');
  // const xx = JSON.stringify({root:'{"name":"Deno"}'});
  console.log('result',result);

  const xx = JSON.parse(`{"name":"${result}"}`);
  console.log('xx',xx);
  
  
  // assertEquals(result,'{\"name\":\"Deno\"}');

})
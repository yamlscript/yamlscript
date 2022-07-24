import { assertEquals } from "../../globals/mod.ts";
import { _ } from "../../globals/mod.ts";
export default async function main(){
  let result = null;

  // Task #0
  let allItems = [
    1,
    9,
    `undefined`
  ];
  let test2 = `teset`;

  // Task #1: get max value
  result = await Math.max(1,5,3);

  // Task #2
  result = await assertEquals(result,5);

  // Task #3: call lodash method get
  result = await _.get({
    "foo": {
      "key" : `bar`
    }
  },`foo.key`);

  // Task #4
  result = await assertEquals(result,`bar`);

  // Task #5
}
if (import.meta.main) {
  main();
}
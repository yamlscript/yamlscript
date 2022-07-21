async function main() {
const { assertEquals } = __ysh_runtime_options.globals;
const setLiteralVars=true;
const setStr=true;

  let result=null, ctx=null, env=null;
  const var1=true;
  result = await assertEquals(var1,true);
  result = await assertEquals("undefined","undefined");
  const condition=true;
if (condition) {
}
  result = await assertEquals(setLiteralVars,true);
  const str="hello";
if (str === "hello") {
}
  result = await assertEquals(setStr,true);

}
main();
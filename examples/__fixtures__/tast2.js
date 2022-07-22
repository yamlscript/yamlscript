export default async function main(){
  let result = null, ctx = null, env = null;
  {
    const item = 1;
    const index = 0;
    result = await console.log(`hello`,`${item}`,`${index}`,`${index+1}1234567`);
  }
  {
    const item = `secondItem`;
    const index = 1;
    result = await console.log(`hello`,`${item}`,`${index}`,`${index+1}1234567`);
  }
  console.log("Task #0 done.");
}
if (import.meta.main) {
  main();
}
export default async function main(){
  let result = null, ctx = null, env = null;
  result = await console.log(`hello`,`${env.name}`);
  console.log("Task #0 done.");
}
if (import.meta.main) {
  main();
}
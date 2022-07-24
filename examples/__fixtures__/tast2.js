export default async function main(){
  let index = 0;
  let result = null;

  // Task #0
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
}
if (import.meta.main) {
  main();
}
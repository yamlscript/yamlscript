export default async function main(){
let result=null,ctx=null,env=null;
const allItems=[1,9];
const test2="teset";
    {
      const item = 1;
      const index = 0;
      result = await console.log(`${item}`,`${index}`,`${item}`,`${index}`);
    }
  {
    const item = `${test2}`;
    const index = 1;
    result = await console.log(`${item}`,`${index}`,`${item}`,`${index}`);
  }

}
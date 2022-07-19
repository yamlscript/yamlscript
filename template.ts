

import {TemplateSpecs} from './internal-interface.ts';
import {TEMPLATE_REGEX} from './constant.ts';
export function isIncludeTemplate(str:string){
  if (typeof str !== 'string') {
    throw new Error('The argument must be a string type');
  }
  const matches = str.matchAll(TEMPLATE_REGEX);
    for (const match of matches) {
      if(match[0][0]==='\\'){
        continue;
      }else{
        return true;
      }
      
    }
    return false;
 
}

/**
 * 
 * @param str 
 * @param keys buildin keywords
 * @returns 
 */
export function compile(str:string,keys:string[]):(locals:Record<string,unknown>)=>string {
  if (typeof str !== 'string') {
    throw new Error('The argument must be a string type');
  }

  const declare = getRootKeysDeclare(keys);

  return function(locals:Record<string,unknown>) {
    let fnString = declare+';return `';
    fnString+= str.replace(TEMPLATE_REGEX, variableToEs6TemplateString)+'`;';
    
    const fn = new Function('__yaas_context',fnString);
    return fn(locals);
  }
}

export function precompile(str:string,keys:string[]):string {
  if (typeof str !== 'string') {
    throw new Error('The argument must be a string type');
  }
  const declare = getRootKeysDeclare(keys);

  let fnString = '{"main":function(__yaas_context){'+declare+';return `';
  fnString+= str.replace(TEMPLATE_REGEX,variableToEs6TemplateString);
  fnString+='`}}';
  return fnString;
}


function variableToEs6TemplateString(matched:string):string {
  const matches = matched.match(/\{(.*)\}/);
      let exp = "";      
      if(matches) {
       exp= matches[1].trim();
       if(exp===""){
        throw new Error(`Invalid template variable: ${matched}`);
       }
      }else{
        throw new Error(`Invalid template variable: ${matched}`);
      }
      if (matched[0] === '\\') {
        return matched.slice(1)
      }
      return `\${${exp}}`;
        // return '${__yaas_escapeJSON(' + exp+")}";
}

function getRootKeysDeclare(keys:string[]):string {
//   let declare = `;var __yaas_escapeJSON = function(str){
// const result= str
// .replace(/[\\\\]/g, '\\\\\\\\')
// .replace(/[\\"]/g, '\\\\\\"')
// .replace(/[\\/]/g, '\\/')
// .replace(/[\\b]/g, '\\b')
// .replace(/[\\f]/g, '\\f')
// .replace(/[\\n]/g, '\\n')
// .replace(/[\\r]/g, '\\r')
// .replace(/[\\t]/g, '\\t');
// return result;
//   };`;  
let declare="";
  for (const key of keys) {
    declare += 'var ' + key + "=__yaas_context['" + key + "'];";
  }
  return declare;
}


export function template(str:string | TemplateSpecs, locals:Record<string,unknown>):string {
  if (typeof str === 'string') {
    return compile(str,Object.keys(locals))(locals)
  }else{
    return str.main(locals);
  }
}





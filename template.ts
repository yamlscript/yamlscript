import { TemplateSpecs } from "./_interface.ts";
import { PublicContext } from "./interface.ts";
import { INTERNAL_CONTEXT_NAME, TEMPLATE_REGEX } from "./constant.ts";
import { isObject } from "./util.ts";
import log from "./log.ts";
export function isIncludeTemplate(str: string) {
  if (typeof str !== "string") {
    throw new Error("The argument must be a string type");
  }
  const matches = str.matchAll(TEMPLATE_REGEX);
  for (const match of matches) {
    if (match[0][0] === "\\") {
      continue;
    } else {
      return true;
    }
  }
  return false;
}
/**
 * is template is a variable, like `$identifier`
 * $0 is not, cause 0 is not a verifieriable variable name
 * \$ is also not, must start with $
 * @param str
 * @returns
 */
export function isVariable(str: string) {
  if (str.length > 1) {
    return str[0] === "$" && /[a-zA-Z_$.]/.test(str[1]);
    // return str[0] === "$" && /[a-zA-Z_$]/.test(str[1]) &&
    //   /[0-9a-zA-Z_$]+/.test(str.slice(1));
  } else {
    return false;
  }
}
// <https://stackoverflow.com/a/69292370/13135979>
export function isCommand(str: string | undefined) {
  if (str && str.length > 1) {
    return str[0] === ":" &&
      /[^#%0-9\0-\f "$&'();<>\`|\x7f-\xff]/.test(
        str[1],
      );
  } else {
    return false;
  }
}
export function getCommand(str: string | undefined): string {
  if (str === undefined) {
    throw new Error("invalid cmd program");
  }
  if (str.startsWith(":")) {
    return str.slice(1);
  } else {
    return str;
  }
}
/**
 * @param str
 * @param keys buildin keywords
 * @returns
 */
export function compile(
  str: string,
  keys: string[],
): (locals: Record<string, unknown>) => string {
  if (typeof str !== "string") {
    throw new Error("The argument must be a string type");
  }

  const declare = getRootKeysDeclare(keys);

  return function (locals: Record<string, unknown>): string {
    // check if include template first
    let fnString = declare;

    fnString += ";return `";

    fnString += str.replace(TEMPLATE_REGEX, variableToEs6TemplateString);

    fnString += "`;";

    try {
      const fn = new Function(INTERNAL_CONTEXT_NAME, fnString);
      return fn(locals);
    } catch (error) {
      error.message += "\nrun function string failed: " + fnString + "\n";
      error.message += "args: " + JSON.stringify(locals, null, 2);
      throw error;
    }
  };
}

export function precompile(str: string, keys: string[]): string {
  if (typeof str !== "string") {
    throw new Error("The argument must be a string type");
  }
  const declare = getRootKeysDeclare(keys);

  let fnString = '{"main":function(' + INTERNAL_CONTEXT_NAME + "){" + declare +
    ";return `";
  fnString += str.replace(TEMPLATE_REGEX, variableToEs6TemplateString);
  fnString += "`}}";
  return fnString;
}

function variableToEs6TemplateString(matched: string): string {
  const matches = matched.match(/\{(.*)\}/);
  let exp = "";
  if (matches) {
    exp = matches[1].trim();
    if (exp === "") {
      throw new Error(`Invalid template variable: ${matched}`);
    }
  } else {
    throw new Error(`Invalid template variable: ${matched}`);
  }
  if (matched[0] === "\\") {
    return matched.slice(1);
  }
  return `\${${exp}}`;
  // return '${__yamlscript_escapeJSON(' + exp+")}";
}

function getRootKeysDeclare(keys: string[]): string {
  //   let declare = `;var __yamlscript_escapeJSON = function(str){
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
  let declare = "";
  for (const key of keys) {
    declare += "var " + key + "=" + INTERNAL_CONTEXT_NAME + "['" + key + "'];";
  }
  return declare;
}

export function template(
  str: string | TemplateSpecs,
  locals: Record<string, unknown>,
): unknown {
  if (typeof str === "string") {
    return compile(str, Object.keys(locals))(locals);
  } else {
    return str.main(locals);
  }
}

function variableToEs6TemplateStringOnlyForKnownKeys(
  matched: string,
  locals?: Record<string, unknown>,
): string {
  const matches = matched.match(/\{(.*)\}/);
  let exp = "";
  if (matches) {
    exp = matches[1].trim();
    if (exp === "") {
      throw new Error(`Invalid template variable: ${matched}`);
    }
  } else {
    throw new Error(`Invalid template variable: ${matched}`);
  }
  if (matched[0] === "\\") {
    return matched;
  }
  let result = matched;

  // check if it's typeof, cause typeof will never fail, even in compiled time.
  // we should check typeof params first
  if (exp.includes("typeof")) {
    // then try to remove it and to test
    // TODO
    // temply treat it as runtime
    return result;
  }

  try {
    result = getExpressResult(exp, locals);
  } catch (e) {
    if (e instanceof ReferenceError) {
      // dont't know the expression when compile time
      // it's okay, cause we don't know the value of the key
    } else {
      throw e;
    }
  }
  return result;

  // return '${__yamlscript_escapeJSON(' + exp+")}";
}
/**
 * if failed, then it's not possible to get this when compiled
 * @param exp
 * @param locals
 * @returns
 */
export function getExpressResult(
  exp: string,
  locals?: Record<string, unknown>,
): string {
  const knownKeys = Object.keys(locals || {});
  const declare = getRootKeysDeclare(knownKeys);
  const fnString = `${declare}return \`\${${exp}}\``;
  try {
    const fn = new Function(INTERNAL_CONTEXT_NAME, fnString);
    const tempResult = fn(locals);
    let result = "";
    if (typeof tempResult === "string") {
      result = tempResult;
    } else {
      result = JSON.stringify(tempResult);
    }
    return result;
  } catch (error) {
    error.message += "\nrun function string failed: " + fnString + "\n";
    error.message += "args: " + JSON.stringify(locals, null, 2);
    throw error;
  }
}
export const templateWithKnownKeys = (
  str: string,
  locals?: Record<string, unknown>,
): string => {
  if (typeof str !== "string") {
    throw new Error("The argument must be a string type");
  }

  let parsed = str.replace(TEMPLATE_REGEX, (matched) => {
    return variableToEs6TemplateStringOnlyForKnownKeys(matched, locals);
  });
  if (isIncludeTemplate(parsed)) {
    parsed = `\`${parsed}\``;
  }
  parsed = surroundQuotes(parsed);
  return parsed;
};
function surroundQuotes(str: string): string {
  // check if start with `
  const trimStr = str.trim();
  let final = "";
  if (trimStr[0] === "`" && trimStr[trimStr.length - 1] === "`") {
    const pureStr = trimStr.slice(1, trimStr.length - 1);
    final = `\`${escapeApostrophe(pureStr)}\``;
  } else {
    final = `\`${escapeApostrophe(str)}\``;
  }
  return (final);
}

function escapeApostrophe(str: string) {
  const result = str.replace(/`/g, "\\`");
  return result;
}

/**
 * @param value
 * @param ctx
 * @returns
 * @description this will convert json object to literal object, so deno can parse it efficiently
 * @example
 * const json = JSON.stringify({
 * "a": 1,
 * "b":"${result}",
 * "c": {
 *  "d": "${result}",
 * });
 * this will return
 * const json = {
 * "a": 1,
 * "b": `${result}`,
 * "c": {
 * "d": `${result}`,
 * }
 * }
 */

export function convertValueToLiteral(
  value: unknown,
  publicCtx?: Record<string, unknown>,
): string {
  if (isObject(value) || Array.isArray(value)) {
    // split with \n
    const json = JSON.stringify(value, null, 2);
    return json.split("\n").map((line) => {
      const trimLine = line.trim();
      // if the line if [,],{,}, if so, return the line
      if (["[", "]", "{", "}"].includes(trimLine)) {
        return trimLine;
      }
      // try to add { }, if it's a object, then change the value to literal
      const isEndWithComma = trimLine.endsWith(",");
      let trimLineWithoutComma = trimLine;
      if (isEndWithComma) {
        // remove end comma
        trimLineWithoutComma = trimLine.slice(0, -1);
      }

      const tryObject = `{${trimLineWithoutComma}}`;
      try {
        const obj = JSON.parse(tryObject);
        // it's a object, then change the value to literal
        const keys = Object.keys(obj);
        if (keys.length === 1) {
          const key = keys[0];
          const value = obj[key];
          let parsed = "";
          // check value is string or not
          if (typeof value === "string") {
            parsed = convertStringToLiteral(value, publicCtx || {});
          } else {
            parsed = value;
          }

          return `"${key}":${parsed}${isEndWithComma ? "," : ""}`;
        } else {
          throw new Error(`unknow object ${line}`);
        }
      } catch (e) {
        if (e instanceof SyntaxError) {
          // it's a string
          // check type
          let parsedValue = "";
          if (
            trimLineWithoutComma.startsWith('"') &&
            trimLineWithoutComma.endsWith('"')
          ) {
            // string
            parsedValue = convertStringToLiteral(
              trimLineWithoutComma.slice(1, -1),
              publicCtx,
            );
          } else {
            parsedValue = trimLineWithoutComma;
          }
          return `${parsedValue}${isEndWithComma ? "," : ""}`;
        } else {
          log.error(`unknow object ${line} when parsing`);
          // unknown
          throw e;
        }
      }
    }).join("");
  } else if (typeof value === "string") {
    // check if variable
    return convertStringToLiteral(value, publicCtx || {});
  } else {
    return JSON.stringify(value);
  }
}

function convertStringToLiteral(
  value: string,
  publicCtx?: Record<string, unknown>,
): string {
  if (!value) {
    return value;
  } else if (isVariable(value)) {
    // check if variable
    // it's a variable
    // should return literal directly
    return variableValueToVariable(value);
  } else {
    // as template
    const parsed = templateWithKnownKeys(value, publicCtx || {});
    return parsed;
  }
}

/**
 * check if condition result
 * @param str
 * @param publicCtx
 */
export function getConditionResult(
  value: string,
  publicCtx: PublicContext,
): unknown {
  // check if variable
  let conditionLiteral = "";
  if (isVariable(value)) {
    // it's a variable
    // should return literal directly
    conditionLiteral = variableValueToVariable(value);
  } else if (isIncludeTemplate(value)) {
    // as template
    const parsed = templateWithKnownKeys(value, publicCtx);
    return parsed;
  } else {
    // consider as literal
    conditionLiteral = value;
  }
  // calculate the condition result
  if (conditionLiteral) {
    try {
      const result = template(`\${${conditionLiteral}}`, publicCtx);
      if (result === "true") {
        return true;
      } else if (result === "false") {
        return false;
      } else {
        return result;
      }
    } catch (_e) {
      // can't parse the condition literal when compile time, treat it as literal
      return conditionLiteral;
    }
  } else {
    return false;
  }
}

function variableValueToVariable(str: string): string {
  if (str.startsWith("$")) {
    return str.slice(1);
  } else {
    return str;
  }
}

 import {Task,RunSingleOptions} from './interface.ts';
 import {resolve,ensureDir,dirname} from './deps.ts';
 import config from "./config.json" assert { type: "json" };
export const get = (obj: unknown, path: string, defaultValue = undefined) => {
  const travel = (regexp: RegExp) =>
    String.prototype.split
      .call(path, regexp)
      .filter(Boolean)
      .reduce(
        (res, key) =>
          res !== null && res !== undefined
            ? (res as Record<string, string>)[key]
            : res,
        obj
      );
  const result = travel(/[,[\]]+?/) || travel(/[,[\].]+?/);
  return result === undefined || result === obj ? defaultValue : result;
};
export const escapeJSON = (str: string) => {
  return str
  .replace(/[\\]/g, '\\\\')
  .replace(/[\"]/g, '\\\"')
  .replace(/[\/]/g, '\\/')
  .replace(/[\b]/g, '\\b')
  .replace(/[\f]/g, '\\f')
  .replace(/[\n]/g, '\\n')
  .replace(/[\r]/g, '\\r')
  .replace(/[\t]/g, '\\t');
}

 // for getCtxKeys to avoid forgotten keys;
 class TaskStructure implements Task {
  use = "";
  args: unknown[] = [];
}
export const ctxKeys = Object.keys(new TaskStructure());
export const changeExt = (path: string, ext: string) => {
  return path.replace(/\.[^.]+$/, ext);
}
export const createDistFile = async (directory:string,content: string,options:RunSingleOptions) => {
  const filePath =resolve(options.dist,directory,changeExt(options.relativePath,'.js'));
  await ensureDir(dirname(filePath))
  await Deno.writeTextFile(filePath, content);
}

export const getGlobalPackageUrl = ():string=>{
  return config.globalPackageUrl;
}
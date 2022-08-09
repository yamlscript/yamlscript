import { path } from "./deps.ts";

export const win32 = path.win32;
export const posix = path.posix;
export const {
  basename,
  delimiter,
  dirname,
  extname,
  format,
  fromFileUrl,
  isAbsolute,
  join,
  normalize,
  parse,
  relative,
  resolve,
  sep,
  toFileUrl,
  toNamespacedPath,
  SEP,
  SEP_PATTERN,
  common,
  globToRegExp,
  isGlob,
  joinGlobs,
  normalizeGlob,
} = path;

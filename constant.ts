import pkg from "./pkg.json" assert { type: "json" };
import config from "./config.json" assert { type: "json" };

import { CompiledContext } from './interface.ts'
 // for getCtxKeys to avoid forgotten keys;
 class CompiledContextClass implements CompiledContext {
  env={}
}
export const COMPILED_CONTEXT_KEYS = Object.keys(new CompiledContextClass());
export const DEFAULT_USE_NAME=`__${pkg.bin}_default_use`;
export const RUNTIME_FUNCTION_OPTIONS_NAME=`__${pkg.bin}_runtime_options`;

export const GLOBAL_PACKAGE_URL = `${config.globalPackageUrl}`;

// export const TEMPLATE_REGEX = /(\\)?\$\{(.*?)\}/g;

export const TEMPLATE_REGEX = /(\\)?\$\{([^\{\}\\]+)\}/g;

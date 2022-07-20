import pkg from "./pkg.json" assert { type: "json" };
import config from "./config.json" assert { type: "json" };

import { CompiledContext } from "./interface.ts";
// for getCtxKeys to avoid forgotten keys;
class CompiledContextClass implements CompiledContext {
  env = {};
  os = {};
}
export const COMPILED_CONTEXT_KEYS = Object.keys(new CompiledContextClass());
export const DEFAULT_USE_NAME = `__${pkg.bin}_default_use`;
export const RUNTIME_FUNCTION_OPTIONS_NAME = `__${pkg.bin}_runtime_options`;
export const LOOP_LENGTH_NAME = `__${pkg.bin}_loop_length`;
export const INTERNAL_CONTEXT_NAME = `__${pkg.bin}_context`;
export const LOOP_VARIABLE_NAME = `__${pkg.bin}_loop_variable`;
export const LOOP_ITEM_NAME = config.context.loopItemName;
export const LOOP_ITEM_INDEX = config.context.loopItemIndex;
export const GLOBAL_PACKAGE_URL = `${config.globalPackageUrl}`;

// export const TEMPLATE_REGEX = /(\\)?\$\{(.*?)\}/g;

export const TEMPLATE_REGEX = /(\\)?\$\{([^\{\}\\]+)\}/g;

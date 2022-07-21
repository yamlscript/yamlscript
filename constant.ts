import pkg from "./pkg.json" assert { type: "json" };
import config from "./config.json" assert { type: "json" };

import { BuildContext } from "./interface.ts";
// for getCtxKeys to avoid forgotten keys;
class BuildContextClass implements BuildContext {
  env = {};
  os = {};
}
export const COMPILED_CONTEXT_KEYS = Object.keys(new BuildContextClass());
export const DEFAULT_USE_NAME = `__${pkg.full}_default_use`;
export const RUNTIME_FUNCTION_OPTIONS_NAME = `__${pkg.full}_runtime_options`;
export const LOOP_LENGTH_NAME = `__${pkg.full}_loop_length`;
export const INTERNAL_CONTEXT_NAME = `__${pkg.full}_context`;
export const LOOP_VARIABLE_NAME = `__${pkg.full}_loop_variable`;
export const LOOP_ITEM_NAME = config.context.loopItemName;
export const LOOP_ITEM_INDEX = config.context.loopItemIndex;
export const GLOBAL_PACKAGE_URL =
  `${config.globalPackageUrlPrefix}/globals/mod.ts`;
export const GLOBAL_RUNTIME_CMD_PACKAGE_URL =
  `${config.globalPackageUrlPrefix}/runtimes/cmd.ts`;

// export const TEMPLATE_REGEX = /(\\)?\$\{(.*?)\}/g;

export const TEMPLATE_REGEX = /(\\)?\$\{([^\{\}\\]+)\}/g;

import config from "./config.json" assert { type: "json" };

export const DEFAULT_USE_NAME=`__${config.bin}_default_use`;
export const RUNTIME_FUNCTION_OPTIONS_NAME=`__${config.bin}_runtime_options`;

export const GLOBAL_PACKAGE_URL = `${config.globalPackageUrl}`;
import xdg from "https://deno.land/x/xdg@v9.4.0/src/mod.deno.ts";
import osPaths from "https://deno.land/x/os_paths@v7.0.0/src/mod.deno.ts";
export const cacheDir = xdg.cache();
export const configDir = xdg.config();
export const dataDir = xdg.data();
export const runtimeDir = xdg.runtime();
export const homeDir = osPaths.home();
export const tempDir = osPaths.temp();

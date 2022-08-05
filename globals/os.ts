export const name = Deno.build.os;
export const arch = Deno.build.arch;
// export const hostname = Deno.hostname();
export const hostname = Deno.env.get("HOSTNAME");

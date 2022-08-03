import { mustache } from "./deps.ts";

export function render(templateString: string, data: Record<string, unknown>) {
  // @ts-ignore: mustache is not typed
  return mustache.render(templateString, data);
}

export async function copy(
  fromFile: string,
  toFile: string,
  data: Record<string, unknown>,
) {
  // template
  const templateString = await Deno.readTextFile(fromFile);
  const rendered = render(templateString, data);
  // write file
  await Deno.writeTextFile(toFile, rendered, {
    overwrite: true,
  });
}

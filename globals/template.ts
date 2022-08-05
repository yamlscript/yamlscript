import { fs, mustache, path } from "./deps.ts";

export function render(templateString: string, data: Record<string, unknown>) {
  // @ts-ignore: mustache is not typed
  return mustache.render(templateString, data);
}

export async function copy(
  fromFile: string,
  toFile: string,
  data: Record<string, unknown>,
  options: Deno.WriteFileOptions = {},
) {
  // template
  const templateString = await Deno.readTextFile(fromFile);
  const rendered = render(templateString, data);
  // ensure dir exists
  await fs.ensureDir(path.dirname(toFile));
  // write file
  console.log("copy file to ", toFile);

  await Deno.writeTextFile(toFile, rendered, options);
}

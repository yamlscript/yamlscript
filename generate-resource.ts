import { getLocalGlobalsCode } from "./util.ts";
import { readJSONFile, writeJSONFile } from "./util.ts";
import { parseArgs } from "./deps.ts";
import log from "./log.ts";
export async function generateResource() {
  const code = await getLocalGlobalsCode();
  // console.log(code);
  //
  await writeJSONFile("./resource.gen.json", {
    globalsCode: code,
  });
  // check is there a version args
  const args = parseArgs(Deno.args);
  if (typeof args.version === "string") {
    // generate new version
    const pkg = await readJSONFile("./pkg.json") as Record<string, string>;
    pkg.version = args.version;

    log.info("generate new version", pkg.version);
    await writeJSONFile("./pkg.json", pkg);
  }
}

if (import.meta.main) {
  await generateResource();
}

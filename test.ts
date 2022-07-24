const result = await Deno.readDir(`./docs/simple-usage`);

for await (const entry of result.entries()) {
  console.log(entry);
}

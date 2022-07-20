export default async function main() {
  let result = null,
    ctx = null,
    env = null;
  const p = Deno.run({
    cmd: ["echo", "hello haha", "love"],
    stdout: "piped",
    stderr: "piped",
  });

  const { code } = await p.status();

  // Reading the outputs closes their pipes
  const rawOutput = await p.output();
  const rawError = await p.stderrOutput();

  if (code === 0) {
    await Deno.stdout.write(rawOutput);
  } else {
    const errorString = new TextDecoder().decode(rawError);
    console.log("eerror", errorString);
  }
  Deno.exit(code);
}

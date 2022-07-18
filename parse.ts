import { parse } from "./deps.ts";
import { Task } from "./interface.ts";
export async function parseTask(file: string): Promise<Task[]> {
  const content = await Deno.readTextFile(file);
  return parse(content) as Task[];
}

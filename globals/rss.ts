import { parseFeed } from "https://deno.land/x/rss@0.5.6/mod.ts";
import type { Feed } from "https://deno.land/x/rss@0.5.6/mod.ts";
import type { FeedEntry } from "https://deno.land/x/rss@0.5.6/src/types/feed.ts";
export async function feed(url: string): Promise<Feed> {
  const xml = await fetch(url).then((res) => res.text());
  const feed = await parseFeed(xml);
  return feed;
}
export async function entries(url: string): Promise<FeedEntry[]> {
  return await feed(url).then((result) => result.entries);
}

export function fetchRSS(url: string): Promise<string> {
  return fetch(url).then(res => res.text());
}
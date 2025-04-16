import NodeCache from "node-cache";

export const CACHE = new NodeCache({ stdTTL: 600 });

export function wildCardDelCacheKey(start: string) {
  const keys = CACHE.keys();

  const matchedKeys = keys.filter((key) => key.startsWith(start));

  CACHE.del(matchedKeys);
}

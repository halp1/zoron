import fs from "node:fs";
import _path from "node:path";

export namespace cache {
  export const path = _path.join(process.cwd(), "cache.json");

  export interface Cache {
    users: Record<string, string>;
  }

  const defaultValue: Cache = {
    users: {}
  };

  if (!fs.existsSync(path)) {
    // If the cache file doesn't exist, create it with default values
    fs.writeFileSync(path, JSON.stringify(defaultValue, null, 2));
  }

  export const read = (): Cache => {
    try {
      const data = fs.readFileSync(path, "utf-8");
      return JSON.parse(data) as Cache;
    } catch (error) {
      console.error("Failed reading cache", error);
      if (!fs.existsSync(`${path}.bak`))
        fs.renameSync(path, `${path}.bak`);
      return defaultValue;
    }
  };

  export const write = (cacheData: Cache): void => {
    fs.writeFileSync(path, JSON.stringify(cacheData, null, 2));
  };

  export const setUser = (user: string, value: string) => {
    // Read the current cache
    const cacheData = read();

    // Set the user value in the cache
    cacheData.users[user] = value;

    // Write the updated cache back to the file
    write(cacheData);
  };

  export const getUser = (user: string): string | undefined => {
    // Read the current cache
    const cacheData = read();

    // Return the value for the specified user, or undefined if not found
    return cacheData.users[user];
  };
}

import fs from "node:fs/promises";

export const template = (content: string, data: Record<string, string | number>) => {
  return content.replace(/\{\{(\w+)\}\}/g, (_, key) => data[key].toString());
};
export const templateFile = async (
  path: string,
  data: Record<string, string | number>,
  output: string
) => {
  const content = await fs.readFile(path, "utf-8");
  const result = template(content, data);
  await fs.writeFile(output, result);
};

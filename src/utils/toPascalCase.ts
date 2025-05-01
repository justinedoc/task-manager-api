export function toPascalCase(str: string) {
  return (str.match(/[A-Za-z0-9]+/g) || [])
    .map((w) => w[0].toUpperCase() + w.slice(1).toLowerCase())
    .join("");
}

export function furnaceLabel(level: number): string {
  if (level <= 30) return String(level);
  if (level < 35) return `30-${level - 30}`;
  const tier = Math.floor((level - 35) / 5) + 1;
  const step = (level - 35) % 5;
  return `FC${tier}${step ? `-${step}` : ""}`;
}

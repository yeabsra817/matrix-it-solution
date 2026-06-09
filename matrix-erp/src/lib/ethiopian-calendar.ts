/** Approximate Ethiopian calendar conversion for display (MVP). */
export function toEthiopian(date: Date): { year: number; month: number; day: number; label: string } {
  const gYear = date.getFullYear();
  const gMonth = date.getMonth() + 1;
  const gDay = date.getDate();
  const ethYear = gYear - 8;
  const ethMonth = gMonth > 9 ? gMonth - 9 : gMonth + 3;
  const ethDay = Math.min(gDay, 30);
  const months = [
    "Meskerem", "Tikimt", "Hidar", "Tahsas", "Tir", "Yekatit",
    "Megabit", "Miazia", "Ginbot", "Sene", "Hamle", "Nehase", "Pagumen",
  ];
  const label = `${ethDay} ${months[ethMonth - 1] ?? "Meskerem"} ${ethYear} E.C.`;
  return { year: ethYear, month: ethMonth, day: ethDay, label };
}

export function dualDateLabel(date: Date): string {
  const greg = date.toLocaleDateString("en-GB");
  const eth = toEthiopian(date);
  return `${greg} (Gregorian) · ${eth.label}`;
}

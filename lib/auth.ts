export function normalizeLoginIdentifier(value: string):
  | { kind: "email"; value: string }
  | { kind: "phone"; value: string }
  | null {
  const input = value.trim();
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input))
    return { kind: "email", value: input.toLowerCase() };

  const compact = input.replace(/[\s()-]/g, "");
  const international = compact.startsWith("0")
    ? `+61${compact.slice(1)}`
    : compact.startsWith("61")
      ? `+${compact}`
      : compact;
  if (/^\+[1-9]\d{7,14}$/.test(international))
    return { kind: "phone", value: international };
  return null;
}

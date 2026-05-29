import type { PinType } from "@/components/map-embed";

const PIN_COLORS: Record<PinType, string> = {
  venue:   "#78564a",
  pickup:  "#2563eb",
  mrt:     "#16a34a",
  parking: "#7c3aed",
  hotel:   "#db2777",
  other:   "#6b7280",
};

export interface PinRef {
  label: string;
  type: PinType;
  number: number;
}

interface Props {
  text: string;
  pins: PinRef[];
}

const TOKEN_RE = /\[\[([^\]]+)\]\]/g;

export function HowToGetThereText({ text, pins }: Props) {
  const byLabel = new Map(pins.map((p) => [p.label.toLowerCase(), p]));
  const nodes: React.ReactNode[] = [];
  let cursor = 0;
  let key = 0;

  for (const match of text.matchAll(TOKEN_RE)) {
    const start = match.index ?? 0;
    if (start > cursor) nodes.push(text.slice(cursor, start));

    const pin = byLabel.get(match[1].trim().toLowerCase());
    if (pin) {
      nodes.push(
        <span
          key={key++}
          className="inline-flex items-center justify-center w-5 h-5 rounded-full text-white text-xs font-bold align-middle mx-0.5"
          style={{ background: PIN_COLORS[pin.type] }}
          title={pin.label}
          aria-label={`Pin ${pin.number}: ${pin.label}`}
        >
          {pin.number}
        </span>
      );
    } else {
      nodes.push(match[0]);
    }
    cursor = start + match[0].length;
  }
  if (cursor < text.length) nodes.push(text.slice(cursor));

  return (
    <p className="text-warm-600 whitespace-pre-line text-sm leading-relaxed">
      {nodes}
    </p>
  );
}

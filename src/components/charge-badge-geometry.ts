export interface ChargeGlyphSegment {
  from: { x: number; y: number };
  to: { x: number; y: number };
}

export function chargeGlyphSegments(charge: number): ChargeGlyphSegment[] {
  const horizontal = {
    from: { x: 42, y: 64 },
    to: { x: 86, y: 64 },
  };
  if (charge < 0) return [horizontal];
  return [
    horizontal,
    {
      from: { x: 64, y: 42 },
      to: { x: 64, y: 86 },
    },
  ];
}

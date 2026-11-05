/** Times of day are minutes since midnight: 9:30 is 570. */
export type Minutes = number;

/** `'09:30'` → `570`. */
export function toMinutes(time: string): Minutes {
  const match = /^(\d{1,2}):(\d{2})$/.exec(time.trim());
  if (!match) throw new Error(`Expected HH:MM, got "${time}"`);
  return Number(match[1]) * 60 + Number(match[2]);
}

/** `570` → `'9:30'`; with `pad`, `'09:30'`. Wraps past midnight. */
export function formatTime(minutes: Minutes, { pad = false } = {}): string {
  const total = ((Math.round(minutes) % 1440) + 1440) % 1440;
  const h = Math.floor(total / 60);
  const m = total % 60;
  return `${pad ? String(h).padStart(2, '0') : h}:${String(m).padStart(2, '0')}`;
}

/** `95` → `'1 h 35 min'`, `45` → `'45 min'`, `60` → `'1 h'`. */
export function formatDuration(minutes: Minutes): string {
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  if (h && m) return `${h} h ${m} min`;
  if (h) return `${h} h`;
  return `${m} min`;
}

/** `'9:30–10:15'` */
export function formatRange(start: Minutes, end: Minutes): string {
  return `${formatTime(start)}–${formatTime(end)}`;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function overlaps(
  a: { start: number; end: number },
  b: { start: number; end: number }
): boolean {
  return a.start < b.end && b.start < a.end;
}

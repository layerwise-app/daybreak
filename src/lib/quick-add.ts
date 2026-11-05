/**
 * Quick add: turns a sentence like "Lunch with Sam Friday 12:30 at
 * Pellegrini's" into an event. Plain rules, no AI. It finds a duration, a time
 * or time range, a date, and a place; whatever is left is the title.
 */
import type { Minutes } from '~/lib/time';

export type TokenKind = 'date' | 'time' | 'duration' | 'place';
export type Token = { kind: TokenKind; start: number; end: number; text: string };

export type QuickAddResult = {
  title: string;
  /** ISO date, like `2027-03-12`. */
  date: string;
  /** Minutes since midnight, or `null` when no time was given. */
  start: Minutes | null;
  end: Minutes | null;
  duration: number | null;
  place: string | null;
  /** The recognised pieces of the input, in order, for highlighting. */
  tokens: Token[];
};

/** Length of an event when only a start time is given. */
export const DEFAULT_DURATION = 60;

const WEEKDAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
const MONTHS = [
  'january', 'february', 'march', 'april', 'may', 'june',
  'july', 'august', 'september', 'october', 'november', 'december'
];
const MONTH = String.raw`(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|june?|july?|aug(?:ust)?|sept?(?:ember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)`;
const WEEKDAY = String.raw`(sunday|monday|tuesday|wednesday|thursday|friday|saturday|sun|mon|tues?|wed|thu(?:rs?)?|fri|sat)`;
const MERIDIEM = String.raw`(a\.?m\.?|p\.?m\.?)`;
const CLOCK = String.raw`(\d{1,2})(?:[:.](\d{2}))?\s*${MERIDIEM}?`;

function addDays(iso: string, days: number): string {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

function weekdayIndex(word: string): number {
  const w = word.toLowerCase();
  return WEEKDAYS.findIndex((day) => day.startsWith(w.slice(0, 3)));
}

function monthIndex(word: string): number {
  const w = word.toLowerCase();
  return MONTHS.findIndex((m) => m.startsWith(w.slice(0, 3)));
}

/** The next occurrence of `day month` on or after `today`. */
function dateFor(today: string, month: number, day: number): string | null {
  const year = Number(today.slice(0, 4));
  for (const y of [year, year + 1]) {
    const d = new Date(Date.UTC(y, month, day));
    if (d.getUTCMonth() !== month) return null;
    const iso = d.toISOString().slice(0, 10);
    if (iso >= today) return iso;
  }
  return null;
}

/**
 * Hours and minutes to minutes since midnight. Without am/pm, 1–6 o'clock is
 * read as the afternoon ("coffee at 3"), and 7–12 as written.
 */
function clock(hourText: string, minuteText?: string, meridiem?: string): Minutes | null {
  let hour = Number(hourText);
  const minute = minuteText ? Number(minuteText) : 0;
  if (minute > 59) return null;
  const mer = meridiem?.toLowerCase()[0];
  if (mer) {
    if (hour < 1 || hour > 12) return null;
    if (mer === 'p' && hour !== 12) hour += 12;
    if (mer === 'a' && hour === 12) hour = 0;
  } else {
    if (hour > 23) return null;
    if (hour >= 1 && hour <= 6) hour += 12;
  }
  return hour * 60 + minute;
}

class Claims {
  readonly taken: boolean[];
  readonly tokens: Token[] = [];

  constructor(readonly text: string) {
    this.taken = Array.from({ length: text.length }, () => false);
  }

  /** First match of `re` that doesn't touch claimed text and passes `accept`. */
  find(re: RegExp, accept: (m: RegExpExecArray) => boolean = () => true) {
    const global = new RegExp(re.source, 'gi');
    for (let m = global.exec(this.text); m; m = global.exec(this.text)) {
      if (!m[0].length) {
        global.lastIndex++;
        continue;
      }
      if (this.isFree(m.index, m.index + m[0].length) && accept(m)) return m;
    }
    return null;
  }

  isFree(start: number, end: number): boolean {
    for (let i = start; i < end; i++) if (this.taken[i]) return false;
    return true;
  }

  claim(kind: TokenKind, start: number, end: number, tokenStart = start) {
    for (let i = start; i < end; i++) this.taken[i] = true;
    this.tokens.push({ kind, start: tokenStart, end, text: this.text.slice(tokenStart, end) });
  }

  /** Claims a regex match; the token itself skips joining words like "at". */
  claimMatch(kind: TokenKind, m: RegExpExecArray) {
    const lead = /^(?:(?:from|on|at|this|for)\s+|@\s*)/i.exec(m[0]);
    this.claim(kind, m.index, m.index + m[0].length, m.index + (lead ? lead[0].length : 0));
  }

  leftover(): string {
    let out = '';
    for (let i = 0; i < this.text.length; i++) out += this.taken[i] ? ' ' : this.text[i];
    return out;
  }
}

export function parseQuickAdd(input: string, today: string): QuickAddResult {
  const c = new Claims(input);
  let date = today;
  let start: Minutes | null = null;
  let end: Minutes | null = null;
  let duration: number | null = null;
  let place: string | null = null;
  let fallbackTime: Minutes | null = null;

  // Durations: "for 45 min", "for 1.5 hours", "for an hour", "for 1h30".
  const dur = c.find(
    /\bfor\s+(?:(half\s+an\s+hour)|(an?\s+hour)|(\d+(?:\.\d+)?)\s*(?:h|hrs?|hours?)(?:\s*(\d{1,2})\s*(?:m|mins?|minutes?)?)?|(\d+)\s*(?:m|mins?|minutes?))(?!\w)/
  );
  if (dur) {
    duration = dur[1]
      ? 30
      : dur[2]
        ? 60
        : dur[3]
          ? Math.round(Number(dur[3]) * 60) + Number(dur[4] ?? 0)
          : Number(dur[5]);
    c.claimMatch('duration', dur);
  }

  // Time ranges: "2-4pm", "from 10:00 to 11:30", "14:00–15:30".
  const range = c.find(
    new RegExp(String.raw`\b(?:from\s+)?${CLOCK}\s*(?:-|–|—|to|until|till)\s*${CLOCK}(?!\w)`)
  );
  if (range) {
    const endMer = range[6];
    let s = clock(range[1], range[2], range[3] ?? endMer);
    const e = clock(range[4], range[5], endMer);
    // "11-1pm" starts in the morning.
    if (s !== null && e !== null && s > e && !range[3]) s -= 12 * 60;
    if (s !== null && e !== null && s >= 0 && e > s) {
      start = s;
      end = e;
      c.claimMatch('time', range);
    }
  }

  // Single times: "noon", "12:30", "9am", "at 9".
  if (start === null) {
    const named = c.find(/\b(?:at\s+)?(noon|midday|midnight)\b/);
    if (named) {
      start = named[1].toLowerCase() === 'midnight' ? 0 : 12 * 60;
      c.claimMatch('time', named);
    }
  }
  if (start === null) {
    const patterns: [RegExp, (m: RegExpExecArray) => Minutes | null][] = [
      [
        new RegExp(String.raw`(?:\bat\s+|@\s*)?\b(\d{1,2})[:.](\d{2})\s*${MERIDIEM}?(?![\w/])`),
        (m) => clock(m[1], m[2], m[3])
      ],
      [
        new RegExp(String.raw`(?:\bat\s+|@\s*)?\b(\d{1,2})\s*${MERIDIEM}(?!\w)`),
        (m) => clock(m[1], undefined, m[2])
      ],
      [/\bat\s+(\d{1,2})(?![\w:./])/, (m) => clock(m[1])]
    ];
    for (const [re, read] of patterns) {
      const m = c.find(re, (match) => read(match) !== null);
      if (m) {
        start = read(m);
        c.claimMatch('time', m);
        break;
      }
    }
  }

  // Dates: "today", "tomorrow", "Friday", "next Monday", "14 March", "14/3".
  const relative = c.find(/\b(today|tonight|tomorrow|tmrw)\b/);
  if (relative) {
    const word = relative[1].toLowerCase();
    if (word === 'tonight') fallbackTime = 19 * 60;
    if (word === 'tomorrow' || word === 'tmrw') date = addDays(today, 1);
    c.claimMatch('date', relative);
  } else {
    const weekday = c.find(new RegExp(String.raw`\b(?:(?:on|this)\s+)?(next\s+)?${WEEKDAY}\b`));
    const dayMonth = weekday
      ? null
      : c.find(new RegExp(String.raw`\b(?:on\s+)?(?:the\s+)?(\d{1,2})(?:st|nd|rd|th)?\s+(?:of\s+)?${MONTH}\b`));
    const monthDay =
      weekday || dayMonth
        ? null
        : c.find(new RegExp(String.raw`\b(?:on\s+)?${MONTH}\s+(\d{1,2})(?:st|nd|rd|th)?\b`));
    const numeric =
      weekday || dayMonth || monthDay ? null : c.find(/\b(?:on\s+)?(\d{1,2})\/(\d{1,2})\b/);

    if (weekday) {
      const todayIndex = new Date(`${today}T00:00:00Z`).getUTCDay();
      let ahead = (weekdayIndex(weekday[2]) - todayIndex + 7) % 7;
      if (weekday[1]) ahead += 7;
      date = addDays(today, ahead);
      c.claimMatch('date', weekday);
    } else {
      const [m, iso] = dayMonth
        ? [dayMonth, dateFor(today, monthIndex(dayMonth[2]), Number(dayMonth[1]))]
        : monthDay
          ? [monthDay, dateFor(today, monthIndex(monthDay[1]), Number(monthDay[2]))]
          : numeric
            ? [numeric, dateFor(today, Number(numeric[2]) - 1, Number(numeric[1]))]
            : [null, null];
      if (m && iso) {
        date = iso;
        c.claimMatch('date', m);
      }
    }
  }

  // Places: "at Pellegrini's" or "@ Studio North", up to the next recognised
  // piece or the end of the sentence.
  const at = c.find(/(?:\bat|@)\s+(?=[^\s\d])/);
  if (at) {
    const from = at.index + at[0].length;
    let to = from;
    while (to < input.length && !c.taken[to]) to++;
    const raw = input.slice(from, to).replace(/[\s,.;:!-]+$/, '');
    if (raw) {
      place = raw;
      c.claim('place', at.index, from + raw.length, from);
    }
  }

  if (start === null) start = fallbackTime;
  if (start !== null && end === null) end = start + (duration ?? DEFAULT_DURATION);
  if (start !== null && end !== null) duration = end - start;

  // The title is what's left, minus dangling joining words.
  let title = c
    .leftover()
    .replace(/\s+/g, ' ')
    .replace(/(^|\s)(on|at|for|from|this|next|@)(?=\s*$)/gi, '')
    .replace(/[\s,;:–—-]+$/g, '')
    .trim();
  if (title) title = title[0].toUpperCase() + title.slice(1);

  return {
    title,
    date,
    start,
    end,
    duration: start === null ? null : duration,
    place,
    tokens: c.tokens.sort((a, b) => a.start - b.start)
  };
}

/** `2027-03-12` → `Friday 12 March`. */
export function formatDate(iso: string): string {
  const d = new Date(`${iso}T00:00:00Z`);
  const cap = (s: string) => s[0].toUpperCase() + s.slice(1);
  return `${cap(WEEKDAYS[d.getUTCDay()])} ${d.getUTCDate()} ${cap(MONTHS[d.getUTCMonth()])}`;
}

/** Days from `today` to `iso`, for labels like "Tomorrow". */
export function relativeDay(iso: string, today: string): string {
  const days = Math.round(
    (Date.parse(`${iso}T00:00:00Z`) - Date.parse(`${today}T00:00:00Z`)) / 86_400_000
  );
  if (days === 0) return 'Today';
  if (days === 1) return 'Tomorrow';
  return formatDate(iso).split(' ')[0];
}

import { describe, expect, it } from 'vitest';
import { formatDate, parseQuickAdd } from '~/lib/quick-add';
import { formatTime } from '~/lib/time';

const TODAY = '2027-03-11'; // a Thursday

function summary(text: string) {
  const r = parseQuickAdd(text, TODAY);
  return {
    title: r.title,
    date: r.date,
    start: r.start === null ? null : formatTime(r.start),
    end: r.end === null ? null : formatTime(r.end),
    place: r.place
  };
}

describe('parseQuickAdd', () => {
  it('reads the example sentence', () => {
    expect(summary("Lunch with Sam Friday 12:30 at Pellegrini's")).toEqual({
      title: 'Lunch with Sam',
      date: '2027-03-12',
      start: '12:30',
      end: '13:30',
      place: "Pellegrini's"
    });
  });

  it('highlights each recognised piece', () => {
    const text = "Lunch with Sam Friday 12:30 at Pellegrini's";
    const kinds = parseQuickAdd(text, TODAY).tokens.map((t) => [t.kind, t.text]);
    expect(kinds).toEqual([
      ['date', 'Friday'],
      ['time', '12:30'],
      ['place', "Pellegrini's"]
    ]);
  });

  it('reads durations', () => {
    expect(summary('Dentist tomorrow 4:15pm for 45 min')).toMatchObject({
      title: 'Dentist',
      date: '2027-03-12',
      start: '16:15',
      end: '17:00'
    });
    expect(summary('Run for an hour at 7am')).toMatchObject({ start: '7:00', end: '8:00' });
    expect(summary('Workshop at 9 for 1.5 hours')).toMatchObject({ start: '9:00', end: '10:30' });
    expect(summary('Deep work 10am for 2h30')).toMatchObject({ start: '10:00', end: '12:30' });
  });

  it('reads time ranges', () => {
    expect(summary('Offsite 2-4pm')).toMatchObject({ start: '14:00', end: '16:00' });
    expect(summary('Review from 10:00 to 11:30')).toMatchObject({ start: '10:00', end: '11:30' });
    expect(summary('Brunch 11-1pm')).toMatchObject({ start: '11:00', end: '13:00' });
  });

  it('reads bare hours as sensible times', () => {
    expect(summary('Coffee with Mia at 3 at Market Lane')).toEqual({
      title: 'Coffee with Mia',
      date: TODAY,
      start: '15:00',
      end: '16:00',
      place: 'Market Lane'
    });
    expect(summary('Call at 9')).toMatchObject({ start: '9:00' });
    expect(summary('Picnic at noon')).toMatchObject({ start: '12:00' });
  });

  it('reads dates', () => {
    expect(summary('Yoga next Monday 7am').date).toBe('2027-03-22');
    expect(summary('Yoga Monday 7am').date).toBe('2027-03-15');
    expect(summary('Standup thursday 9:30').date).toBe(TODAY);
    expect(summary('Party on 14 March at 8pm').date).toBe('2027-03-14');
    expect(summary('Party March 2nd').date).toBe('2028-03-02');
    expect(summary('Rent due 1/4').date).toBe('2027-04-01');
  });

  it('gives tonight an evening time', () => {
    expect(summary('Call Mum tonight')).toMatchObject({ title: 'Call Mum', start: '19:00' });
  });

  it('leaves the time empty when none is given', () => {
    expect(summary('Buy milk')).toEqual({
      title: 'Buy milk',
      date: TODAY,
      start: null,
      end: null,
      place: null
    });
  });

  it('copes with partial typing', () => {
    expect(summary('Lunch with Sam Fri')).toMatchObject({ date: '2027-03-12', start: null });
    expect(summary('Lunch with Sam Friday 12:3').start).toBe(null);
    expect(summary('Lunch with Sam Friday 12:30 at')).toMatchObject({ title: 'Lunch with Sam', place: null });
    expect(summary('')).toMatchObject({ title: '', start: null });
  });

  it('formats dates', () => {
    expect(formatDate('2027-03-12')).toBe('Friday 12 March');
  });
});

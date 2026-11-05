/**
 * Ana's Thursday: the sample data every drawn app screen uses. Change an
 * event or a to-do here and the hero phone, the tiles, the planner, and the
 * device frames all update. Times are 24-hour `HH:MM` strings.
 */

export type EventKind = 'work' | 'social' | 'health' | 'focus';
export type Priority = 'high' | 'medium' | 'low';
/** Work stays inside work hours; personal errands may also go in the evening. */
export type TodoKind = 'work' | 'personal';

export type DayEvent = {
  id: string;
  title: string;
  start: string;
  end: string;
  kind: EventKind;
  place?: string;
};

export type Todo = {
  id: string;
  title: string;
  /** How long it takes, in minutes. */
  minutes: number;
  priority: Priority;
  kind: TodoKind;
  /** Optional window the planner must respect, like `before: '11:00'`. */
  after?: string;
  before?: string;
  /** Why the window exists, shown next to the to-do. */
  hint?: string;
};

export const sampleUser = {
  name: 'Ana Ruiz',
  firstName: 'Ana',
  initials: 'AR',
  role: 'Product designer',
  city: 'Melbourne'
};

export const sampleDay = {
  /** A Thursday. Quick-add reads "Friday" relative to this date. */
  date: '2027-03-11',
  weekday: 'Thursday',
  dateLabel: '11 March',
  /** The hours the planner may use for to-dos. */
  dayStart: '08:30',
  dayEnd: '21:30',
  /** Work to-dos start and finish inside these hours. */
  workHours: { start: '08:30', end: '18:00' },
  /** No to-do starts later than this. */
  lastStart: '20:30',
  /** Minutes kept free around events and between to-dos. */
  buffer: 5,

  events: [
    {
      id: 'standup',
      title: 'Standup',
      start: '09:30',
      end: '09:45',
      kind: 'work',
      place: 'Studio'
    },
    {
      id: 'review',
      title: 'Design review',
      start: '11:00',
      end: '12:00',
      kind: 'work',
      place: 'Room 2'
    },
    {
      id: 'lunch',
      title: 'Lunch with Sam',
      start: '12:30',
      end: '13:30',
      kind: 'social',
      place: 'Hector’s Deli'
    },
    {
      id: 'focus',
      title: 'Focus: onboarding flow',
      start: '14:00',
      end: '16:00',
      kind: 'focus'
    },
    {
      id: 'dentist',
      title: 'Dentist',
      start: '16:15',
      end: '17:00',
      kind: 'health',
      place: 'Smith St'
    },
    {
      id: 'climbing',
      title: 'Climbing',
      start: '19:00',
      end: '20:30',
      kind: 'health',
      place: 'Collingwood'
    }
  ] satisfies DayEvent[],

  todos: [
    {
      id: 'deck',
      title: 'Finish review deck',
      minutes: 45,
      priority: 'high',
      kind: 'work',
      before: '11:00',
      hint: 'Before design review'
    },
    {
      id: 'lena',
      title: 'Reply to Lena’s notes',
      minutes: 20,
      priority: 'high',
      kind: 'work'
    },
    {
      id: 'notes',
      title: 'Write release notes',
      minutes: 30,
      priority: 'medium',
      kind: 'work'
    },
    {
      id: 'flights',
      title: 'Book Sydney flights',
      minutes: 15,
      priority: 'medium',
      kind: 'work'
    },
    {
      id: 'landlord',
      title: 'Call landlord re heater',
      minutes: 15,
      priority: 'medium',
      kind: 'personal',
      before: '17:00',
      hint: 'Office hours'
    },
    {
      id: 'groceries',
      title: 'Groceries for the week',
      minutes: 30,
      priority: 'low',
      kind: 'personal',
      after: '17:00',
      hint: 'After work'
    },
    {
      id: 'gift',
      title: 'Order Inés’s birthday gift',
      minutes: 20,
      priority: 'low',
      kind: 'personal'
    }
  ] satisfies Todo[]
};

/**
 * The rest of Ana's week, for the Mac's week view. Thursday comes from
 * `sampleDay` above.
 */
export const sampleWeek: { label: string; date: number; events: Omit<DayEvent, 'id'>[] }[] = [
  {
    label: 'Mon',
    date: 8,
    events: [
      { title: 'Standup', start: '09:30', end: '09:45', kind: 'work' },
      { title: 'Sprint planning', start: '10:30', end: '12:00', kind: 'work' },
      { title: 'Yoga', start: '18:00', end: '19:00', kind: 'health' }
    ]
  },
  {
    label: 'Tue',
    date: 9,
    events: [
      { title: 'Standup', start: '09:30', end: '09:45', kind: 'work' },
      { title: '1:1 with Lena', start: '13:00', end: '13:30', kind: 'work' },
      { title: 'Focus: flows', start: '14:00', end: '16:30', kind: 'focus' },
      { title: 'Dinner at Mum’s', start: '19:00', end: '21:00', kind: 'social' }
    ]
  },
  {
    label: 'Wed',
    date: 10,
    events: [
      { title: 'Standup', start: '09:30', end: '09:45', kind: 'work' },
      { title: 'User interviews', start: '10:00', end: '12:00', kind: 'work' },
      { title: 'Physio', start: '17:30', end: '18:15', kind: 'health' }
    ]
  },
  { label: 'Thu', date: 11, events: [] },
  {
    label: 'Fri',
    date: 12,
    events: [
      { title: 'Standup', start: '09:30', end: '09:45', kind: 'work' },
      { title: 'Lunch with Sam', start: '12:30', end: '13:30', kind: 'social', place: 'Pellegrini’s' },
      { title: 'Studio demo', start: '15:00', end: '16:00', kind: 'work' }
    ]
  },
  {
    label: 'Sat',
    date: 13,
    events: [
      { title: 'Farmers market', start: '09:00', end: '10:30', kind: 'social' },
      { title: 'Climbing', start: '16:00', end: '17:30', kind: 'health' }
    ]
  },
  {
    label: 'Sun',
    date: 14,
    events: [{ title: 'Long run', start: '08:00', end: '09:30', kind: 'health' }]
  }
];

export type SampleDay = typeof sampleDay;

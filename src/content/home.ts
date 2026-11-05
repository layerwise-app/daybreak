/**
 * Copy and data for every section of the home page, in page order. Change a
 * headline, a label, or a quote here; components only lay it out.
 * Ana's events and to-dos live in `./sample-day.ts`; questions in `./faq.ts`.
 */

export const home = {
  seo: {
    title: 'Daybreak — the day planner that fits your to-dos into your day',
    description:
      'A calendar and day planner for iPhone, iPad, and Mac that turns your to-do list into a realistic plan for the day. Join the waitlist for spring 2027.'
  },

  hero: {
    eyebrow: 'Coming spring 2027',
    headline: 'A to-do list that knows what time it is.',
    subhead:
      'Daybreak puts your calendar and your to-dos on one timeline, then fits each task into time that’s actually free. The list becomes a plan you can keep.',
    secondary: { label: 'Watch it plan a day', href: '#plan' },
    platforms: 'For iPhone, iPad, and Mac',
    scrollHint: 'Scroll to play Ana’s Thursday',
    scrubberLabel: 'Time of day in the demo',
    phoneLabel:
      'Daybreak’s Today view on iPhone: Ana’s Thursday, with to-dos snapping into the free time between her events.'
  },

  features: {
    id: 'features',
    eyebrow: 'Try it here',
    headline: 'Eight small things that make a day easier to hold.',
    intro: 'Every tile is the real thing, in miniature. Drag, type, and tap.',
    tiles: {
      reschedule: {
        title: 'Drag it. Everything else makes room.',
        body: 'Move an event and anything in the way slides aside. Daybreak tells you what moved.',
        hint: 'Drag an event, or focus one and press the arrow keys.',
        range: { start: '09:00', end: '15:00' }
      },
      quickAdd: {
        title: 'Type it the way you’d say it.',
        body: 'Dates, times, durations, and places are picked out as you type. No forms.',
        example: 'Lunch with Sam Friday 12:30 at Pellegrini’s',
        placeholder: 'Try: Coffee with Mia tomorrow at 3',
        typeForMe: 'Type it for me',
        addLabel: 'Add'
      },
      focus: {
        title: 'Focus, on a timer.',
        body: 'Start a block and notifications wait until it’s done.',
        label: 'Onboarding flow',
        minutes: 25
      },
      widgets: {
        title: 'Your day, at a glance.',
        body: 'Three widget sizes, from the next event to the whole afternoon.'
      },
      appearance: {
        title: 'Light by day. Dark by night.',
        body: 'Follows your device, or pick one and keep it.',
        switchLabel: 'Dark appearance'
      },
      timeZones: {
        title: 'Find a time that works everywhere.',
        body: 'Drag across the strip. Daybreak marks the hours when everyone’s awake.',
        /** UTC offsets on Ana’s Thursday. */
        cities: [
          { name: 'Melbourne', offset: 11 },
          { name: 'London', offset: 0 },
          { name: 'San Francisco', offset: -8 }
        ],
        /** Local hours that count as reasonable for a call. */
        awake: { from: 7, to: 22 },
        work: { from: 9, to: 18 }
      },
      habits: {
        title: 'Small habits, kept.',
        body: 'Tap a day to mark it done. Streaks count themselves.',
        days: ['M', 'T', 'W', 'T', 'F', 'S', 'S'],
        /** Today is the fourth day (Thursday). */
        todayIndex: 3,
        habits: [
          { name: 'Stretch', done: [true, true, true, false, false, false, false] },
          { name: 'Read 20 pages', done: [true, false, true, false, false, false, false] },
          { name: 'Phone down by 10', done: [true, true, true, false, false, false, false] }
        ]
      },
      menuBar: {
        title: 'One click away on your Mac.',
        body: 'Your next event lives in the menu bar, with the rest of the day underneath.',
        menus: ['Daybreak', 'File', 'Edit', 'View', 'Window'],
        clock: 'Thu 10:48'
      }
    }
  },

  plan: {
    id: 'plan',
    eyebrow: 'Plan my day',
    headline: 'Seven to-dos. One button. A day that adds up.',
    body: 'Daybreak looks at Ana’s free time, then fits her to-dos by priority and length, with a few minutes of breathing room around everything. Shuffle for another plan that still works.',
    planLabel: 'Plan my day',
    shuffleLabel: 'Shuffle',
    resetLabel: 'Start over',
    listTitle: 'To-dos',
    dayTitle: 'Thursday',
    planned: 'Every to-do has a time.',
    unplanned: 'to-dos waiting for a time'
  },

  devices: {
    id: 'devices',
    eyebrow: 'Everywhere you are',
    headline: 'Same day. Every screen.',
    body: 'Plan the week on your Mac, rearrange it on iPad, glance at it on your phone. It all syncs through your own iCloud.',
    captions: {
      ipad: 'iPad: the day and your list, side by side.',
      mac: 'Mac: the whole week, one window.',
      iphone: 'iPhone: today, in your pocket.'
    }
  },

  quotes: {
    id: 'notes',
    eyebrow: 'From the beta',
    headline: 'Notes from people who live by their calendars.',
    items: [
      {
        name: 'Priya',
        role: 'Charge nurse',
        quote:
          'I work rotating shifts. Daybreak is the first planner that doesn’t assume my day starts at nine.'
      },
      {
        name: 'Tom',
        role: 'High school teacher',
        quote: 'I get eleven minutes between classes. It finds them, and it fills them with the right thing.'
      },
      {
        name: 'Mele',
        role: 'Freelance illustrator',
        quote:
          'If a to-do won’t fit, Daybreak tells me at breakfast instead of at midnight. That alone changed my week.'
      },
      {
        name: 'Jonas',
        role: 'Engineering manager',
        quote: 'The menu bar countdown has made me on time for every one-on-one this month.'
      },
      {
        name: 'Ruth',
        role: 'PhD candidate',
        quote: 'Shuffle is oddly calming. Seeing three versions of my day that all work makes the day feel possible.'
      }
    ]
  },

  questions: {
    id: 'questions',
    eyebrow: 'Questions',
    headline: 'Good questions, short answers.'
  },

  waitlist: {
    id: 'waitlist',
    eyebrow: 'Waitlist',
    headline: 'Be first in line for spring.',
    body: 'We’ll invite people to the beta in waitlist order. Two emails, at most: one when the beta opens, one at launch.',
    emailLabel: 'Email',
    emailPlaceholder: 'you@example.com',
    devicesLegend: 'I’d use it on',
    submitting: 'Joining…',
    success: {
      /** `{position}` becomes their place in line, like 1,284. */
      title: 'You’re #{position}.',
      body: 'We’ll email you when the beta opens. Until then, enjoy your Thursday.'
    },
    duplicate: {
      title: 'You’re already on the list.',
      body: 'That email is already waiting for spring. Nothing else to do.'
    },
    rateLimited:
      'That’s a lot of sign-ups from one place. Please try again in an hour.',
    failed:
      'We couldn’t reach the waitlist. Check your connection and press Join again; what you typed is still here.',
    privacyNote: 'We only use your email for the beta and launch.',
    privacyLink: 'Privacy'
  }
};

export type HomeContent = typeof home;

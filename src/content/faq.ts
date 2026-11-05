/** The Questions section on the home page, in order. */

export type FaqEntry = { question: string; answer: string };

export const faq: FaqEntry[] = [
  {
    question: 'When can I use Daybreak?',
    answer:
      'We’re launching in spring 2027, which is September to November here in Melbourne. People on the waitlist get beta invites first, in the order they joined.'
  },
  {
    question: 'Which devices does it run on?',
    answer:
      'iPhone, iPad, and Mac, with your day kept in sync between them. We’re a small team, so we’re making those three really good before anything else.'
  },
  {
    question: 'Does it work with the calendars I already have?',
    answer:
      'Yes. Daybreak shows the calendars already on your device, including iCloud, Google, and Exchange accounts you’ve added, so nothing has to move.'
  },
  {
    question: 'How does Plan my day decide where things go?',
    answer:
      'It finds the free time between your events, then places to-dos by priority and length, keeping a few minutes clear around everything. It’s plain rules, not AI, so the same day always gives the same plan. Shuffle shows you another plan that also fits.'
  },
  {
    question: 'Where are my plans stored?',
    answer:
      'On your devices and in your own iCloud account. We don’t run servers that hold your calendar or your to-dos, so there’s nothing for us to read, sell, or lose.'
  },
  {
    question: 'How much will it cost?',
    answer:
      'We’ll share pricing before launch. Whatever it is, you’ll be able to try everything free before you decide.'
  },
  {
    question: 'Will there be an Android or web version?',
    answer:
      'Not at launch. We’d rather make one thing that feels right on Apple devices than three that feel almost right.'
  },
  {
    question: 'What happens when I join the waitlist?',
    answer:
      'We save your email and the devices you picked. You’ll get at most two emails from us: one when the beta opens and one at launch. No newsletter, and no sharing your address.'
  }
];

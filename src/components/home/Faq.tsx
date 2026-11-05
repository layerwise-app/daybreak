import { faq } from '~/content/faq';
import { home } from '~/content/home';

export function Faq() {
  const content = home.questions;
  return (
    <section id={content.id} aria-labelledby='faq-title' className='section'>
      <div className='mx-auto grid max-w-[1180px] gap-10 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]'>
        <div>
          <p className='eyebrow'>{content.eyebrow}</p>
          <h2 id='faq-title' className='section-title max-w-[12ch]'>
            {content.headline}
          </h2>
        </div>
        <div className='faq'>
          {faq.map((entry) => (
            <details key={entry.question} className='faq-item'>
              <summary>
                <span>{entry.question}</span>
                <span className='faq-icon' aria-hidden='true' />
              </summary>
              <p>{entry.answer}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

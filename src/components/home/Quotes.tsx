import { home } from '~/content/home';

export function Quotes() {
  const content = home.quotes;
  return (
    <section id={content.id} aria-labelledby='quotes-title' className='section bg-paper-deep/70'>
      <div className='section-head'>
        <p className='eyebrow'>{content.eyebrow}</p>
        <h2 id='quotes-title' className='section-title max-w-[18ch]'>
          {content.headline}
        </h2>
      </div>
      <ul className='notes'>
        {content.items.map((q, i) => (
          <li key={q.name} className='note' data-tone={i % 5}>
            <figure>
              <blockquote>
                <p>“{q.quote}”</p>
              </blockquote>
              <figcaption>
                <b>{q.name}</b>
                <span>{q.role}</span>
              </figcaption>
            </figure>
          </li>
        ))}
      </ul>
    </section>
  );
}

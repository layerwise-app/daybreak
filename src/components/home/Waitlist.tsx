import { Link } from '@tanstack/react-router';
import { useServerFn } from '@tanstack/react-start';
import { useId, useRef, useState, type FormEvent } from 'react';
import { home } from '~/content/home';
import {
  DEVICES,
  DEVICE_LABELS,
  HONEYPOT_FIELD,
  validateWaitlist,
  type Device,
  type FieldErrors
} from '~/lib/waitlist';
import { submitWaitlist } from '~/server/waitlist.functions';
import { siteConfig } from '~/site.config';

const copy = home.waitlist;

type Outcome =
  | { kind: 'idle' }
  | { kind: 'sending' }
  | { kind: 'joined'; position: number }
  | { kind: 'duplicate' }
  | { kind: 'error'; message: string };

export function Waitlist() {
  const submit = useServerFn(submitWaitlist);
  const [email, setEmail] = useState('');
  const [devices, setDevices] = useState<Device[]>([]);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [outcome, setOutcome] = useState<Outcome>({ kind: 'idle' });
  const honeypot = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);
  const ids = { email: useId(), emailError: useId(), devices: useId(), devicesError: useId(), status: useId() };

  const toggle = (device: Device) => {
    setDevices((list) => (list.includes(device) ? list.filter((d) => d !== device) : [...list, device]));
    setErrors((e) => ({ ...e, devices: undefined }));
  };

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (outcome.kind === 'sending') return;
    const input = { email, devices, [HONEYPOT_FIELD]: honeypot.current?.value ?? '' };

    // Quick check in the browser; the server checks everything again.
    const local = validateWaitlist(input);
    if (!local.ok) {
      setErrors(local.errors);
      setOutcome({ kind: 'idle' });
      if (local.errors.email) emailRef.current?.focus();
      return;
    }
    setErrors({});
    setOutcome({ kind: 'sending' });
    try {
      const result = await submit({ data: input });
      if (result.status === 'joined') setOutcome({ kind: 'joined', position: result.position });
      else if (result.status === 'duplicate') setOutcome({ kind: 'duplicate' });
      else if (result.status === 'rate_limited') setOutcome({ kind: 'error', message: copy.rateLimited });
      else {
        setErrors(result.errors);
        setOutcome({ kind: 'idle' });
      }
      if (result.status === 'joined' || result.status === 'duplicate') {
        requestAnimationFrame(() => resultRef.current?.focus());
      }
    } catch {
      setOutcome({ kind: 'error', message: copy.failed });
    }
  };

  const done = outcome.kind === 'joined' || outcome.kind === 'duplicate';

  return (
    <section id={copy.id} aria-labelledby='waitlist-title' className='section pt-0 sm:pt-0'>
      <div className='waitlist tile mx-auto max-w-[1180px]'>
        <div className='waitlist-glow' aria-hidden='true' />
        <div className='relative grid gap-10 p-6 sm:p-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-16 lg:p-14'>
          <div>
            <p className='eyebrow'>{copy.eyebrow}</p>
            <h2 id='waitlist-title' className='section-title max-w-[12ch]'>
              {copy.headline}
            </h2>
            <p className='section-lede'>{copy.body}</p>
          </div>

          <div className='waitlist-panel'>
            {done ? (
              <div ref={resultRef} tabIndex={-1} className='waitlist-result' role='status'>
                {outcome.kind === 'joined' ? (
                  <>
                    <p className='waitlist-position num'>
                      {copy.success.title.replace('{position}', outcome.position.toLocaleString('en-AU'))}
                    </p>
                    <p className='mt-3 text-[1.0625rem] leading-relaxed text-ink-soft'>{copy.success.body}</p>
                  </>
                ) : (
                  <>
                    <p className='text-[1.75rem] font-[650] leading-[1.15] tracking-[-0.02em] text-balance'>{copy.duplicate.title}</p>
                    <p className='mt-3 text-[1.0625rem] leading-relaxed text-ink-soft'>{copy.duplicate.body}</p>
                  </>
                )}
              </div>
            ) : (
              <form noValidate onSubmit={onSubmit} aria-describedby={ids.status}>
                <div>
                  <label htmlFor={ids.email} className='text-[0.9375rem] font-semibold'>
                    {copy.emailLabel}
                  </label>
                  <input
                    ref={emailRef}
                    id={ids.email}
                    name='email'
                    type='email'
                    inputMode='email'
                    autoComplete='email'
                    required
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (errors.email) setErrors((x) => ({ ...x, email: undefined }));
                    }}
                    placeholder={copy.emailPlaceholder}
                    aria-invalid={errors.email ? true : undefined}
                    aria-describedby={errors.email ? ids.emailError : undefined}
                    className='waitlist-input'
                  />
                  {errors.email ? (
                    <p id={ids.emailError} className='waitlist-error'>
                      {errors.email}
                    </p>
                  ) : null}
                </div>

                <fieldset
                  className='mt-6'
                  aria-describedby={errors.devices ? ids.devicesError : undefined}
                  aria-invalid={errors.devices ? true : undefined}
                >
                  <legend className='text-[0.9375rem] font-semibold'>{copy.devicesLegend}</legend>
                  <div className='mt-2 flex flex-wrap gap-2'>
                    {DEVICES.map((d) => (
                      <label key={d} className='device-chip'>
                        <input
                          type='checkbox'
                          name='devices'
                          value={d}
                          checked={devices.includes(d)}
                          onChange={() => toggle(d)}
                        />
                        <span className='device-chip-box' aria-hidden='true' />
                        {DEVICE_LABELS[d]}
                      </label>
                    ))}
                  </div>
                  {errors.devices ? (
                    <p id={ids.devicesError} className='waitlist-error'>
                      {errors.devices}
                    </p>
                  ) : null}
                </fieldset>

                {/* Hidden from people; bots that fill it in are ignored. */}
                <div className='waitlist-trap' aria-hidden='true'>
                  <label>
                    Website
                    <input ref={honeypot} type='text' name={HONEYPOT_FIELD} tabIndex={-1} autoComplete='off' />
                  </label>
                </div>

                <button type='submit' className='btn btn-ink btn-lg mt-7 w-full sm:w-auto' disabled={outcome.kind === 'sending'}>
                  {outcome.kind === 'sending' ? copy.submitting : siteConfig.cta.primary}
                </button>

                <div id={ids.status} role='status' aria-live='polite'>
                  {outcome.kind === 'error' ? <p className='waitlist-alert'>{outcome.message}</p> : null}
                </div>
                <p className='mt-5 text-[0.875rem] text-ink-muted'>
                  {copy.privacyNote}{' '}
                  <Link to='/privacy' className='link text-ink-soft'>
                    {copy.privacyLink}
                  </Link>
                </p>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

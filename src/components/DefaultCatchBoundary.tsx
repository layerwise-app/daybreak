import { ErrorComponent, Link, useRouter, type ErrorComponentProps } from '@tanstack/react-router';
import { PageShell } from '~/components/site/PageShell';

export function DefaultCatchBoundary({ error }: ErrorComponentProps) {
  const router = useRouter();
  console.error(error);
  return (
    <PageShell>
      <section className='px-5 py-24 text-center sm:px-8'>
        <h1 className='display mx-auto max-w-[14ch] text-[clamp(2.5rem,6vw,4rem)]'>Something went wrong.</h1>
        <p className='mx-auto mt-5 max-w-[30rem] text-[1.0625rem] text-ink-soft'>
          Try again in a moment. If it keeps happening, the problem is on our side.
        </p>
        <div className='sr-only'>
          <ErrorComponent error={error} />
        </div>
        <div className='mt-8 flex justify-center gap-3'>
          <button type='button' className='btn btn-ink' onClick={() => router.invalidate()}>
            Try again
          </button>
          <Link to='/' className='btn btn-soft'>
            Home
          </Link>
        </div>
      </section>
    </PageShell>
  );
}

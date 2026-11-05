/** An iPhone status bar with a live clock. Drawn, not an icon set. */
export function StatusBar({ time }: { time: string }) {
  return (
    <div className='ds-status'>
      <span className='ds-status-time'>{time}</span>
      <span className='ds-status-icons' aria-hidden='true'>
        <span className='ds-signal'>
          <i style={{ height: '35%' }} />
          <i style={{ height: '55%' }} />
          <i style={{ height: '78%' }} />
          <i style={{ height: '100%' }} />
        </span>
        <span className='ds-battery'>
          <i />
        </span>
      </span>
    </div>
  );
}

/** Footer of every screen (app shell, sign-in, the assessed person's page): the activity log is not hidden. */
export function ActivityNotice({ className }: { className?: string }) {
  return (
    <footer className={['activity-notice', className].filter(Boolean).join(' ')}>
      Aplikacja rejestruje aktywność w celach analitycznych.
    </footer>
  )
}

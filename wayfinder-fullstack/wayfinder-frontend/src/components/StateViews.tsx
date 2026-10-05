export function LoadingState({ label = 'Loading…' }: { label?: string }) {
  return <div className="state state-loading" role="status">⏳ {label}</div>;
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="state state-error" role="alert">
      <span>⚠️ {message}</span>
      {onRetry && <button className="btn ghost" onClick={onRetry}>Retry</button>}
    </div>
  );
}

export function EmptyState({ message }: { message: string }) {
  return <div className="state state-empty">🔍 {message}</div>;
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="p-6 text-center text-sm text-red-600">
      <p>{message}</p>
      {onRetry && (
        <button type="button" onClick={onRetry} className="mt-2 underline">
          Retry
        </button>
      )}
    </div>
  )
}

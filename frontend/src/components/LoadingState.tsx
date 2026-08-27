export function LoadingState({ message = 'Loading…' }: { message?: string }) {
  return <div className="p-6 text-center text-sm text-gray-500">{message}</div>
}

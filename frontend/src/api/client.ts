export const USE_MOCK_API = import.meta.env.VITE_USE_MOCK_API !== 'false'

export function apiDelay<T>(data: T, ms = 300): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(data), ms))
}

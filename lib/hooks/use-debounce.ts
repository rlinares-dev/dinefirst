import { useState, useEffect } from 'react'

/**
 * Hook para debounce de valores.
 * Útil para búsquedas que consultan Supabase.
 *
 * @example
 * const debouncedSearch = useDebounce(searchTerm, 300)
 * useEffect(() => { fetchResults(debouncedSearch) }, [debouncedSearch])
 */
export function useDebounce<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(timer)
    }
  }, [value, delay])

  return debouncedValue
}

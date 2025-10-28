import { useCallback, useEffect, useState } from 'react'

import {
  getCachedCoingeckoUsdPrice,
  getCoingeckoUsdPrice
} from '@/lib/pricing/coingecko'

type UseTokenUsdRateOptions = {
  autoFetch?: boolean
}

export function useTokenUsdRate(
  coingeckoId: string,
  options: UseTokenUsdRateOptions = {}
) {
  const { autoFetch = false } = options
  const [rate, setRate] = useState<number | null>(() =>
    getCachedCoingeckoUsdPrice(coingeckoId)
  )
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const next = await getCoingeckoUsdPrice(coingeckoId)
      setRate(next)
      return next
    } catch (err) {
      const nextError =
        err instanceof Error ? err : new Error('Failed to fetch price')
      setError(nextError)
      throw nextError
    } finally {
      setLoading(false)
    }
  }, [coingeckoId])

  useEffect(() => {
    if (!autoFetch) return
    if (rate !== null) return
    void refresh()
  }, [autoFetch, rate, refresh])

  return {
    rate,
    loading,
    error,
    refresh
  }
}

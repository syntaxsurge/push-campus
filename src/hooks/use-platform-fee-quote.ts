'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'

import { PLATFORM_TREASURY_ADDRESS, SUBSCRIPTION_PRICE_USD } from '@/lib/config'
import {
  PlatformFeeQuote,
  resolvePlatformFeeQuote
} from '@/lib/pricing/platform-fee'
import { usePushAccount } from '@/hooks/use-push-account'

type UsePlatformFeeQuoteOptions = {
  autoFetch?: boolean
}

const USD_FORMATTER = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 0,
  maximumFractionDigits: 2
})

function formatSubscriptionUsdLabel() {
  const parsed = Number(SUBSCRIPTION_PRICE_USD)
  if (!Number.isFinite(parsed)) {
    return `$${SUBSCRIPTION_PRICE_USD} USD/month`
  }
  return `${USD_FORMATTER.format(parsed)}/month`
}

export function usePlatformFeeQuote(options: UsePlatformFeeQuoteOptions = {}) {
  const { autoFetch = false } = options
  const { pushChainClient, originChain } = usePushAccount()
  const [quote, setQuote] = useState<PlatformFeeQuote | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const next = await resolvePlatformFeeQuote({
        pushChainClient,
        originChain,
        treasuryAddress: PLATFORM_TREASURY_ADDRESS
      })
      setQuote(next)
      return next
    } catch (err) {
      const error =
        err instanceof Error ? err : new Error('Failed to resolve pricing')
      setError(error)
      throw error
    } finally {
      setLoading(false)
    }
  }, [originChain, pushChainClient])

  useEffect(() => {
    if (!autoFetch) return
    void refresh()
  }, [autoFetch, refresh])

  const usdLabel = useMemo(() => formatSubscriptionUsdLabel(), [])
  const nativeLabel = useMemo(
    () => (quote ? `${quote.displayAmount}/month` : null),
    [quote]
  )

  return {
    quote,
    label: usdLabel,
    usdLabel,
    nativeLabel,
    loading,
    error,
    refresh
  }
}

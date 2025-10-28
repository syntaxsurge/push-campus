'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'

import { PLATFORM_TREASURY_ADDRESS, SUBSCRIPTION_PRICE_USD } from '@/lib/config'
import {
  PlatformFeeQuote,
  resolvePlatformFeeQuote
} from '@/lib/pricing/platform-fee'
import { usePushAccount } from '@/hooks/use-push-account'

export function usePlatformFeeQuote() {
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
    void refresh()
  }, [refresh])

  const label = useMemo(() => {
    if (!quote) {
      return `$${SUBSCRIPTION_PRICE_USD} USD`
    }
    return `${quote.displayAmount}/month`
  }, [quote])

  return {
    quote,
    label,
    loading,
    error,
    refresh
  }
}

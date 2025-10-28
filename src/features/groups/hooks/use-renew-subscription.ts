import { useCallback, useMemo, useState } from 'react'

import { api } from '@/convex/_generated/api'
import { useApiMutation } from '@/hooks/use-api-mutation'
import { PLATFORM_TREASURY_ADDRESS } from '@/lib/config'
import { usePushAccount } from '@/hooks/use-push-account'
import { useUniversalTransaction } from '@/hooks/use-universal-transaction'
import { resolvePlatformFeeQuote } from '@/lib/pricing/platform-fee'
import { useGroupContext } from '../context/group-context'

type RenewResult = {
  endsOn: number | null
  txHash: `0x${string}`
}

export function useRenewSubscription() {
  const { group } = useGroupContext()
  const { address, pushChainClient, originChain } = usePushAccount()
  const { sendTransaction } = useUniversalTransaction()
  const { mutate, pending: isMutating } = useApiMutation(
    api.groups.renewSubscription
  )
  const [isTransacting, setIsTransacting] = useState(false)

  const treasuryAddress = useMemo(
    () => PLATFORM_TREASURY_ADDRESS as `0x${string}` | '',
    []
  )
  const renew = useCallback(async (): Promise<RenewResult> => {
    if (!group?._id) {
      throw new Error('Group context is unavailable.')
    }
    if (!address) {
      throw new Error('Connect your wallet to renew the subscription.')
    }
    if (!treasuryAddress) {
      throw new Error('Treasury address not configured.')
    }

    setIsTransacting(true)
    try {
      const feeQuote = await resolvePlatformFeeQuote({
        pushChainClient,
        originChain: originChain ?? null,
        treasuryAddress
      })

      const txResponse = await sendTransaction(
        feeQuote.params,
        {
          pendingMessage: `Paying ${feeQuote.displayAmount} platform fee…`,
          successMessage: 'Platform fee paid',
          errorMessage: 'Unable to process platform fee'
        }
      )

      await txResponse.wait()

      const txHash = txResponse.hash as `0x${string}`

      const result = (await mutate({
        groupId: group._id,
        ownerAddress: address,
        paymentTxHash: txHash
      })) as { endsOn: number } | undefined

      return {
        endsOn: result?.endsOn ?? null,
        txHash
      }
    } finally {
      setIsTransacting(false)
    }
  }, [
    address,
    group?._id,
    mutate,
    originChain,
    pushChainClient,
    treasuryAddress,
    sendTransaction
  ])

  return {
    renew,
    isRenewing: isTransacting || isMutating
  }
}

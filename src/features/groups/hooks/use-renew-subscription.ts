import { useCallback, useMemo, useState } from 'react'

import { api } from '@/convex/_generated/api'
import { useApiMutation } from '@/hooks/use-api-mutation'
import {
  NATIVE_TOKEN_SYMBOL,
  PLATFORM_TREASURY_ADDRESS
} from '@/lib/config'
import { SUBSCRIPTION_PRICE_AMOUNT } from '@/lib/pricing'
import { getPushPublicClient } from '@/lib/onchain/push-chain'
import { usePushAccount } from '@/hooks/use-push-account'
import { useUniversalTransaction } from '@/hooks/use-universal-transaction'
import { useGroupContext } from '../context/group-context'

type RenewResult = {
  endsOn: number | null
  txHash: `0x${string}`
}

export function useRenewSubscription() {
  const { group } = useGroupContext()
  const { address } = usePushAccount()
  const { sendTransaction } = useUniversalTransaction()
  const publicClient = useMemo(() => getPushPublicClient(), [])
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
      const balance = await publicClient.getBalance({
        address: address as `0x${string}`
      })

      if (balance < SUBSCRIPTION_PRICE_AMOUNT) {
        throw new Error(`Insufficient ${NATIVE_TOKEN_SYMBOL} balance to renew the subscription.`)
      }

      const txResponse = await sendTransaction({
        to: treasuryAddress,
        value: SUBSCRIPTION_PRICE_AMOUNT
      })

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
    publicClient,
    treasuryAddress,
    sendTransaction
  ])

  return {
    renew,
    isRenewing: isTransacting || isMutating
  }
}

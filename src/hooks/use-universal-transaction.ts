'use client'

import { useCallback } from 'react'

import { toast } from 'sonner'

import { usePushAccount } from '@/hooks/use-push-account'

type PushAccount = ReturnType<typeof usePushAccount>
type PushChainClient = NonNullable<PushAccount['pushChainClient']>
type UniversalSendParams = Parameters<
  PushChainClient['universal']['sendTransaction']
>[0]
type UniversalSendResponse = ReturnType<
  PushChainClient['universal']['sendTransaction']
>

export type UniversalTransactionOptions = {
  showToast?: boolean
  pendingMessage?: string
  successMessage?: string
  errorMessage?: string
}

const DEFAULT_PENDING_MESSAGE = 'Submitting universal transaction…'
const DEFAULT_SUCCESS_MESSAGE = 'Transaction submitted'
const DEFAULT_ERROR_MESSAGE = 'Transaction failed'

function resolveErrorMessage(error: unknown) {
  if (error instanceof Error && error.message) {
    return error.message
  }
  if (typeof error === 'string' && error.length > 0) {
    return error
  }
  return undefined
}

export function useUniversalTransaction() {
  const { pushChainClient } = usePushAccount()

  const sendTransaction = useCallback(
    async (
      params: UniversalSendParams,
      options?: UniversalTransactionOptions
    ): Promise<UniversalSendResponse> => {
      if (!pushChainClient) {
        throw new Error('Connect your wallet to run this transaction.')
      }

      const {
        showToast = true,
        pendingMessage = DEFAULT_PENDING_MESSAGE,
        successMessage = DEFAULT_SUCCESS_MESSAGE,
        errorMessage = DEFAULT_ERROR_MESSAGE
      } = options ?? {}

      const toastId = showToast ? toast.loading(pendingMessage) : undefined

      return pushChainClient.universal.sendTransaction(params).then(
        (response) => {
          if (toastId) {
            toast.success(successMessage, { id: toastId })
          }
          return response
        },
        (error) => {
          if (toastId) {
            toast.error(errorMessage, {
              id: toastId,
              description: resolveErrorMessage(error)
            })
          }
          throw error
        }
      )
    },
    [pushChainClient]
  )

  const getExplorerUrl = useCallback(
    (hash: string) =>
      pushChainClient?.explorer.getTransactionUrl(hash) ?? null,
    [pushChainClient]
  )

  return {
    sendTransaction,
    getExplorerUrl
  }
}

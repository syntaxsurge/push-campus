'use client'

import { useCallback } from 'react'

import type { ConnectionStatus } from '@pushchain/ui-kit'
import {
  PushUI,
  usePushChainClient,
  usePushWalletContext
} from '@pushchain/ui-kit'

type PushChainClient = ReturnType<typeof usePushChainClient>['pushChainClient']

type PushAccountHook = {
  address: string | null
  originAddress: string | null
  originChain: string | null
  status: ConnectionStatus
  isConnected: boolean
  connect: () => void
  disconnect: () => void
  pushChainClient: PushChainClient
}

export function usePushAccount(): PushAccountHook {
  let walletContext: ReturnType<typeof usePushWalletContext> | null = null
  let chainContext: ReturnType<typeof usePushChainClient> | null = null

  try {
    walletContext = usePushWalletContext()
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn(
        '[usePushAccount] Push wallet context unavailable. Falling back to a disconnected state.'
      )
    }
  }

  try {
    chainContext = usePushChainClient()
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn(
        '[usePushAccount] Push Chain client context unavailable. Falling back to a disconnected state.'
      )
    }
  }

  const connectionStatus =
    walletContext?.connectionStatus ??
    PushUI.CONSTANTS.CONNECTION.STATUS.NOT_CONNECTED
  const handleConnectToPushWallet = walletContext?.handleConnectToPushWallet
  const handleUserLogOutEvent = walletContext?.handleUserLogOutEvent

  const pushChainClient = chainContext?.pushChainClient ?? null
  const isInitialized = chainContext?.isInitialized ?? false

  const isConnected =
    connectionStatus === PushUI.CONSTANTS.CONNECTION.STATUS.CONNECTED &&
    Boolean(pushChainClient) &&
    isInitialized

  const address = pushChainClient?.universal.account ?? null
  const originAccount = pushChainClient?.universal.origin

  const connect = useCallback(() => {
    if (!handleConnectToPushWallet) {
      return
    }
    if (
      connectionStatus === PushUI.CONSTANTS.CONNECTION.STATUS.NOT_CONNECTED ||
      connectionStatus === PushUI.CONSTANTS.CONNECTION.STATUS.RETRY
    ) {
      handleConnectToPushWallet()
    }
  }, [connectionStatus, handleConnectToPushWallet])

  const disconnect = useCallback(() => {
    if (!handleUserLogOutEvent) {
      return
    }
    if (isConnected) {
      handleUserLogOutEvent()
    }
  }, [handleUserLogOutEvent, isConnected])

  return {
    address,
    originAddress: originAccount?.address ?? null,
    originChain: originAccount?.chain ?? null,
    status: connectionStatus,
    isConnected,
    connect,
    disconnect,
    pushChainClient
  }
}

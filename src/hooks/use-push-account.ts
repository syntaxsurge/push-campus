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
  const { connectionStatus, handleConnectToPushWallet, handleUserLogOutEvent } =
    usePushWalletContext()
  const { pushChainClient, isInitialized } = usePushChainClient()

  const isConnected =
    connectionStatus === PushUI.CONSTANTS.CONNECTION.STATUS.CONNECTED &&
    Boolean(pushChainClient) &&
    isInitialized

  const address = pushChainClient?.universal.account ?? null
  const originAccount = pushChainClient?.universal.origin

  const connect = useCallback(() => {
    if (
      connectionStatus === PushUI.CONSTANTS.CONNECTION.STATUS.NOT_CONNECTED ||
      connectionStatus === PushUI.CONSTANTS.CONNECTION.STATUS.RETRY
    ) {
      handleConnectToPushWallet()
    }
  }, [connectionStatus, handleConnectToPushWallet])

  const disconnect = useCallback(() => {
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

'use client'

import {
  PushUniversalAccountButton,
  PushUI,
  usePushChainClient,
  usePushWalletContext
} from '@pushchain/ui-kit'
import { useMemo } from 'react'

import { Badge } from '@/components/ui/badge'

function useWalletBadge() {
  const { connectionStatus } = usePushWalletContext()
  const { pushChainClient, isInitialized } = usePushChainClient()

  const networkLabel = useMemo(() => {
    const chainNamespace = pushChainClient?.universal.origin.chain
    if (!chainNamespace) return null
    if (chainNamespace === 'eip155:42101') return 'Push Donut Testnet'
    return chainNamespace
  }, [pushChainClient?.universal.origin.chain])

  const status =
    connectionStatus === PushUI.CONSTANTS.CONNECTION.STATUS.CONNECTED &&
    pushChainClient &&
    isInitialized
      ? 'connected'
      : connectionStatus

  return {
    status,
    networkLabel
  }
}

export function WalletMenu() {
  const { status, networkLabel } = useWalletBadge()

  return (
    <div className='flex items-center gap-2'>
      {networkLabel ? (
        <Badge variant='outline' className='hidden md:flex'>
          {networkLabel}
        </Badge>
      ) : null}
      <PushUniversalAccountButton
        uid='primary'
        connectButtonText='Connect Wallet'
        themeOverrides={{
          '--pwauth-btn-connect-border-radius': '0.75rem',
          light: {
            '--pwauth-btn-connect-bg-color': '#4f46e5'
          },
          dark: {
            '--pwauth-btn-connect-bg-color': '#6366f1'
          }
        }}
        loadingComponent={
          <span className='text-sm font-medium text-muted-foreground'>
            {status === PushUI.CONSTANTS.CONNECTION.STATUS.CONNECTING
              ? 'Connecting…'
              : 'Preparing Wallet…'}
          </span>
        }
      />
    </div>
  )
}

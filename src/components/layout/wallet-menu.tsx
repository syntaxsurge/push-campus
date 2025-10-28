'use client'

import {
  PushUniversalAccountButton,
  PushUI,
  usePushChainClient,
  usePushWalletContext
} from '@pushchain/ui-kit'
import { useMemo } from 'react'

import { Badge } from '@/components/ui/badge'
import { UNIVERSAL_WALLET_UID } from '@/lib/config'

const CHAIN_LABELS: Record<string, string> = {
  'eip155:42101': 'Push Donut Testnet',
  'eip155:11155111': 'Ethereum Sepolia',
  'eip155:1': 'Ethereum Mainnet',
  'eip155:421614': 'Arbitrum Sepolia',
  'eip155:84532': 'Base Sepolia',
  'eip155:97': 'BNB Testnet',
  'solana:EtWTRABZaYq6iMfeYKouRu166VU2xqa1': 'Solana Devnet',
  'solana:4uhcVJyU9pJkvQyS88uRDiswHXSCkY3z': 'Solana Testnet',
  'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp': 'Solana Mainnet'
}

function useWalletBadge() {
  const { connectionStatus } = usePushWalletContext(UNIVERSAL_WALLET_UID)
  const { pushChainClient, isInitialized } = usePushChainClient(UNIVERSAL_WALLET_UID)

  const networkLabel = useMemo(() => {
    const chainNamespace = pushChainClient?.universal.origin.chain
    if (!chainNamespace) return null
    return CHAIN_LABELS[chainNamespace] ?? chainNamespace
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
        uid={UNIVERSAL_WALLET_UID}
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

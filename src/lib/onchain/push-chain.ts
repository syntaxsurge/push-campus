import { createPublicClient, defineChain, fallback, http } from 'viem'
import type { PublicClient } from 'viem'

import {
  PUSH_BLOCK_EXPLORER_URL,
  PUSH_CHAIN_ID,
  PUSH_RPC_URLS
} from '@/lib/config'

export const pushChain = defineChain({
  id: PUSH_CHAIN_ID,
  name: 'Push Chain',
  network: 'push-chain',
  nativeCurrency: {
    name: 'Push Coin',
    symbol: 'PC',
    decimals: 18
  },
  rpcUrls: {
    default: {
      http: PUSH_RPC_URLS
    },
    public: {
      http: PUSH_RPC_URLS
    }
  },
  blockExplorers: {
    default: {
      name: 'Push Scan',
      url: PUSH_BLOCK_EXPLORER_URL
    }
  },
  testnet: PUSH_CHAIN_ID !== 42101 ? false : true
})

let cachedPublicClient: PublicClient | null = null

export function getPushPublicClient(): PublicClient {
  if (!cachedPublicClient) {
    cachedPublicClient = createPublicClient({
      chain: pushChain,
      transport: fallback(PUSH_RPC_URLS.map(url => http(url)))
    })
  }

  return cachedPublicClient
}

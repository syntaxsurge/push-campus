import { PushChain as PushChainSdk } from '@pushchain/core'

import { PLATFORM_TREASURY_ADDRESS, SUBSCRIPTION_PRICE_USD } from '@/lib/config'
import { parseNativeTokenAmount } from '@/lib/native-token'

type MoveableToken = {
  symbol: string
  decimals: number
  address: string
  mechanism: 'approve' | 'permit2' | 'native'
}

type PushChainClient = unknown

const PRICE_CACHE_TTL_MS = 60_000

type CachedPrice = {
  value: number
  expiresAt: number
}

const priceCache = new Map<string, CachedPrice>()

type CoingeckoResponse = Record<string, { usd?: number }>

export type PlatformFeeQuote = {
  usdAmount: number
  symbol: string
  decimals: number
  amount: bigint
  displayAmount: string
  treasuryAddress: `0x${string}`
  params: {
    to: `0x${string}`
    value?: bigint
    funds?: {
      amount: bigint
      token: MoveableToken
    }
  }
}

type PaymentConfig = {
  coingeckoId: string
  symbol: string
  decimals: number
  tokenAccessor?: 'ETH' | 'SOL' | 'USDT' | 'WETH'
}

const PUSH_CHAIN_IDS = new Set<string>([
  PushChainSdk.CONSTANTS.CHAIN.PUSH_MAINNET,
  PushChainSdk.CONSTANTS.CHAIN.PUSH_TESTNET,
  PushChainSdk.CONSTANTS.CHAIN.PUSH_TESTNET_DONUT,
  PushChainSdk.CONSTANTS.CHAIN.PUSH_LOCALNET
])

const PAYMENT_CONFIG_BY_CHAIN: Record<string, PaymentConfig> = {
  [PushChainSdk.CONSTANTS.CHAIN.ETHEREUM_MAINNET]: {
    coingeckoId: 'ethereum',
    symbol: 'ETH',
    decimals: 18,
    tokenAccessor: 'ETH'
  },
  [PushChainSdk.CONSTANTS.CHAIN.ETHEREUM_SEPOLIA]: {
    coingeckoId: 'ethereum',
    symbol: 'ETH',
    decimals: 18,
    tokenAccessor: 'ETH'
  },
  [PushChainSdk.CONSTANTS.CHAIN.SOLANA_MAINNET]: {
    coingeckoId: 'solana',
    symbol: 'SOL',
    decimals: 9,
    tokenAccessor: 'SOL'
  },
  [PushChainSdk.CONSTANTS.CHAIN.SOLANA_TESTNET]: {
    coingeckoId: 'solana',
    symbol: 'SOL',
    decimals: 9,
    tokenAccessor: 'SOL'
  },
  [PushChainSdk.CONSTANTS.CHAIN.SOLANA_DEVNET]: {
    coingeckoId: 'solana',
    symbol: 'SOL',
    decimals: 9,
    tokenAccessor: 'SOL'
  },
  [PushChainSdk.CONSTANTS.CHAIN.BNB_TESTNET]: {
    coingeckoId: 'binancecoin',
    symbol: 'BNB',
    decimals: 18,
    tokenAccessor: 'ETH'
  },
  [PushChainSdk.CONSTANTS.CHAIN.ARBITRUM_SEPOLIA]: {
    coingeckoId: 'ethereum',
    symbol: 'ETH',
    decimals: 18,
    tokenAccessor: 'ETH'
  },
  [PushChainSdk.CONSTANTS.CHAIN.BASE_SEPOLIA]: {
    coingeckoId: 'ethereum',
    symbol: 'ETH',
    decimals: 18,
    tokenAccessor: 'ETH'
  }
}

const DEFAULT_PUSH_CONFIG: PaymentConfig = {
  coingeckoId: 'push-protocol',
  symbol: 'PC',
  decimals: 18
}

function formatTokenAmount(amount: bigint, decimals: number, symbol: string) {
  const formatted = PushChainSdk.utils.helpers.formatUnits(amount.toString(), {
    decimals,
    precision: Math.min(decimals, 6)
  })
  return `${formatted} ${symbol}`
}

async function fetchCoingeckoPrice(id: string) {
  const cached = priceCache.get(id)
  if (cached && cached.expiresAt > Date.now()) {
    return cached.value
  }

  const response = await fetch(
    `https://api.coingecko.com/api/v3/simple/price?ids=${encodeURIComponent(id)}&vs_currencies=usd`,
    {
      headers: {
        accept: 'application/json'
      }
    }
  )

  if (!response.ok) {
    throw new Error(`Failed to fetch price for ${id} (${response.status})`)
  }

  const data = (await response.json()) as CoingeckoResponse
  const price = data[id]?.usd
  if (typeof price !== 'number' || !Number.isFinite(price)) {
    throw new Error(`Invalid price payload for ${id}`)
  }

  priceCache.set(id, {
    value: price,
    expiresAt: Date.now() + PRICE_CACHE_TTL_MS
  })

  return price
}

function getPaymentConfig(originChain: string | null | undefined): PaymentConfig {
  if (!originChain) {
    return DEFAULT_PUSH_CONFIG
  }
  if (PUSH_CHAIN_IDS.has(originChain)) {
    return DEFAULT_PUSH_CONFIG
  }
  return PAYMENT_CONFIG_BY_CHAIN[originChain] ?? DEFAULT_PUSH_CONFIG
}

async function calculateAmountFromUsd({
  usd,
  decimals,
  coingeckoId
}: {
  usd: number
  decimals: number
  coingeckoId: string
}) {
  const price = await fetchCoingeckoPrice(coingeckoId)
  if (price <= 0) {
    throw new Error(`Price for ${coingeckoId} must be positive`)
  }
  const tokenAmount = (usd / price).toFixed(Math.min(decimals, 8))
  return PushChainSdk.utils.helpers.parseUnits(tokenAmount, {
    decimals
  })
}

function resolveMoveableToken(
  client: PushChainClient | null | undefined,
  accessor: PaymentConfig['tokenAccessor']
) {
  if (!client || !accessor) {
    return null
  }
  const registry = (client as any)?.moveable?.token as
    | Record<string, MoveableToken | undefined>
    | undefined

  if (!registry) {
    return null
  }
  return registry[accessor] ?? null
}

function ensureTreasuryAddress(provided?: string | null) {
  const address = (provided ?? PLATFORM_TREASURY_ADDRESS) as `0x${string}` | ''
  if (!address) {
    throw new Error('Treasury address is not configured.')
  }
  return address
}

export async function resolvePlatformFeeQuote(options: {
  pushChainClient: PushChainClient | null
  originChain: string | null
  treasuryAddress?: string | null
}): Promise<PlatformFeeQuote> {
  const usdAmount = Number(SUBSCRIPTION_PRICE_USD)
  const treasuryAddress = ensureTreasuryAddress(options.treasuryAddress)
  const config = getPaymentConfig(options.originChain)

  try {
    const amount = await calculateAmountFromUsd({
      usd: usdAmount,
      decimals: config.decimals,
      coingeckoId: config.coingeckoId
    })

    if (PUSH_CHAIN_IDS.has(options.originChain ?? '')) {
      return {
        usdAmount,
        symbol: config.symbol,
        decimals: config.decimals,
        amount,
        displayAmount: formatTokenAmount(amount, config.decimals, config.symbol),
        treasuryAddress,
        params: {
          to: treasuryAddress,
          value: amount
        }
      }
    }

    const token = resolveMoveableToken(options.pushChainClient, config.tokenAccessor)
    if (!token) {
      throw new Error('Unable to resolve token information for the connected chain.')
    }

    return {
      usdAmount,
      symbol: config.symbol,
      decimals: config.decimals,
      amount,
      displayAmount: formatTokenAmount(amount, config.decimals, config.symbol),
      treasuryAddress,
      params: {
        to: treasuryAddress,
        funds: {
          amount,
          token
        }
      }
    }
  } catch (error) {
    const fallbackAmount = parseNativeTokenAmount(SUBSCRIPTION_PRICE_USD)
    return {
      usdAmount,
      symbol: DEFAULT_PUSH_CONFIG.symbol,
      decimals: DEFAULT_PUSH_CONFIG.decimals,
      amount: fallbackAmount,
      displayAmount: formatTokenAmount(
        fallbackAmount,
        DEFAULT_PUSH_CONFIG.decimals,
        DEFAULT_PUSH_CONFIG.symbol
      ),
      treasuryAddress,
      params: {
        to: treasuryAddress,
        value: fallbackAmount
      }
    }
  }
}

import { PushChain as PushChainSdk } from '@pushchain/core'
import { CHAIN_INFO } from '@pushchain/core/src/lib/constants/chain'
import { VM } from '@pushchain/core/src/lib/constants/enums'

import type { PublicClient } from 'viem'
import { createPublicClient, erc20Abi, http } from 'viem'
import { Connection, PublicKey } from '@solana/web3.js'

import { getCoingeckoUsdPrice } from '@/lib/pricing/coingecko'

import { PLATFORM_TREASURY_ADDRESS, SUBSCRIPTION_PRICE_USD } from '@/lib/config'
import { parseNativeTokenAmount } from '@/lib/native-token'

type MoveableToken = {
  symbol: string
  decimals: number
  address: string
  mechanism: 'approve' | 'permit2' | 'native'
}

type PushChainClient = unknown

type BalanceValidationArgs = {
  quote: PlatformFeeQuote
  pushAccount?: `0x${string}` | null
  pushPublicClient?: PublicClient | null
  pushChainClient?: PushChainClient | null
  originChain?: string | null
  originAddress?: string | null
}

type BalanceValidationResult =
  | { ok: true }
  | { ok: false; reason: string }

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

const PLATFORM_FEE_CACHE_TTL_MS = 5 * 60_000

type CachedFeeQuote = {
  quote: PlatformFeeQuote
  expiresAt: number
}

const platformFeeCache = new Map<string, CachedFeeQuote>()

function formatTokenAmount(amount: bigint, decimals: number, symbol: string) {
  const formatted = PushChainSdk.utils.helpers.formatUnits(amount.toString(), {
    decimals,
    precision: Math.min(decimals, 6)
  })
  return `${formatted} ${symbol}`
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
  const price = await getCoingeckoUsdPrice(coingeckoId)
  if (!price || price <= 0) {
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

function getPlatformFeeCacheKey(
  originChain: string | null | undefined,
  treasury: `0x${string}`,
  config: PaymentConfig
) {
  const originKey = originChain ?? 'push-chain'
  const tokenAccessor = config.tokenAccessor ?? 'native'
  return `${originKey}:${treasury}:${tokenAccessor}`
}

export async function resolvePlatformFeeQuote(options: {
  pushChainClient: PushChainClient | null
  originChain: string | null
  treasuryAddress?: string | null
}): Promise<PlatformFeeQuote> {
  const usdAmount = Number(SUBSCRIPTION_PRICE_USD)
  const treasuryAddress = ensureTreasuryAddress(options.treasuryAddress)
  const config = getPaymentConfig(options.originChain)
  const cacheKey = getPlatformFeeCacheKey(options.originChain, treasuryAddress, config)
  const cached = platformFeeCache.get(cacheKey)
  if (cached && cached.expiresAt > Date.now()) {
    return cached.quote
  }

  try {
    const amount = await calculateAmountFromUsd({
      usd: usdAmount,
      decimals: config.decimals,
      coingeckoId: config.coingeckoId
    })

    if (PUSH_CHAIN_IDS.has(options.originChain ?? '')) {
      const quote = {
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
      platformFeeCache.set(cacheKey, {
        quote,
        expiresAt: Date.now() + PLATFORM_FEE_CACHE_TTL_MS
      })
      return quote
    }

    const token = resolveMoveableToken(options.pushChainClient, config.tokenAccessor)
    if (!token) {
      throw new Error('Unable to resolve token information for the connected chain.')
    }

    const quote = {
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
    platformFeeCache.set(cacheKey, {
      quote,
      expiresAt: Date.now() + PLATFORM_FEE_CACHE_TTL_MS
    })
    return quote
  } catch (_error) {
    const fallbackAmount = parseNativeTokenAmount(SUBSCRIPTION_PRICE_USD)
    const fallback = {
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
    platformFeeCache.set(cacheKey, {
      quote: fallback,
      expiresAt: Date.now() + PLATFORM_FEE_CACHE_TTL_MS
    })
    return fallback
  }
}

function resolveOriginAccount(pushChainClient?: PushChainClient | null) {
  const origin = (pushChainClient as any)?.universal?.origin
  if (origin && typeof origin === 'object') {
    return {
      address: (origin.address ?? null) as string | null,
      chain: (origin.chain ?? null) as string | null
    }
  }
  return {
    address: null,
    chain: null
  }
}

function formatTokenShort(amount: bigint, token: MoveableToken) {
  return formatTokenAmount(amount, token.decimals, token.symbol)
}

async function validatePushBalance({
  quote,
  pushAccount,
  pushPublicClient
}: {
  quote: PlatformFeeQuote
  pushAccount?: `0x${string}` | null
  pushPublicClient?: PublicClient | null
}): Promise<BalanceValidationResult> {
  if (!pushAccount || !pushPublicClient) {
    return { ok: true }
  }

  const value = quote.params.value ?? 0n
  if (value === 0n) {
    return { ok: true }
  }

  try {
    const [balance, gasPrice, gasEstimate] = await Promise.all([
      pushPublicClient.getBalance({ address: pushAccount }),
      pushPublicClient.getGasPrice(),
      pushPublicClient
        .estimateGas({
          account: pushAccount,
          to: quote.params.to,
          value
        })
        .catch(() => 50_000n) // Fallback buffer
    ])

    const totalCost = value + gasPrice * gasEstimate
    if (balance < totalCost) {
      const shortfall = totalCost - balance
      return {
        ok: false,
        reason: `You need at least ${formatTokenAmount(totalCost, DEFAULT_PUSH_CONFIG.decimals, DEFAULT_PUSH_CONFIG.symbol)} on Push Chain to cover the platform fee and gas. You are short by ${formatTokenAmount(shortfall, DEFAULT_PUSH_CONFIG.decimals, DEFAULT_PUSH_CONFIG.symbol)}.`
      }
    }

    return { ok: true }
  } catch {
    return { ok: true }
  }
}

async function validateEvmOriginBalance({
  quote,
  originAddress,
  chainInfo
}: {
  quote: PlatformFeeQuote
  originAddress: `0x${string}`
  chainInfo: (typeof CHAIN_INFO)[keyof typeof CHAIN_INFO]
}): Promise<BalanceValidationResult> {
  const funds = quote.params.funds
  if (!funds) {
    return { ok: true }
  }

  const rpcUrl = chainInfo.defaultRPC?.[0]
  if (!rpcUrl) {
    return { ok: true }
  }

  const evmClient = createPublicClient({
    transport: http(rpcUrl)
  })

  try {
    const gasPrice = await evmClient.getGasPrice()
    const gasBuffer = gasPrice * 200_000n
    const nativeBalance = await evmClient.getBalance({ address: originAddress })

    if (funds.token.mechanism === 'native') {
      const required = funds.amount + gasBuffer
      if (nativeBalance < required) {
        const deficit = required - nativeBalance
        return {
          ok: false,
          reason: `You need at least ${formatTokenShort(
            required,
            funds.token
          )} on your origin wallet (including gas). You are short by ${formatTokenShort(
            deficit,
            funds.token
          )}.`
        }
      }
      return { ok: true }
    }

    if (nativeBalance < gasBuffer) {
      return {
        ok: false,
        reason:
          'You do not have enough native balance on your origin wallet to cover the gas fee required for this purchase.'
      }
    }

    if (funds.token.address && funds.token.address.startsWith('0x')) {
      const balance = await evmClient.readContract({
        address: funds.token.address as `0x${string}`,
        abi: erc20Abi,
        functionName: 'balanceOf',
        args: [originAddress]
      })

      if (balance < funds.amount) {
        const deficit = funds.amount - balance
        return {
          ok: false,
          reason: `You need at least ${formatTokenShort(
            funds.amount,
            funds.token
          )} of ${funds.token.symbol} on your origin wallet. You are short by ${formatTokenShort(
            deficit,
            funds.token
          )}.`
        }
      }
    }

    return { ok: true }
  } catch {
    return { ok: true }
  }
}

async function validateSvmOriginBalance({
  quote,
  originAddress,
  chainInfo
}: {
  quote: PlatformFeeQuote
  originAddress: string
  chainInfo: (typeof CHAIN_INFO)[keyof typeof CHAIN_INFO]
}): Promise<BalanceValidationResult> {
  const funds = quote.params.funds
  if (!funds) {
    return { ok: true }
  }

  const rpcUrl = chainInfo.defaultRPC?.[0]
  if (!rpcUrl) {
    return { ok: true }
  }

  try {
    const connection = new Connection(rpcUrl)
    const publicKey = new PublicKey(originAddress)

    if (funds.token.mechanism === 'native') {
      const lamports = await connection.getBalance(publicKey)
      const required = funds.amount + 500_000n // ~0.0005 SOL buffer
      if (BigInt(lamports) < required) {
        const deficit = required - BigInt(lamports)
        return {
          ok: false,
          reason: `You need at least ${formatTokenShort(
            required,
            funds.token
          )} on your Solana wallet (including fees). You are short by ${formatTokenShort(
            deficit,
            funds.token
          )}.`
        }
      }
    }

    // SPL token balance checks would require ATA discovery; defer for now.
    return { ok: true }
  } catch {
    return { ok: true }
  }
}

export async function validatePlatformFeeBalance({
  quote,
  pushAccount,
  pushPublicClient,
  pushChainClient,
  originChain,
  originAddress
}: BalanceValidationArgs): Promise<BalanceValidationResult> {
  const pushResult = await validatePushBalance({
    quote,
    pushAccount: pushAccount ?? null,
    pushPublicClient: pushPublicClient ?? null
  })
  if (!pushResult.ok) {
    return pushResult
  }

  const funds = quote.params.funds
  if (!funds) {
    return { ok: true }
  }

  const originMeta = resolveOriginAccount(pushChainClient)
  const effectiveOriginChain = originMeta.chain ?? originChain ?? null
  const effectiveOriginAddress =
    (originMeta.address ??
      originAddress) as `0x${string}` | string | null

  if (!effectiveOriginChain || !effectiveOriginAddress) {
    return { ok: true }
  }

  const chainInfo = CHAIN_INFO[effectiveOriginChain as keyof typeof CHAIN_INFO]
  if (!chainInfo) {
    return { ok: true }
  }

  if (chainInfo.vm === VM.EVM) {
    if (!effectiveOriginAddress.toLowerCase().startsWith('0x')) {
      return { ok: true }
    }
    return validateEvmOriginBalance({
      quote,
      originAddress: effectiveOriginAddress as `0x${string}`,
      chainInfo
    })
  }

  if (chainInfo.vm === VM.SVM) {
    return validateSvmOriginBalance({
      quote,
      originAddress: effectiveOriginAddress,
      chainInfo
    })
  }

  return { ok: true }
}

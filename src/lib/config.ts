/**
 * Environment-driven configuration for Push Chain integrations.
 * Values resolve at runtime so server and client both consume the same source.
 *
 * Reference:
 * - https://pushchain.github.io/push-chain-website/pr-preview/pr-1067/docs/chain/setup/tooling/wallet-setup/
 * - https://pushchain.github.io/push-chain-website/pr-preview/pr-1067/docs/chain/quickstart/
 */

/** Default UID used across Push Universal Wallet providers/hooks. */
export const UNIVERSAL_WALLET_UID = 'primary' as const

/** Default to Push Chain Donut testnet when chain id is not provided. */
const DEFAULT_PUSH_CHAIN_ID = 42101

export const PUSH_CHAIN_ID = Number(
  process.env.NEXT_PUBLIC_PUSH_CHAIN_ID ?? DEFAULT_PUSH_CHAIN_ID
) as 42101

const DEFAULT_PUSH_RPC_URLS = [
  'https://evm.rpc-testnet-donut-node1.push.org',
  'https://evm.rpc-testnet-donut-node2.push.org'
]

function parseRpcUrls(value: string | undefined) {
  if (!value) return DEFAULT_PUSH_RPC_URLS
  const entries = value
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean)
  return entries.length > 0 ? entries : DEFAULT_PUSH_RPC_URLS
}

export const PUSH_RPC_URLS = parseRpcUrls(process.env.NEXT_PUBLIC_PUSH_RPC_URLS)

export const PUSH_RPC_URL = PUSH_RPC_URLS[0]

export const PUSH_BLOCK_EXPLORER_URL =
  process.env.NEXT_PUBLIC_PUSH_BLOCK_EXPLORER_URL ?? 'https://donut.push.network'

/** Destination that receives subscription funds in the native token. */
export const PLATFORM_TREASURY_ADDRESS =
  process.env.NEXT_PUBLIC_PLATFORM_TREASURY_ADDRESS ?? ''

export const MEMBERSHIP_CONTRACT_ADDRESS =
  process.env.NEXT_PUBLIC_MEMBERSHIP_CONTRACT_ADDRESS ?? ''

export const BADGE_CONTRACT_ADDRESS =
  process.env.NEXT_PUBLIC_BADGE_CONTRACT_ADDRESS ?? ''

export const REGISTRAR_CONTRACT_ADDRESS =
  process.env.NEXT_PUBLIC_REGISTRAR_CONTRACT_ADDRESS ?? ''

export const MARKETPLACE_CONTRACT_ADDRESS =
  process.env.NEXT_PUBLIC_MARKETPLACE_CONTRACT_ADDRESS ?? ''

export const REVENUE_SPLIT_ROUTER_ADDRESS =
  process.env.NEXT_PUBLIC_REVENUE_SPLIT_ROUTER_ADDRESS ?? ''

export const SUBSCRIPTION_PRICE_NATIVE =
  process.env.NEXT_PUBLIC_SUBSCRIPTION_PRICE_NATIVE ?? '99'

export const SUBSCRIPTION_PRICE_USD =
  process.env.NEXT_PUBLIC_SUBSCRIPTION_PRICE_USD ?? '99'

export const NATIVE_TOKEN_SYMBOL =
  process.env.NEXT_PUBLIC_NATIVE_TOKEN_SYMBOL ?? 'PC'

export const NATIVE_TOKEN_DECIMALS = 18

const DEFAULT_MEMBERSHIP_DURATION_SECONDS = 60 * 60 * 24 * 30
const DEFAULT_MEMBERSHIP_TRANSFER_COOLDOWN_SECONDS = 60 * 60 * 24

function parsePositiveInt(value: string | undefined, fallback: number) {
  if (!value) return fallback
  const parsed = Number(value)
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback
  return Math.floor(parsed)
}

export const MEMBERSHIP_DURATION_SECONDS = parsePositiveInt(
  process.env.NEXT_PUBLIC_MEMBERSHIP_DURATION_SECONDS,
  DEFAULT_MEMBERSHIP_DURATION_SECONDS
)

export const MEMBERSHIP_TRANSFER_COOLDOWN_SECONDS = parsePositiveInt(
  process.env.NEXT_PUBLIC_MEMBERSHIP_TRANSFER_COOLDOWN_SECONDS,
  DEFAULT_MEMBERSHIP_TRANSFER_COOLDOWN_SECONDS
)

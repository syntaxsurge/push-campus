import { PushChain as PushChainSdk } from '@pushchain/core'

import { NATIVE_TOKEN_DECIMALS, NATIVE_TOKEN_SYMBOL } from '@/lib/config'

const DEFAULT_MIN_FRACTION_DIGITS = 2
const DEFAULT_MAX_FRACTION_DIGITS = 4

type FormatOptions = {
  minimumFractionDigits?: number
  maximumFractionDigits?: number
}

/**
 * Converts a human readable token amount into the native smallest unit using the
 * Push Chain helper so origin chains remain consistent with the SDK primitives.
 */
export function parseNativeTokenAmount(value: string | number) {
  const normalized = typeof value === 'number' ? value.toString() : value.trim()
  if (normalized === '') {
    return 0n
  }
  return PushChainSdk.utils.helpers.parseUnits(normalized, {
    decimals: NATIVE_TOKEN_DECIMALS
  })
}

function formatNativeTokenNumber(amount: bigint, precision: number) {
  const formatted = PushChainSdk.utils.helpers.formatUnits(amount.toString(), {
    decimals: NATIVE_TOKEN_DECIMALS,
    precision
  })

  return Number(formatted)
}

export function formatNativeToken(
  amount: bigint,
  options?: FormatOptions
) {
  const maximumFractionDigits =
    options?.maximumFractionDigits ?? DEFAULT_MAX_FRACTION_DIGITS
  const minimumFractionDigits = options?.minimumFractionDigits ?? 0
  const value = formatNativeTokenNumber(amount, maximumFractionDigits)
  const formatter = new Intl.NumberFormat('en-US', {
    minimumFractionDigits,
    maximumFractionDigits
  })
  return `${formatter.format(value)} ${NATIVE_TOKEN_SYMBOL}`
}

export function describeNativeAmount(amount: number | string) {
  return `${amount} ${NATIVE_TOKEN_SYMBOL}`
}

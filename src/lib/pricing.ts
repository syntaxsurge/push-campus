import { NATIVE_TOKEN_SYMBOL, SUBSCRIPTION_PRICE_NATIVE } from '@/lib/config'
import { parseNativeTokenAmount } from '@/lib/native-token'

export { SUBSCRIPTION_PRICE_NATIVE } from '@/lib/config'

export const SUBSCRIPTION_PRICE_LABEL = `${SUBSCRIPTION_PRICE_NATIVE} ${NATIVE_TOKEN_SYMBOL}/month`

export const SUBSCRIPTION_PRICE_AMOUNT = parseNativeTokenAmount(
  SUBSCRIPTION_PRICE_NATIVE
)

export const SUBSCRIPTION_PRICE_NUMBER = Number(SUBSCRIPTION_PRICE_NATIVE)

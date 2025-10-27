import { NATIVE_TOKEN_SYMBOL } from '@/lib/config'

const TOKEN_FORMATTER = new Intl.NumberFormat('en-US', {
  minimumFractionDigits: 0,
  maximumFractionDigits: 4
})

type BillingCadence = 'free' | 'monthly' | undefined

export function formatGroupPriceLabel(
  price: number | undefined,
  cadence: BillingCadence,
  options?: { includeCadence?: boolean }
) {
  const includeCadence = options?.includeCadence ?? true
  if (!price || price <= 0 || cadence === 'free') {
    return includeCadence ? 'Free' : 'Join for free'
  }
  const amount = `${TOKEN_FORMATTER.format(price)} ${NATIVE_TOKEN_SYMBOL}`
  if (!includeCadence) {
    return amount
  }
  const cadenceLabel = cadence === 'monthly' || !cadence ? 'month' : cadence
  return `${amount}/${cadenceLabel}`
}

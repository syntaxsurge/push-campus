'use client'

import { useCallback, useEffect, useMemo } from 'react'

import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from 'convex/react'
import { toast } from 'sonner'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import { Logo } from '@/components/layout/logo'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { api } from '@/convex/_generated/api'
import {
  MEMBERSHIP_DURATION_SECONDS,
  MEMBERSHIP_TRANSFER_COOLDOWN_SECONDS,
  NATIVE_TOKEN_SYMBOL,
  PLATFORM_TREASURY_ADDRESS,
  REGISTRAR_CONTRACT_ADDRESS
} from '@/lib/config'
import { registrarAbi } from '@/lib/onchain/abi'
import { getPushPublicClient } from '@/lib/onchain/push-chain'
import { RegistrarService } from '@/lib/onchain/services'
import { parseNativeTokenAmount } from '@/lib/native-token'
import { GroupMediaFields } from '@/features/groups/components/group-media-fields'
import { generateMembershipCourseId } from '@/features/groups/utils/membership'
import { isValidMediaReference, normalizeMediaInput } from '@/features/groups/utils/media'
import { useAppRouter } from '@/hooks/use-app-router'
import { usePlatformFeeQuote } from '@/hooks/use-platform-fee-quote'
import { usePushAccount } from '@/hooks/use-push-account'
import { useUniversalTransaction } from '@/hooks/use-universal-transaction'
import {
  resolvePlatformFeeQuote,
  validatePlatformFeeBalance
} from '@/lib/pricing/platform-fee'

const createGroupSchema = z
  .object({
    name: z.string().min(2, 'Group name is required').max(80),
    shortDescription: z
      .string()
      .min(20, 'Describe the group in at least 20 characters')
      .max(200, 'Keep the summary under 200 characters'),
    aboutUrl: z
      .string()
      .trim()
      .url('Enter a valid URL')
      .optional()
      .or(z.literal('')),
    thumbnailUrl: z.string().optional(),
    galleryUrls: z.array(z.string()).default([]),
    tags: z.string().optional(),
    visibility: z.enum(['public', 'private']).default('private'),
    billingCadence: z.enum(['free', 'monthly']).default('free'),
    price: z.string().optional()
  })
  .superRefine((data, ctx) => {
    if (data.billingCadence === 'monthly') {
      if (!data.price || data.price.trim() === '') {
        ctx.addIssue({
          path: ['price'],
          code: z.ZodIssueCode.custom,
          message: 'Monthly pricing is required'
        })
      } else if (Number.isNaN(Number(data.price))) {
        ctx.addIssue({
          path: ['price'],
          code: z.ZodIssueCode.custom,
          message: 'Enter a valid number'
        })
      } else if (Number(data.price) <= 0) {
        ctx.addIssue({
          path: ['price'],
          code: z.ZodIssueCode.custom,
          message: 'Price must be greater than zero'
        })
      }

      if (data.visibility !== 'private') {
        ctx.addIssue({
          path: ['visibility'],
          code: z.ZodIssueCode.custom,
          message: 'Paid memberships must be private.'
        })
      }
    }

    if (!isValidMediaReference(data.thumbnailUrl)) {
      ctx.addIssue({
        path: ['thumbnailUrl'],
        code: z.ZodIssueCode.custom,
        message: 'Enter a valid image URL or upload a file.'
      })
    }

    data.galleryUrls.forEach((value, index) => {
      if (!isValidMediaReference(value)) {
        ctx.addIssue({
          path: ['galleryUrls', index],
          code: z.ZodIssueCode.custom,
          message: 'Provide a valid image URL or upload a file.'
        })
      }
    })
  })

type CreateGroupFormValues = z.infer<typeof createGroupSchema>

const DEFAULT_VALUES: CreateGroupFormValues = {
  name: '',
  shortDescription: '',
  aboutUrl: '',
  thumbnailUrl: '',
  galleryUrls: [],
  tags: '',
  visibility: 'private',
  billingCadence: 'free',
  price: ''
}

export default function Create() {
  const router = useAppRouter()
  const { address, pushChainClient, originChain } = usePushAccount()
  const { sendTransaction } = useUniversalTransaction()
  const { label: platformFeeLabel, refresh: refreshPlatformFee } = usePlatformFeeQuote()
  const publicClient = useMemo(() => getPushPublicClient(), [])
  const createGroup = useMutation(api.groups.create)
  const generateUploadUrl = useMutation(api.media.generateUploadUrl)
  const requestUploadUrl = useCallback(() => generateUploadUrl({}), [generateUploadUrl])

  const form = useForm<CreateGroupFormValues>({
    resolver: zodResolver(createGroupSchema),
    defaultValues: DEFAULT_VALUES
  })

  const billingCadence = form.watch('billingCadence')

  useEffect(() => {
    if (
      billingCadence === 'monthly' &&
      form.getValues('visibility') !== 'private'
    ) {
      form.setValue('visibility', 'private', {
        shouldDirty: true,
        shouldValidate: true
      })
    }
  }, [billingCadence, form])

  const isProcessing = form.formState.isSubmitting

  const handleSubmit = async (values: CreateGroupFormValues) => {
    let txHash: `0x${string}` | null = null

    if (!address) {
      toast.error('Connect your wallet to continue')
      return
    }

    const treasuryAddress = PLATFORM_TREASURY_ADDRESS as `0x${string}` | ''
    const registrarAddress = REGISTRAR_CONTRACT_ADDRESS as `0x${string}` | ''

    if (!treasuryAddress) {
      toast.error('Treasury address not configured')
      return
    }

    if (!registrarAddress) {
      toast.error('Registrar contract address not configured')
      return
    }

    if (!pushChainClient) {
      toast.error('Wallet client unavailable. Please reconnect your wallet.')
      return
    }

    const registrarService = new RegistrarService({
      publicClient,
      pushChain: pushChainClient,
      address: registrarAddress
    })

    try {
      const feeQuote = await resolvePlatformFeeQuote({
        pushChainClient,
        originChain: originChain ?? null,
        treasuryAddress
      })

      const balanceCheck = await validatePlatformFeeBalance({
        quote: feeQuote,
        pushAccount: address as `0x${string}`,
        pushPublicClient: publicClient,
        pushChainClient,
        originChain: originChain ?? null
      })

      if (!balanceCheck.ok) {
        toast.error(balanceCheck.reason)
        return
      }

      // Precompute price & course id so we can preflight the registrar call
      const priceString =
        values.billingCadence === 'monthly' && values.price
          ? values.price.trim()
          : ''
      const formattedPrice =
        priceString !== '' ? Math.max(0, Number(priceString)) : 0
      const membershipPriceAmount =
        priceString !== '' ? parseNativeTokenAmount(priceString) : 0n
      const courseIdStr = generateMembershipCourseId()
      const courseId = BigInt(courseIdStr)

      // Sanity: Registrar must have marketplace configured and match env
      const registrarMarketplace = (await publicClient.readContract({
        address: registrarAddress,
        abi: registrarAbi,
        functionName: 'marketplace'
      })) as `0x${string}`
      if (
        !registrarMarketplace ||
        registrarMarketplace === '0x0000000000000000000000000000000000000000'
      ) {
        toast.error(
          'Registrar is not configured with a marketplace address. Contact the admin to set it.'
        )
        return
      }

      // Preflight the registrar call so we fail fast before charging the platform fee
      try {
        await publicClient.simulateContract({
          address: registrarAddress,
          abi: registrarAbi,
          functionName: 'registerCourse',
          args: [
            courseId,
            membershipPriceAmount,
            [address as `0x${string}`],
            [10000],
            BigInt(MEMBERSHIP_DURATION_SECONDS),
            BigInt(MEMBERSHIP_TRANSFER_COOLDOWN_SECONDS)
          ],
          account: address as `0x${string}`
        })
      } catch (err: any) {
        console.error('Preflight registerCourse failed', err)
        toast.error(
          err?.shortMessage ??
            'Registrar rejected course registration. Check configuration.'
        )
        return
      }

      // Platform fee payment (after preflight so we don’t charge if wiring is broken)
      const feeTx = await sendTransaction(
        feeQuote.params,
        {
          pendingMessage: `Paying ${feeQuote.displayAmount} platform fee…`,
          successMessage: 'Platform fee paid',
          errorMessage: 'Unable to process platform fee'
        }
      )

      txHash = feeTx.hash as `0x${string}`
      await feeTx.wait()
      void refreshPlatformFee()

      const registerTx = await registrarService.registerCourse(
        courseId,
        membershipPriceAmount,
        [address as `0x${string}`],
        [10000],
        BigInt(MEMBERSHIP_DURATION_SECONDS),
        BigInt(MEMBERSHIP_TRANSFER_COOLDOWN_SECONDS)
      )
      await registerTx.wait()

      const thumbnailSource = normalizeMediaInput(values.thumbnailUrl)

      const gallery = (values.galleryUrls ?? [])
        .map(entry => normalizeMediaInput(entry))
        .filter(Boolean)

      const tags = values.tags
        ?.split(',')
        .map(tag => tag.trim().toLowerCase())
        .filter(Boolean)

      const resolvedVisibility =
        values.billingCadence === 'monthly' ? 'private' : values.visibility

      const groupId = await createGroup({
        ownerAddress: address,
        name: values.name.trim(),
        description: undefined,
        shortDescription: values.shortDescription.trim(),
        aboutUrl: normalizeMediaInput(values.aboutUrl) || undefined,
        thumbnailUrl: thumbnailSource || undefined,
        galleryUrls: gallery.length ? gallery : undefined,
        tags,
        visibility: resolvedVisibility,
        billingCadence:
          formattedPrice > 0 ? 'monthly' : values.billingCadence,
        price: formattedPrice,
        subscriptionId: courseIdStr,
        subscriptionPaymentTxHash: txHash ?? undefined
      } as any)

      toast.success('Your group is live!')
      router.push(`/${groupId}/about`)
    } catch (error: any) {
      console.error('Failed to complete group creation', error)
      const message =
        txHash !== null
          ? 'Group creation payment succeeded but the finalization failed. Please refresh — your group may appear shortly.'
          : 'Payment failed. Please try again.'
      toast.error(message)
    }
  }

  return (
    <div className='relative min-h-screen overflow-hidden bg-gradient-to-br from-background via-background to-muted/20'>
      {/* Enhanced decorative background with logo blue */}
      <div className='absolute inset-0 overflow-hidden'>
        <div className='absolute -left-4 top-0 h-72 w-72 rounded-full bg-[radial-gradient(circle,_hsl(var(--brand-blue)/0.15),_transparent_65%)] blur-3xl' />
        <div className='absolute -right-4 top-1/4 h-96 w-96 rounded-full bg-[radial-gradient(circle,_hsl(var(--brand-blue-light)/0.12),_transparent_65%)] blur-3xl' />
        <div className='absolute bottom-0 left-1/3 h-80 w-80 rounded-full bg-[radial-gradient(circle,_hsl(var(--brand-blue)/0.1),_transparent_70%)] blur-3xl' />
      </div>

      <div className='relative mx-auto max-w-6xl px-6 py-12'>
        {/* Header */}
        <div className='mb-12 text-center'>
          <div className='mb-6 flex justify-center'>
            <Logo className='text-2xl' />
          </div>
          <h1 className='mb-4 text-5xl font-bold tracking-tight md:text-6xl'>
            <span className='bg-gradient-to-r from-foreground via-brand-blue-dark to-brand-blue-light bg-clip-text text-transparent'>
              Create Your Universal App
            </span>
          </h1>
          <p className='mx-auto max-w-2xl text-lg text-muted-foreground'>
            Deploy once on Push Chain. Reach learners across <span className='font-semibold text-foreground'>Ethereum, Solana, Base, and 15+ chains</span>—with any wallet, any token, and zero friction.
          </p>
        </div>

        {/* Main Content */}
        <div className='mx-auto max-w-3xl'>
          {/* Pricing Banner */}
          <div className='mb-8 rounded-2xl border border-border/50 bg-card/80 p-6 shadow-lg backdrop-blur-sm'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm font-medium text-muted-foreground'>Platform fee</p>
                <p className='text-3xl font-bold text-foreground'>{platformFeeLabel}</p>
              </div>
              <div className='rounded-full bg-primary/10 px-4 py-2 text-sm font-semibold text-primary'>
                Renews monthly
              </div>
            </div>
            <p className='mt-4 text-sm text-muted-foreground'>
              Billed once every 30 days. Renew before the window closes to keep your community online without interruption.
            </p>
          </div>

          {/* Features Grid */}
          <div className='mb-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
            {[
              { icon: '🌐', title: 'Universal Access', desc: 'Reach users on 15+ chains' },
              { icon: '💎', title: 'Any Wallet, Any Token', desc: 'No forced switching' },
              { icon: '🔗', title: 'Shared-State L1', desc: 'Powered by Push Chain' },
              { icon: '⚡', title: 'Zero Friction', desc: 'No bridges or relayers' },
              { icon: '🎓', title: 'Built-In Classroom', desc: 'Courses & credentials' },
              { icon: '🚀', title: 'Deploy Once', desc: 'Instant cross-chain reach' }
            ].map((feature, i) => (
              <div
                key={i}
                className='group rounded-xl border border-border/40 bg-card/60 p-4 backdrop-blur-sm transition-all hover:border-primary/40 hover:bg-card/80 hover:shadow-md hover:shadow-primary/5'
              >
                <div className='mb-2 text-2xl'>{feature.icon}</div>
                <h3 className='mb-1 font-semibold text-foreground group-hover:text-primary transition-colors'>{feature.title}</h3>
                <p className='text-xs text-muted-foreground'>{feature.desc}</p>
              </div>
            ))}
          </div>

          {/* Form Card */}
          <div className='rounded-2xl border border-primary/20 bg-card/80 p-8 shadow-2xl shadow-primary/5 backdrop-blur-xl md:p-10'>
            <div className='mb-8'>
              <h2 className='text-2xl font-bold text-foreground'>Community Details</h2>
              <p className='mt-2 text-sm text-muted-foreground'>
                Configure your universal learning community. Once deployed, it'll be accessible across all supported chains.
              </p>
            </div>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className='space-y-6'>
                <FormField
                  control={form.control}
                  name='name'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className='text-sm font-semibold'>Group name</FormLabel>
                      <FormControl>
                        <Input
                          placeholder='e.g., AI Automation Society'
                          className='h-12'
                          {...field}
                        />
                      </FormControl>
                      <FormDescription className='flex justify-between text-xs text-muted-foreground'>
                        <span>2-80 characters</span>
                        <span>{(field.value?.length ?? 0).toString()} / 80</span>
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name='shortDescription'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className='text-sm font-semibold'>Description</FormLabel>
                      <FormControl>
                        <Textarea
                          rows={4}
                          placeholder='Describe what makes your community special...'
                          {...field}
                        />
                      </FormControl>
                      <FormDescription className='flex justify-between text-xs text-muted-foreground'>
                        <span>20-200 characters</span>
                        <span>{(field.value?.length ?? 0).toString()} / 200</span>
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className='grid gap-6 sm:grid-cols-2'>
                  <FormField
                    control={form.control}
                    name='visibility'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className='text-sm font-semibold'>Visibility</FormLabel>
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                          disabled={billingCadence === 'monthly'}
                        >
                          <FormControl>
                            <SelectTrigger className='h-12'>
                              <SelectValue placeholder='Select visibility' />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem
                              value='public'
                              disabled={billingCadence === 'monthly'}
                            >
                              Public
                            </SelectItem>
                            <SelectItem value='private'>Private</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription className='text-xs'>
                          Public groups are discoverable by everyone
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name='billingCadence'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className='text-sm font-semibold'>Membership Type</FormLabel>
                        <Select
                          value={field.value}
                          onValueChange={value => {
                            field.onChange(value)
                            if (value === 'free') {
                              form.setValue('price', '')
                            }
                          }}
                        >
                          <FormControl>
                            <SelectTrigger className='h-12'>
                              <SelectValue placeholder='Choose pricing' />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value='free'>Free</SelectItem>
                            <SelectItem value='monthly'>Paid (Monthly)</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription className='text-xs'>
                          Set your membership model
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {form.watch('billingCadence') === 'monthly' && (
                  <FormField
                    control={form.control}
                    name='price'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className='text-sm font-semibold'>
                          Monthly Price ({NATIVE_TOKEN_SYMBOL})
                        </FormLabel>
                        <FormControl>
                          <Input
                            type='number'
                            min='0'
                            step='0.01'
                            placeholder='49.00'
                            className='h-12'
                            {...field}
                          />
                        </FormControl>
                        <FormDescription className='text-xs'>
                          Members pay this amount monthly in the native token
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                <div className='space-y-4'>
                  <h3 className='text-sm font-semibold text-foreground'>Media & Branding</h3>
                  <GroupMediaFields
                    form={form}
                    requestUploadUrl={requestUploadUrl}
                  />
                </div>

                <FormField
                  control={form.control}
                  name='aboutUrl'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className='text-sm font-semibold'>Intro Video URL (Optional)</FormLabel>
                      <FormControl>
                        <Input
                          placeholder='https://youtube.com/watch?v=...'
                          className='h-12'
                          {...field}
                        />
                      </FormControl>
                      <FormDescription className='text-xs'>
                        YouTube, Vimeo, or direct video links
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name='tags'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className='text-sm font-semibold'>Tags (Optional)</FormLabel>
                      <FormControl>
                        <Input
                          placeholder='community, education, technology'
                          className='h-12'
                          {...field}
                        />
                      </FormControl>
                      <FormDescription className='text-xs'>
                        Comma-separated tags help members find you
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className='pt-4'>
                  <Button
                    type='submit'
                    disabled={isProcessing}
                    className='h-12 w-full bg-gradient-to-r from-brand-blue to-brand-blue-light text-base font-semibold uppercase tracking-wide hover:opacity-90 shadow-lg shadow-primary/20'
                    size='lg'
                  >
                    {isProcessing ? 'Deploying Universal App...' : 'Deploy Universal App'}
                  </Button>
                  <p className='mt-3 text-center text-xs text-muted-foreground'>
                    By deploying, you agree to our terms. Your app will be accessible across all supported chains.
                  </p>
                </div>
              </form>
            </Form>
          </div>
        </div>
      </div>
    </div>
  )
}

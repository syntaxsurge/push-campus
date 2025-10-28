'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'

import { useMutation } from 'convex/react'
import { toast } from 'sonner'
import { Address } from 'viem'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { api } from '@/convex/_generated/api'
import {
  MARKETPLACE_CONTRACT_ADDRESS,
  MEMBERSHIP_CONTRACT_ADDRESS,
  NATIVE_TOKEN_SYMBOL
} from '@/lib/config'
import { MembershipPassService } from '@/lib/onchain/services/membershipPassService'
import { MarketplaceService } from '@/lib/onchain/services/marketplaceService'
import { getPushPublicClient } from '@/lib/onchain/push-chain'
import { parseNativeTokenAmount } from '@/lib/native-token'
import { formatTimestampRelative } from '@/lib/time'
import { useGroupContext } from '../context/group-context'
import { normalizePassExpiry, resolveMembershipCourseId } from '../utils/membership'
import { formatGroupPriceLabel } from '../utils/price'
import { usePushAccount } from '@/hooks/use-push-account'
import { useTokenUsdRate } from '@/hooks/use-token-usd-rate'

type JoinPreparation = {
  requiresPayment: boolean
  skipPayment: boolean
  courseId: bigint | null
  amount: bigint
  passExpiryMs?: number
}

export function JoinGroupButton() {
  const { group, owner, isOwner, isMember, membership } = useGroupContext()
  const { address, pushChainClient } = usePushAccount()
  const publicClient = useMemo(() => getPushPublicClient(), [])
  const joinGroup = useMutation(api.groups.join)

  const [isPreparing, setIsPreparing] = useState(false)
  const [isFinalizing, setIsFinalizing] = useState(false)
  const [confirmationOpen, setConfirmationOpen] = useState(false)
  const [pendingJoin, setPendingJoin] = useState<JoinPreparation | null>(null)
  const { rate: pushUsdRate, refresh: refreshPushUsdRate } = useTokenUsdRate('push-protocol', {
    autoFetch: true
  })
  const marketplaceAddress = MARKETPLACE_CONTRACT_ADDRESS as `0x${string}` | null
  const membershipAddress = MEMBERSHIP_CONTRACT_ADDRESS as `0x${string}` | null
  const membershipService = useMemo(() => {
    if (!membershipAddress) return null
    return new MembershipPassService({
      publicClient,
      pushChain: pushChainClient ?? null,
      address: membershipAddress
    })
  }, [publicClient, pushChainClient, membershipAddress])
  const marketplaceService = useMemo(() => {
    if (!marketplaceAddress) return null
    return new MarketplaceService({
      publicClient,
      pushChain: pushChainClient ?? null,
      address: marketplaceAddress
    })
  }, [publicClient, pushChainClient, marketplaceAddress])
  const membershipCourseId = useMemo(() => resolveMembershipCourseId(group), [group])
  const blockchainAddress = address as `0x${string}` | null
  const backendAddress = address as `0x${string}` | null

  if (isOwner) {
    return (
      <Button className='w-full' variant='secondary' disabled>
        You own this group
      </Button>
    )
  }

  if (isMember) {
    return <LeaveGroupButton membershipService={membershipService} courseId={membershipCourseId} />
  }

  const prepareJoin = useCallback(async (): Promise<JoinPreparation | null> => {
      if (!blockchainAddress || !backendAddress) {
        toast.error('Connect your wallet to join this group.')
        return null
      }

      if (!owner?.walletAddress) {
        toast.error('Group owner wallet not available.')
        return null
      }

      if (!publicClient) {
        toast.error('Blockchain client unavailable. Please try again.')
        return null
      }

      const price = group.price ?? 0
      const requiresPayment = price > 0
      let skipPayment = false
      let passExpiryMs: number | undefined

      const candidateMarketplaceAddress = marketplaceAddress ?? undefined
      const candidateCourseId = membershipCourseId ?? null

      if (requiresPayment) {
        if (!candidateMarketplaceAddress) {
          toast.error('Marketplace contract address not configured.')
          return null
        }
        if (!candidateCourseId) {
          toast.error('Membership course configuration missing. Contact the group owner.')
          return null
        }
        if (!membershipService) {
          toast.error('Membership contract address not configured.')
          return null
        }
        if (!marketplaceService) {
          toast.error('Marketplace service unavailable. Please reconnect your wallet.')
          return null
        }
      }

      if (
        requiresPayment &&
        membershipService &&
        candidateCourseId &&
        blockchainAddress
      ) {
        try {
          const [active, state] = await Promise.all([
            membershipService.isPassActive(
              candidateCourseId,
              blockchainAddress as Address
            ),
            membershipService.getPassState(
              candidateCourseId,
              blockchainAddress as Address
            )
          ])

          if (active) {
            skipPayment = true
            passExpiryMs = normalizePassExpiry(state.expiresAt)
            toast.info('Membership pass detected. Rejoining without payment.')
          }
        } catch (error) {
          console.error('Failed to verify membership pass', error)
        }
      }

      if (
        requiresPayment &&
        !skipPayment &&
        membership?.passExpiresAt &&
        membership.passExpiresAt > Date.now()
      ) {
        skipPayment = true
        passExpiryMs = membership.passExpiresAt
      }

      const amount =
        requiresPayment && !skipPayment
          ? parseNativeTokenAmount((group.price ?? 0).toString())
          : 0n

      if (requiresPayment && !skipPayment) {
        if (!pushChainClient) {
          toast.error('Wallet client unavailable. Please reconnect your wallet.')
          return null
        }

        const balance = await publicClient.getBalance({
          address: blockchainAddress as Address
        })

        if (balance < amount) {
          toast.error(`Insufficient ${NATIVE_TOKEN_SYMBOL} balance to join this group.`)
          return null
        }
      }
      return {
        requiresPayment,
        skipPayment,
        courseId: candidateCourseId,
        amount,
        passExpiryMs
      }
    },
  [
    backendAddress,
    blockchainAddress,
    group.price,
    marketplaceAddress,
    marketplaceService,
    membership?.passExpiresAt,
    membershipCourseId,
    membershipService,
    owner?.walletAddress,
    publicClient,
    pushChainClient
  ])

  const finalizeJoin = useCallback(
    async (preparation: JoinPreparation) => {
      if (!backendAddress) {
        toast.error('Connect your wallet to join this group.')
        return
      }

      let txHash: `0x${string}` | undefined
      let passExpiryMs = preparation.passExpiryMs

      try {
        setIsFinalizing(true)

        if (preparation.requiresPayment && !preparation.skipPayment) {
          if (!marketplaceService || !membershipService || !preparation.courseId) {
            toast.error('Marketplace contracts unavailable. Please reconnect your wallet.')
            return
          }

          console.log('[JoinGroup] Executing purchasePrimary', {
            courseId: preparation.courseId.toString(),
            price: preparation.amount.toString()
          })
          const tx = await marketplaceService.purchasePrimary(
            preparation.courseId,
            preparation.amount
          )

          txHash = tx.hash as `0x${string}`
          await tx.wait()

          try {
            console.log('[JoinGroup] Verifying pass state after mint', {
              courseId: preparation.courseId.toString(),
              address: blockchainAddress
            })
            const [state, balance] = await Promise.all([
              membershipService.getPassState(
                preparation.courseId,
                blockchainAddress as Address
              ),
              membershipService.balanceOf(
                blockchainAddress as Address,
                preparation.courseId
              )
            ])
            passExpiryMs = normalizePassExpiry(state.expiresAt) ?? passExpiryMs
            const hasPassNow = balance > 0n
            if (!hasPassNow) {
              throw new Error('Membership pass not detected after purchase.')
            }
          } catch (error) {
            console.error('Failed to verify membership pass after purchase', error)
            toast.error(
              'Payment succeeded, but the membership pass could not be confirmed. Please try again or contact support.'
            )
            return
          }
        }

        await joinGroup({
          groupId: group._id,
          memberAddress: backendAddress,
          txHash,
          hasActivePass: preparation.skipPayment,
          passExpiresAt: passExpiryMs
        })

        toast.success('Welcome aboard! You now have access to this group.')
      } catch (error) {
        console.error('Failed to join group', error)
        toast.error('Joining failed. Please retry in a moment.')
      } finally {
        setIsFinalizing(false)
        setPendingJoin(null)
        setConfirmationOpen(false)
      }
    },
    [
      backendAddress,
      blockchainAddress,
      group._id,
      joinGroup,
      marketplaceService,
      membershipService
    ]
  )

  const handleJoin = async () => {
    if (isPreparing || isFinalizing) {
      return
    }

    setIsPreparing(true)
    try {
      const preparation = await prepareJoin()
      if (!preparation) {
        return
      }

      if (preparation.requiresPayment && !preparation.skipPayment) {
        setPendingJoin(preparation)
        try {
          await refreshPushUsdRate()
        } catch (error) {
          console.error('Failed to refresh USD conversion', error)
        }
        setConfirmationOpen(true)
      } else {
        await finalizeJoin(preparation)
      }
    } finally {
      setIsPreparing(false)
    }
  }

  const priceLabel = formatGroupPriceLabel(group.price, group.billingCadence, {
    includeCadence: true,
    usdRate: pushUsdRate ?? null
  })
  const buttonLabel =
    group.price && group.price > 0 ? `Join ${priceLabel}` : 'Join for free'
  const isBusy = isPreparing || isFinalizing
  const usdPriceLabel = formatGroupPriceLabel(group.price, group.billingCadence, {
    includeCadence: false,
    usdRate: pushUsdRate ?? null
  })
  const nativePriceLabel = formatGroupPriceLabel(group.price, group.billingCadence, {
    includeCadence: false
  })

  const handleCancelConfirmation = () => {
    if (isFinalizing) return
    setConfirmationOpen(false)
    setPendingJoin(null)
  }

  const handleConfirmJoin = async () => {
    const preparation = pendingJoin
    if (!preparation) {
      setConfirmationOpen(false)
      return
    }
    await finalizeJoin(preparation)
  }

  return (
    <>
      <Button
        className='w-full uppercase'
        disabled={isBusy}
        onClick={handleJoin}
      >
        {isBusy ? 'Processing...' : buttonLabel}
      </Button>
      <Dialog
        open={confirmationOpen}
        onOpenChange={open => {
          if (!open) {
            handleCancelConfirmation()
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm membership payment</DialogTitle>
            <DialogDescription>
              We&apos;ll process the membership purchase in the native token.
            </DialogDescription>
          </DialogHeader>
          <div className='space-y-3 py-2'>
            <div className='flex items-center justify-between rounded-lg bg-muted/30 px-3 py-2'>
              <span className='text-sm font-medium text-muted-foreground'>Membership price</span>
              <span className='text-sm font-semibold text-foreground'>
                {usdPriceLabel === 'Free' ? nativePriceLabel : usdPriceLabel}
              </span>
            </div>
            <div className='rounded-lg border border-dashed border-border/60 px-3 py-2'>
              <p className='text-xs font-medium uppercase tracking-wide text-muted-foreground'>
                Settlement
              </p>
              <p className='mt-1 text-sm font-semibold text-foreground'>
                {nativePriceLabel}
              </p>
              <p className='text-xs text-muted-foreground'>
                Paid in {NATIVE_TOKEN_SYMBOL}. Gas fees apply separately.
              </p>
            </div>
          </div>
          <DialogFooter className='flex gap-2 sm:justify-end'>
            <Button
              type='button'
              variant='outline'
              onClick={handleCancelConfirmation}
              disabled={isFinalizing}
            >
              Cancel
            </Button>
            <Button
              type='button'
              onClick={handleConfirmJoin}
              disabled={isFinalizing || !pendingJoin}
            >
              {isFinalizing ? 'Processing...' : 'Pay and join'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

type LeaveGroupButtonProps = {
  membershipService: MembershipPassService | null
  courseId: bigint | null
}

function LeaveGroupButton({ membershipService, courseId }: LeaveGroupButtonProps) {
  const { group, membership } = useGroupContext()
  const { address } = usePushAccount()
  const leaveGroup = useMutation(api.groups.leave)
  const [isLeaving, setIsLeaving] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [resolvedExpiryMs, setResolvedExpiryMs] = useState<number | undefined>(
    membership?.passExpiresAt
  )
  const [isCheckingExpiry, setIsCheckingExpiry] = useState(false)

  const isFreeGroup = (group.price ?? 0) === 0

  const blockchainAddress = address as `0x${string}` | null
  const backendAddress = address as `0x${string}` | null

  const handleLeave = async () => {
    if (!blockchainAddress || !backendAddress) {
      toast.error('Connect your wallet to manage memberships.')
      return
    }

    try {
      setIsLeaving(true)
      let passExpiryMs = resolvedExpiryMs ?? membership?.passExpiresAt

      await leaveGroup({
        groupId: group._id,
        memberAddress: backendAddress,
        passExpiresAt: passExpiryMs
      })

      toast.success('You have left this group.')
      setDialogOpen(false)
    } catch (error) {
      console.error('Failed to leave group', error)
      toast.error('Unable to leave the group right now.')
    } finally {
      setIsLeaving(false)
    }
  }

  useEffect(() => {
    if (
      !dialogOpen ||
      isFreeGroup ||
      !membershipService ||
      !courseId ||
      !blockchainAddress ||
      typeof window === 'undefined'
    ) {
      return
    }

    let cancelled = false
    setIsCheckingExpiry(true)
    membershipService
      .getPassState(courseId, blockchainAddress as Address)
      .then(state => normalizePassExpiry(state.expiresAt))
      .then(expiryMs => {
        if (!cancelled && expiryMs) {
          setResolvedExpiryMs(expiryMs)
        }
      })
      .catch(error => {
        console.error('Failed to resolve pass state before leaving', error)
      })
      .finally(() => {
        if (!cancelled) {
          setIsCheckingExpiry(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [dialogOpen, isFreeGroup, membershipService, courseId, blockchainAddress])

  const expirySeconds = resolvedExpiryMs ? Math.floor(resolvedExpiryMs / 1000) : null
  const expiryDisplay =
    !isFreeGroup && resolvedExpiryMs
      ? formatTimestampRelative(expirySeconds ?? 0)
      : 'No active expiry found'

  return (
    <>
      <Button
        className='w-full'
        variant='outline'
        onClick={() => setDialogOpen(true)}
        disabled={isLeaving}
      >
        {isLeaving ? 'Leaving...' : 'Leave group'}
      </Button>

      <Dialog
        open={dialogOpen}
        onOpenChange={open => {
          if (!isLeaving) {
            setDialogOpen(open)
          }
        }}
      >
        <DialogContent className='sm:max-w-lg'>
          <DialogHeader>
            <DialogTitle>Leave {group.name}</DialogTitle>
            <DialogDescription>
              Leaving removes your access immediately. Review the details before you continue.
            </DialogDescription>
          </DialogHeader>

          <div className='space-y-3 text-sm text-muted-foreground'>
            {isFreeGroup ? (
              <p>
                This group is free. Leaving will simply hide the content from your dashboard until
                you join again, and you can re-enter whenever you like.
              </p>
            ) : (
              <>
                <p>
                  Because this group is paid, your dashboard access ends as soon as you leave. If
                  your ERC-1155 membership pass is still active and you keep holding it, you can
                  rejoin without paying again.
                </p>
                <p>
                  Selling the pass or letting it expire means you will need to mint a fresh
                  membership before returning.
                </p>
                <div className='rounded-md border border-border/60 bg-muted/40 px-3 py-2 text-xs text-muted-foreground'>
                  {isCheckingExpiry
                    ? 'Checking your pass expiration...'
                    : `Current pass expires ${expiryDisplay}.`}
                </div>
              </>
            )}
          </div>

          <DialogFooter>
            <Button variant='ghost' onClick={() => setDialogOpen(false)} disabled={isLeaving}>
              Stay in group
            </Button>
            <Button variant='destructive' onClick={handleLeave} disabled={isLeaving}>
              {isLeaving ? 'Leaving...' : 'Confirm leave'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

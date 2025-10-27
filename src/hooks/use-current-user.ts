'use client'

import { useQuery } from 'convex/react'

import { api } from '@/convex/_generated/api'
import { usePushAccount } from '@/hooks/use-push-account'

export function useCurrentUser() {
  const { address } = usePushAccount()
  const currentUser = useQuery(
    api.users.currentUser,
    address ? { address } : { address: undefined }
  )

  return {
    address,
    currentUser
  }
}

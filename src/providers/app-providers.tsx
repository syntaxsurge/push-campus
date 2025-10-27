'use client'

import { ReactNode, useMemo } from 'react'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import {
  PushUniversalWalletProvider,
  PushUI
} from '@pushchain/ui-kit'
import { ThemeProvider as NextThemeProvider, useTheme } from 'next-themes'

import { ConvexClientProvider } from '@/providers/convex-client-provider'

type AppProvidersProps = {
  children: ReactNode
}

/**
 * Aggregates Push Chain wallet context with Query + Convex providers so the
 * rest of the app can interact with the UI Kit, Convex backend, and theme system.
 */
export function AppProviders({ children }: AppProvidersProps) {
  const queryClient = useMemo(() => new QueryClient(), [])

  return (
    <NextThemeProvider
      attribute='class'
      defaultTheme='system'
      enableSystem
      disableTransitionOnChange
    >
      <ThemeAwarePushWalletProvider>
        <QueryClientProvider client={queryClient}>
          <ConvexClientProvider>{children}</ConvexClientProvider>
        </QueryClientProvider>
      </ThemeAwarePushWalletProvider>
    </NextThemeProvider>
  )
}

function ThemeAwarePushWalletProvider({
  children
}: {
  children: ReactNode
}) {
  const { resolvedTheme } = useTheme()

  const walletConfig = useMemo(() => {
    return {
      uid: 'primary',
      network: PushUI.CONSTANTS.PUSH_NETWORK.TESTNET_DONUT,
      login: {
        wallet: {
          enabled: true,
          chains: [
            PushUI.CONSTANTS.CHAIN.PUSH,
            PushUI.CONSTANTS.CHAIN.ETHEREUM,
            PushUI.CONSTANTS.CHAIN.SOLANA
          ]
        },
        email: true,
        google: true,
        appPreview: true
      },
      modal: {
        loginLayout: PushUI.CONSTANTS.LOGIN.LAYOUT.SPLIT,
        connectedLayout: PushUI.CONSTANTS.CONNECTED.LAYOUT.FULL,
        connectedInteraction: PushUI.CONSTANTS.CONNECTED.INTERACTION.INTERACTIVE,
        appPreview: true
      }
    } satisfies Parameters<
      typeof PushUniversalWalletProvider
    >[0]['config']
  }, [])

  const walletApp = useMemo(() => {
    return {
      title: 'PushCampus',
      description: 'Learning communities powered by Universal Wallet connectivity.',
      logoUrl: '/images/skillvesta-logo.png'
    }
  }, [])

  const themeMode =
    resolvedTheme === 'dark'
      ? PushUI.CONSTANTS.THEME.DARK
      : PushUI.CONSTANTS.THEME.LIGHT

  return (
    <PushUniversalWalletProvider
      config={walletConfig}
      app={walletApp}
      themeMode={themeMode}
      themeOverrides={{
        '--pw-core-modal-border-radius': '20px',
        light: {
          '--pw-core-bg-primary-color': '#f5f6f8'
        },
        dark: {
          '--pw-core-bg-primary-color': '#17181b'
        }
      }}
    >
      {children}
    </PushUniversalWalletProvider>
  )
}

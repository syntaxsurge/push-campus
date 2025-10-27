'use client'

import Link from 'next/link'
import { useEffect } from 'react'

import { useMutation } from 'convex/react'
import { ArrowRight, ShieldCheck, Sparkles } from 'lucide-react'

import { api } from '@/convex/_generated/api'
import { Button } from '@/components/ui/button'
import { usePushAccount } from '@/hooks/use-push-account'

const highlights = [
  { label: 'Chains Supported', value: '15+' },
  { label: 'Cross-Chain Members', value: '12K+' },
  { label: 'Universal Payments', value: '$2.1M' }
]

const features = [
  {
    title: 'Universal Access',
    description:
      'Deploy once on Push Chain. Reach learners across Ethereum, Solana, Base, and 15+ other chains—without bridges or relayers.'
  },
  {
    title: 'Any Wallet, Any Token',
    description:
      'Members join with their favorite wallet and pay with any token. No forced chain switching or gas juggling.'
  },
  {
    title: 'Shared-State Learning',
    description:
      'Courses, memberships, and credentials stay in sync across all chains with Push Chain\'s shared-state architecture.'
  }
]

const steps = [
  {
    title: 'Deploy Universally',
    detail:
      'Create your learning community once on Push Chain. Instantly accessible to users on Ethereum, Solana, Base, and every major chain.'
  },
  {
    title: 'Engage Everywhere',
    detail:
      'Members interact from their native chain. No bridging, no switching, no friction. Universal wallet support makes it seamless.'
  },
  {
    title: 'Grow Borderlessly',
    detail:
      'Scale across the entire blockchain ecosystem without deploying multiple times or managing cross-chain complexity.'
  }
]

const testimonials = [
  {
    name: 'Taylor Morgan',
    role: 'Founder, Cross-Chain Academy',
    quote:
      '"PushCampus opened our courses to learners across every chain. Members join from Ethereum, Solana, or Base—using their favorite wallet. No bridges, no friction."'
  },
  {
    name: 'Avery Chen',
    role: 'Lead Instructor, Universal Web3',
    quote:
      '"Deploy once, reach everywhere. Our students pay with any token and access courses from any chain. Push Chain\'s shared-state makes it all seamless."'
  }
]

export default function HomePage() {
  const { address } = usePushAccount()
  const storeUser = useMutation(api.users.store)

  useEffect(() => {
    if (!address) return
    storeUser({ address }).catch(() => {
      /* ignore duplicate upsert errors */
    })
  }, [address, storeUser])

  return (
    <main className='relative overflow-hidden'>
      {/* Enhanced background with logo blue gradients */}
      <div className='pointer-events-none absolute inset-0' aria-hidden='true'>
        <div className='absolute inset-x-0 top-[-12rem] h-[40rem] bg-[radial-gradient(circle_at_top,_hsl(var(--brand-blue)/0.15),_transparent_50%)] sm:top-[-18rem]' />
        <div className='absolute right-0 top-[20rem] h-[30rem] w-[30rem] rounded-full bg-[radial-gradient(circle,_hsl(var(--brand-blue-light)/0.12),_transparent_65%)] blur-3xl' />
        <div className='absolute left-0 top-[50rem] h-[35rem] w-[35rem] rounded-full bg-[radial-gradient(circle,_hsl(var(--brand-blue)/0.1),_transparent_70%)] blur-3xl' />
      </div>

      <div className='relative mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-6xl flex-col gap-24 px-6 pb-24 pt-20 sm:pt-28'>
        <section className='grid gap-10 lg:grid-cols-[1.15fr_1fr] lg:items-center'>
          <div className='space-y-8'>
            <span className='inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-xs font-medium uppercase tracking-wide text-primary shadow-sm backdrop-blur-md'>
              <Sparkles className='h-3.5 w-3.5 text-primary' aria-hidden='true' />
              Universal Learning Across Every Chain
            </span>
            <div className='space-y-6'>
              <h1 className='text-balance text-4xl font-semibold leading-tight text-foreground sm:text-5xl lg:text-6xl'>
                <span className='bg-gradient-to-r from-foreground via-brand-blue-dark to-brand-blue bg-clip-text text-transparent'>
                  Deploy Once.
                </span>{' '}
                <span className='bg-gradient-to-r from-brand-blue to-brand-blue-light bg-clip-text text-transparent'>
                  Reach Everywhere.
                </span>
              </h1>
              <p className='max-w-xl text-lg leading-relaxed text-muted-foreground'>
                The first universal learning platform built on Push Chain. Create communities and courses that reach learners across{' '}
                <span className='font-semibold text-foreground'>Ethereum, Solana, Base, and 15+ chains</span>—with{' '}
                <span className='font-semibold text-primary'>any wallet</span>,{' '}
                <span className='font-semibold text-accent'>any token</span>, and{' '}
                <span className='font-semibold text-primary'>no network switching</span>.
              </p>
            </div>
            <div className='flex flex-col items-start gap-3 sm:flex-row sm:items-center'>
              <Button size='lg' className='bg-gradient-to-r from-brand-blue to-brand-blue-light hover:opacity-90' asChild>
                <Link href='/create'>
                  Create Universal App
                  <ArrowRight className='ml-2 h-4 w-4' aria-hidden='true' />
                </Link>
              </Button>
              <Button size='lg' variant='ghost' className='border-primary/30 hover:border-primary/50 hover:bg-primary/5' asChild>
                <Link href='/groups'>Explore Communities</Link>
              </Button>
            </div>
            <dl className='grid gap-6 sm:grid-cols-3'>
              {highlights.map(item => (
                <div key={item.label}>
                  <dt className='text-xs uppercase tracking-wide text-muted-foreground'>{item.label}</dt>
                  <dd className='mt-1 text-2xl font-semibold text-foreground'>{item.value}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div className='relative'>
            <div className='absolute inset-0 rounded-3xl bg-gradient-to-br from-brand-blue/20 via-brand-blue-light/15 to-transparent blur-3xl' />
            <div className='relative rounded-3xl border border-primary/20 bg-card/80 p-6 shadow-2xl shadow-primary/5 backdrop-blur-xl'>
              <div className='flex items-center justify-between'>
                <div>
                  <p className='text-xs uppercase tracking-wide text-muted-foreground'>Cross-Chain Revenue</p>
                  <p className='text-3xl font-semibold bg-gradient-to-r from-brand-blue to-brand-blue-light bg-clip-text text-transparent'>$142,860</p>
                </div>
                <span className='inline-flex items-center rounded-full bg-primary/10 border border-primary/20 px-3 py-1 text-xs font-medium text-primary backdrop-blur-sm'>
                  +34% vs last month
                </span>
              </div>
              <div className='mt-8 space-y-5'>
                {[
                  { title: 'Universal members', value: '3,204', trend: 'From 15+ chains', icon: '🌐' },
                  { title: 'Cross-chain payments', value: '1,847', trend: 'Any wallet, any token', icon: '💰' },
                  { title: 'Courses delivered', value: '892', trend: 'Zero friction', icon: '🎓' }
                ].map(metric => (
                  <div key={metric.title} className='group flex items-center justify-between rounded-xl border border-border/40 bg-background/60 px-4 py-3 shadow-sm backdrop-blur-sm transition-all hover:border-primary/30 hover:bg-primary/5'>
                    <div className='flex items-center gap-3'>
                      <span className='text-xl'>{metric.icon}</span>
                      <div>
                        <p className='text-sm font-medium text-foreground'>{metric.title}</p>
                        <p className='text-xs text-muted-foreground'>{metric.trend}</p>
                      </div>
                    </div>
                    <p className='text-lg font-semibold text-foreground'>{metric.value}</p>
                  </div>
                ))}
              </div>
              <div className='mt-8 flex items-center gap-3 rounded-2xl border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-foreground/90 backdrop-blur-sm'>
                <ShieldCheck className='h-5 w-5 text-primary' aria-hidden='true' />
                <span>Powered by Push Chain's shared-state L1. No bridges. No relayers. Just universal access.</span>
              </div>
            </div>
          </div>
        </section>

        <section className='space-y-12'>
          <div className='space-y-4 text-center'>
            <p className='text-xs font-medium uppercase tracking-wide bg-gradient-to-r from-brand-blue-dark to-brand-blue-light bg-clip-text text-transparent'>
              Why Build on Push Chain
            </p>
            <h2 className='text-3xl font-semibold text-foreground sm:text-4xl'>
              Universal Apps That Reach Every Chain
            </h2>
            <p className='mx-auto max-w-2xl text-base text-muted-foreground'>
              Deploy once on Push Chain and instantly reach users across Ethereum, Solana, Base, and 15+ chains. No bridges. No relayers. No friction.
            </p>
          </div>
          <div className='grid gap-6 md:grid-cols-3'>
            {features.map((feature, index) => (
              <div
                key={feature.title}
                className='group h-full rounded-3xl border border-border/40 bg-gradient-to-br from-background/90 via-background/70 to-background/90 p-8 text-left shadow-lg backdrop-blur-sm transition-all hover:border-primary/40 hover:shadow-xl hover:shadow-primary/10'
              >
                <div className='mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/15 to-accent/15 border border-primary/20 transition-all group-hover:scale-110 group-hover:border-primary/30'>
                  <span className='text-2xl'>
                    {index === 0 ? '🌐' : index === 1 ? '💎' : '🔗'}
                  </span>
                </div>
                <h3 className='text-xl font-semibold text-foreground group-hover:text-primary transition-colors'>{feature.title}</h3>
                <p className='mt-3 text-sm leading-relaxed text-muted-foreground'>{feature.description}</p>
              </div>
            ))}
          </div>
        </section>

        <section className='grid gap-10 rounded-3xl border border-primary/20 bg-card/80 p-10 shadow-xl shadow-primary/5 backdrop-blur-xl lg:grid-cols-[1fr_1.1fr]'>
          <div className='space-y-4'>
            <h2 className='text-3xl font-semibold text-foreground'>How it works</h2>
            <p className='text-base text-muted-foreground'>
              Built on Push Chain's shared-state L1, PushCampus eliminates blockchain fragmentation so you can reach learners everywhere—without compromise.
            </p>
            <div className='mt-8 space-y-6'>
              {steps.map((step, index) => (
                <div key={step.title} className='flex items-start gap-4'>
                  <span className='flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary/15 to-accent/15 border border-primary/30 text-sm font-semibold text-primary backdrop-blur-sm'>
                    {index + 1}
                  </span>
                  <div>
                    <h3 className='text-lg font-medium text-foreground'>{step.title}</h3>
                    <p className='mt-1 text-sm leading-relaxed text-muted-foreground'>{step.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className='grid gap-6 lg:grid-cols-2'>
            {testimonials.map((testimonial, index) => (
              <figure
                key={testimonial.name}
                className='group flex h-full flex-col justify-between rounded-3xl border border-border/40 bg-background/70 p-6 shadow-md backdrop-blur-sm transition-all hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5'
              >
                <blockquote className='text-sm leading-relaxed text-muted-foreground'>{testimonial.quote}</blockquote>
                <figcaption className='mt-6 flex items-center gap-3'>
                  <div className='flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-primary/15 to-accent/15 border border-primary/20 text-sm font-semibold text-primary'>
                    {testimonial.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <p className='text-sm font-semibold text-foreground'>{testimonial.name}</p>
                    <p className='text-xs text-muted-foreground'>{testimonial.role}</p>
                  </div>
                </figcaption>
              </figure>
            ))}
          </div>
        </section>

        <section className='relative overflow-hidden rounded-3xl border border-primary/20 bg-gradient-to-br from-card/90 via-card/80 to-card/70 p-10 shadow-xl shadow-primary/5 backdrop-blur-xl'>
          <div className='pointer-events-none absolute -right-12 -top-12 h-64 w-64 rounded-full bg-gradient-to-br from-brand-blue/20 to-brand-blue-light/15 blur-3xl' />
          <div className='pointer-events-none absolute -bottom-12 -left-12 h-64 w-64 rounded-full bg-gradient-to-br from-brand-blue-light/15 to-brand-blue/10 blur-3xl' />

          <div className='relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
            <div className='space-y-2'>
              <h2 className='text-3xl font-semibold text-foreground sm:text-4xl'>
                Ready to go universal?
              </h2>
              <p className='max-w-xl text-sm text-muted-foreground'>
                Join the future of Web3 education. Deploy once on Push Chain and reach learners across every blockchain—with any wallet, any token, and zero friction.
              </p>
            </div>
            <div className='flex flex-col gap-3 sm:flex-row'>
              <Button className='bg-gradient-to-r from-brand-blue to-brand-blue-light hover:opacity-90 shadow-lg shadow-primary/20' asChild>
                <Link href='/create'>
                  Create Universal App
                  <Sparkles className='ml-2 h-4 w-4' aria-hidden='true' />
                </Link>
              </Button>
              <Button className='border-primary/30 hover:border-primary/50 hover:bg-primary/5' asChild variant='outline'>
                <Link href='/groups'>
                  Explore Communities
                  <ArrowRight className='ml-2 h-4 w-4' aria-hidden='true' />
                </Link>
              </Button>
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}

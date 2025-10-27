'use client'

import Link from 'next/link'
import { useEffect } from 'react'

import { useMutation } from 'convex/react'
import {
  ArrowRight,
  Sparkles,
  Zap,
  Globe,
  Shield,
  Rocket,
  Users,
  GraduationCap,
  TrendingUp,
  CheckCircle2,
  Star
} from 'lucide-react'

import { api } from '@/convex/_generated/api'
import { Button } from '@/components/ui/button'
import { usePushAccount } from '@/hooks/use-push-account'

const stats = [
  {
    icon: Globe,
    label: 'Blockchains Supported',
    value: '15+',
    description: 'One deployment reaches all chains'
  },
  {
    icon: Users,
    label: 'Active Learners',
    value: '12K+',
    description: 'Learning across the ecosystem'
  },
  {
    icon: TrendingUp,
    label: 'Revenue Processed',
    value: '$2.1M',
    description: 'Universal payments accepted'
  }
]

const features = [
  {
    icon: Rocket,
    title: 'Deploy Once, Reach Everywhere',
    description: 'Build your learning platform on Push Chain and instantly make it accessible across Ethereum, Solana, Base, and 15+ other chains.',
    highlight: 'Zero redeployment'
  },
  {
    icon: Zap,
    title: 'Universal Wallet Support',
    description: 'Students use their favorite wallet—MetaMask, Phantom, Coinbase—and pay with any token. No forced switching or complex onboarding.',
    highlight: 'Any wallet, any token'
  },
  {
    icon: Shield,
    title: 'Shared-State Architecture',
    description: 'Course progress, credentials, and memberships stay perfectly synchronized across all chains with Push Chain\'s innovative shared-state L1.',
    highlight: 'Always in sync'
  },
  {
    icon: GraduationCap,
    title: 'Built for Education',
    description: 'Comprehensive classroom tools, progress tracking, NFT credentials, and membership management—everything you need in one platform.',
    highlight: 'Complete toolkit'
  }
]

const benefits = [
  'No bridges or relayers required',
  'Zero network switching for users',
  'Instant cross-chain settlements',
  'Universal credential verification',
  'Automated membership renewals',
  'Multi-chain payment acceptance'
]

const testimonials = [
  {
    name: 'Taylor Morgan',
    role: 'Founder, Cross-Chain Academy',
    avatar: 'TM',
    quote: 'PushCampus opened our courses to learners across every chain. Members join from Ethereum, Solana, or Base using their favorite wallet. The experience is seamless.',
    stats: { students: '2.4K', courses: 12 }
  },
  {
    name: 'Avery Chen',
    role: 'Lead Instructor, Universal Web3',
    avatar: 'AC',
    quote: 'Deploy once, reach everywhere—it\'s that simple. Our students pay with any token and access courses from any chain. Push Chain makes cross-chain education effortless.',
    stats: { students: '3.8K', courses: 24 }
  },
  {
    name: 'Jordan Lee',
    role: 'Head of Education, DeFi Institute',
    avatar: 'JL',
    quote: 'The shared-state architecture is a game changer. Our course progress and credentials sync perfectly across all chains without any extra work from our team.',
    stats: { students: '5.2K', courses: 18 }
  }
]

const howItWorks = [
  {
    step: '01',
    title: 'Create Your Community',
    description: 'Set up your learning community in minutes. Add courses, set pricing, customize branding—all through an intuitive dashboard.',
    details: ['One-time setup', 'No code required', 'Instant deployment']
  },
  {
    step: '02',
    title: 'Students Join from Any Chain',
    description: 'Learners discover and join your courses from their preferred blockchain. They use their existing wallet and pay with tokens they already have.',
    details: ['Universal access', 'No onboarding friction', 'Multiple payment options']
  },
  {
    step: '03',
    title: 'Deliver & Grow',
    description: 'Teach, engage, and scale. Course progress syncs automatically across chains while you focus on creating great content.',
    details: ['Auto-sync progress', 'NFT credentials', 'Built-in analytics']
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
    <main className='relative overflow-hidden bg-gradient-to-b from-background via-background to-secondary/20'>
      {/* Animated background elements */}
      <div className='pointer-events-none absolute inset-0' aria-hidden='true'>
        <div className='absolute inset-x-0 top-0 h-[600px] bg-[radial-gradient(circle_at_top_right,_hsl(var(--brand-blue)/0.15),_transparent_50%)]' />
        <div className='absolute right-0 top-[800px] h-[400px] w-[400px] rounded-full bg-[radial-gradient(circle,_hsl(var(--brand-blue-light)/0.1),_transparent_70%)] blur-3xl' />
        <div className='absolute left-0 top-[1400px] h-[500px] w-[500px] rounded-full bg-[radial-gradient(circle,_hsl(var(--brand-blue)/0.08),_transparent_70%)] blur-3xl' />
      </div>

      {/* Hero Section - Completely New Design */}
      <section className='relative'>
        <div className='mx-auto max-w-7xl px-6 pb-24 pt-20 sm:pb-32 sm:pt-28 lg:px-8'>
          <div className='grid gap-12 lg:grid-cols-2 lg:gap-16'>
            {/* Left Column */}
            <div className='flex flex-col justify-center space-y-8'>
              <div className='inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-2 text-sm font-medium text-primary backdrop-blur-sm w-fit'>
                <Sparkles className='h-4 w-4' />
                <span>The Universal Learning Platform</span>
              </div>

              <div className='space-y-6'>
                <h1 className='text-5xl font-bold leading-[1.1] tracking-tight sm:text-6xl lg:text-7xl'>
                  <span className='text-foreground'>Teach Across</span>
                  <br />
                  <span className='bg-gradient-to-r from-brand-blue via-brand-blue-light to-accent bg-clip-text text-transparent'>
                    Every Blockchain
                  </span>
                </h1>

                <p className='text-xl leading-relaxed text-muted-foreground lg:text-2xl'>
                  Deploy your learning community once on Push Chain. Reach students on{' '}
                  <span className='font-semibold text-foreground'>Ethereum, Solana, Base, and 15+ chains</span>—with any wallet, any token, zero friction.
                </p>
              </div>

              <div className='flex flex-col gap-4 sm:flex-row sm:items-center'>
                <Button size='lg' className='bg-gradient-to-r from-brand-blue to-brand-blue-light text-base hover:opacity-90 shadow-lg shadow-primary/20' asChild>
                  <Link href='/create'>
                    Start Building Now
                    <Rocket className='ml-2 h-5 w-5' />
                  </Link>
                </Button>
                <Button size='lg' variant='outline' className='border-primary/30 text-base hover:bg-primary/5' asChild>
                  <Link href='/groups'>
                    Explore Communities
                    <ArrowRight className='ml-2 h-5 w-5' />
                  </Link>
                </Button>
              </div>

              {/* Quick Benefits */}
              <div className='flex flex-wrap gap-4 pt-4'>
                {['No Bridges', 'Any Wallet', 'Universal Access'].map((benefit) => (
                  <div key={benefit} className='flex items-center gap-2 rounded-full bg-primary/5 px-4 py-2 text-sm font-medium text-foreground border border-primary/10'>
                    <CheckCircle2 className='h-4 w-4 text-primary' />
                    <span>{benefit}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Column - Visual Element */}
            <div className='relative'>
              <div className='absolute inset-0 rounded-3xl bg-gradient-to-br from-primary/10 via-accent/10 to-transparent blur-3xl' />
              <div className='relative space-y-6'>
                {/* Floating Stats Cards */}
                <div className='grid gap-4'>
                  <div className='group rounded-2xl border border-primary/20 bg-card/90 p-6 backdrop-blur-xl transition-all hover:scale-105 hover:border-primary/40 hover:shadow-xl hover:shadow-primary/10'>
                    <div className='flex items-center justify-between'>
                      <div>
                        <p className='text-sm font-medium text-muted-foreground'>Total Revenue</p>
                        <p className='mt-1 text-3xl font-bold bg-gradient-to-r from-brand-blue to-brand-blue-light bg-clip-text text-transparent'>
                          $2.1M
                        </p>
                      </div>
                      <div className='rounded-xl bg-primary/10 p-3'>
                        <TrendingUp className='h-6 w-6 text-primary' />
                      </div>
                    </div>
                    <p className='mt-3 text-xs text-muted-foreground'>+34% from last month</p>
                  </div>

                  <div className='grid grid-cols-2 gap-4'>
                    <div className='group rounded-2xl border border-primary/20 bg-card/90 p-4 backdrop-blur-xl transition-all hover:scale-105 hover:border-primary/40'>
                      <Globe className='h-5 w-5 text-primary mb-2' />
                      <p className='text-2xl font-bold text-foreground'>15+</p>
                      <p className='text-xs text-muted-foreground'>Chains</p>
                    </div>
                    <div className='group rounded-2xl border border-primary/20 bg-card/90 p-4 backdrop-blur-xl transition-all hover:scale-105 hover:border-primary/40'>
                      <Users className='h-5 w-5 text-primary mb-2' />
                      <p className='text-2xl font-bold text-foreground'>12K+</p>
                      <p className='text-xs text-muted-foreground'>Learners</p>
                    </div>
                  </div>

                  <div className='rounded-2xl border border-primary/20 bg-card/90 p-4 backdrop-blur-xl'>
                    <div className='flex items-center gap-2 mb-3'>
                      <Star className='h-4 w-4 text-primary fill-primary' />
                      <span className='text-sm font-medium text-foreground'>Top Educator</span>
                    </div>
                    <div className='flex items-center gap-3'>
                      <div className='flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-accent/20 border border-primary/30 text-sm font-bold text-primary'>
                        AC
                      </div>
                      <div className='flex-1'>
                        <p className='text-sm font-medium text-foreground'>Avery Chen</p>
                        <p className='text-xs text-muted-foreground'>3.8K students • 24 courses</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section - Prominent */}
      <section className='relative py-16'>
        <div className='mx-auto max-w-7xl px-6 lg:px-8'>
          <div className='grid gap-8 md:grid-cols-3'>
            {stats.map((stat, index) => {
              const Icon = stat.icon
              return (
                <div
                  key={index}
                  className='group relative overflow-hidden rounded-3xl border border-primary/20 bg-gradient-to-br from-card/95 via-card/90 to-card/85 p-8 backdrop-blur-xl transition-all hover:scale-105 hover:border-primary/40 hover:shadow-2xl hover:shadow-primary/10'
                >
                  <div className='pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-gradient-to-br from-primary/10 to-transparent blur-2xl transition-all group-hover:scale-150' />
                  <div className='relative'>
                    <div className='mb-4 inline-flex rounded-2xl bg-primary/10 p-3 ring-1 ring-primary/20'>
                      <Icon className='h-6 w-6 text-primary' />
                    </div>
                    <p className='text-5xl font-bold bg-gradient-to-r from-brand-blue to-brand-blue-light bg-clip-text text-transparent'>
                      {stat.value}
                    </p>
                    <p className='mt-2 text-lg font-semibold text-foreground'>{stat.label}</p>
                    <p className='mt-1 text-sm text-muted-foreground'>{stat.description}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Features Section - Enhanced Design */}
      <section className='relative py-24'>
        <div className='mx-auto max-w-7xl px-6 lg:px-8'>
          <div className='mx-auto max-w-2xl text-center mb-16'>
            <div className='inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-2 text-sm font-medium text-primary backdrop-blur-sm mb-6'>
              <Zap className='h-4 w-4' />
              <span>Built for the Future</span>
            </div>
            <h2 className='text-4xl font-bold tracking-tight text-foreground sm:text-5xl'>
              Everything You Need to Teach{' '}
              <span className='bg-gradient-to-r from-brand-blue to-brand-blue-light bg-clip-text text-transparent'>
                Universally
              </span>
            </h2>
            <p className='mt-6 text-lg leading-relaxed text-muted-foreground'>
              PushCampus eliminates the complexity of multi-chain deployment. Build once, reach everywhere.
            </p>
          </div>

          <div className='grid gap-8 md:grid-cols-2'>
            {features.map((feature, index) => {
              const Icon = feature.icon
              return (
                <div
                  key={index}
                  className='group relative overflow-hidden rounded-3xl border border-border/50 bg-gradient-to-br from-card/95 via-card/90 to-card/85 p-8 backdrop-blur-sm transition-all hover:border-primary/40 hover:shadow-xl hover:shadow-primary/5'
                >
                  <div className='pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-gradient-to-br from-primary/5 to-transparent blur-3xl transition-all group-hover:scale-150' />
                  <div className='relative'>
                    <div className='mb-5 inline-flex rounded-2xl bg-gradient-to-br from-primary/15 to-accent/10 p-4 ring-1 ring-primary/20 transition-all group-hover:scale-110'>
                      <Icon className='h-8 w-8 text-primary' />
                    </div>
                    <h3 className='text-2xl font-bold text-foreground mb-3 group-hover:text-primary transition-colors'>
                      {feature.title}
                    </h3>
                    <p className='text-base leading-relaxed text-muted-foreground mb-4'>
                      {feature.description}
                    </p>
                    <div className='inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary border border-primary/20'>
                      <Sparkles className='h-3 w-3' />
                      <span>{feature.highlight}</span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* How It Works - Timeline Design */}
      <section className='relative py-24 bg-secondary/30'>
        <div className='mx-auto max-w-7xl px-6 lg:px-8'>
          <div className='mx-auto max-w-2xl text-center mb-16'>
            <h2 className='text-4xl font-bold tracking-tight text-foreground sm:text-5xl mb-6'>
              Get Started in{' '}
              <span className='bg-gradient-to-r from-brand-blue to-brand-blue-light bg-clip-text text-transparent'>
                Three Steps
              </span>
            </h2>
            <p className='text-lg leading-relaxed text-muted-foreground'>
              From idea to cross-chain learning platform in minutes
            </p>
          </div>

          <div className='relative mx-auto max-w-5xl'>
            {/* Timeline Line */}
            <div className='absolute left-8 top-12 bottom-12 w-0.5 bg-gradient-to-b from-primary via-primary/50 to-primary/20 hidden md:block' />

            <div className='space-y-12'>
              {howItWorks.map((item, index) => (
                <div key={index} className='relative flex gap-8 items-start group'>
                  {/* Step Number */}
                  <div className='relative flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-accent text-2xl font-bold text-white shadow-lg shadow-primary/20 ring-4 ring-background transition-all group-hover:scale-110'>
                    {item.step}
                  </div>

                  {/* Content Card */}
                  <div className='flex-1 rounded-3xl border border-primary/20 bg-card/90 p-8 backdrop-blur-xl transition-all group-hover:border-primary/40 group-hover:shadow-xl group-hover:shadow-primary/10'>
                    <h3 className='text-2xl font-bold text-foreground mb-3'>{item.title}</h3>
                    <p className='text-base leading-relaxed text-muted-foreground mb-4'>
                      {item.description}
                    </p>
                    <div className='flex flex-wrap gap-2'>
                      {item.details.map((detail, i) => (
                        <div key={i} className='flex items-center gap-2 rounded-full bg-primary/5 px-3 py-1 text-xs font-medium text-foreground border border-primary/10'>
                          <CheckCircle2 className='h-3 w-3 text-primary' />
                          <span>{detail}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials - Card Grid */}
      <section className='relative py-24'>
        <div className='mx-auto max-w-7xl px-6 lg:px-8'>
          <div className='mx-auto max-w-2xl text-center mb-16'>
            <h2 className='text-4xl font-bold tracking-tight text-foreground sm:text-5xl mb-6'>
              Loved by Educators{' '}
              <span className='bg-gradient-to-r from-brand-blue to-brand-blue-light bg-clip-text text-transparent'>
                Worldwide
              </span>
            </h2>
            <p className='text-lg leading-relaxed text-muted-foreground'>
              Thousands of educators are building thriving cross-chain learning communities
            </p>
          </div>

          <div className='grid gap-8 md:grid-cols-3'>
            {testimonials.map((testimonial, index) => (
              <div
                key={index}
                className='group relative overflow-hidden rounded-3xl border border-primary/20 bg-gradient-to-br from-card/95 via-card/90 to-card/85 p-8 backdrop-blur-xl transition-all hover:border-primary/40 hover:shadow-xl hover:shadow-primary/10'
              >
                <div className='pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-gradient-to-br from-primary/5 to-transparent blur-2xl' />
                <div className='relative'>
                  {/* Rating */}
                  <div className='flex gap-1 mb-4'>
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className='h-4 w-4 text-primary fill-primary' />
                    ))}
                  </div>

                  {/* Quote */}
                  <blockquote className='text-base leading-relaxed text-muted-foreground mb-6'>
                    {testimonial.quote}
                  </blockquote>

                  {/* Author */}
                  <div className='flex items-center gap-3 mb-4'>
                    <div className='flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-accent/20 border border-primary/30 text-base font-bold text-primary'>
                      {testimonial.avatar}
                    </div>
                    <div>
                      <p className='font-semibold text-foreground'>{testimonial.name}</p>
                      <p className='text-sm text-muted-foreground'>{testimonial.role}</p>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className='flex gap-4 pt-4 border-t border-border/50'>
                    <div>
                      <p className='text-lg font-bold text-primary'>{testimonial.stats.students}</p>
                      <p className='text-xs text-muted-foreground'>Students</p>
                    </div>
                    <div>
                      <p className='text-lg font-bold text-primary'>{testimonial.stats.courses}</p>
                      <p className='text-xs text-muted-foreground'>Courses</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA - Bold */}
      <section className='relative py-24'>
        <div className='mx-auto max-w-7xl px-6 lg:px-8'>
          <div className='relative overflow-hidden rounded-3xl border border-primary/30 bg-gradient-to-br from-primary/10 via-accent/5 to-transparent p-12 md:p-16 backdrop-blur-xl'>
            <div className='pointer-events-none absolute -right-20 -top-20 h-80 w-80 rounded-full bg-gradient-to-br from-primary/20 to-transparent blur-3xl' />
            <div className='pointer-events-none absolute -bottom-20 -left-20 h-80 w-80 rounded-full bg-gradient-to-br from-accent/15 to-transparent blur-3xl' />

            <div className='relative mx-auto max-w-3xl text-center'>
              <h2 className='text-4xl font-bold tracking-tight text-foreground sm:text-5xl md:text-6xl mb-6'>
                Ready to Go{' '}
                <span className='bg-gradient-to-r from-brand-blue to-brand-blue-light bg-clip-text text-transparent'>
                  Universal?
                </span>
              </h2>
              <p className='text-xl leading-relaxed text-muted-foreground mb-8'>
                Join thousands of educators building the future of cross-chain learning. Deploy once, reach everywhere.
              </p>

              <div className='flex flex-col gap-4 sm:flex-row sm:justify-center mb-8'>
                <Button size='lg' className='bg-gradient-to-r from-brand-blue to-brand-blue-light text-lg px-8 hover:opacity-90 shadow-xl shadow-primary/30' asChild>
                  <Link href='/create'>
                    Create Your Community
                    <Rocket className='ml-2 h-5 w-5' />
                  </Link>
                </Button>
                <Button size='lg' variant='outline' className='border-primary/30 text-lg px-8 hover:bg-primary/5' asChild>
                  <Link href='/groups'>
                    Explore Communities
                    <ArrowRight className='ml-2 h-5 w-5' />
                  </Link>
                </Button>
              </div>

              {/* Trust Indicators */}
              <div className='flex flex-wrap justify-center gap-6 text-sm text-muted-foreground'>
                <div className='flex items-center gap-2'>
                  <CheckCircle2 className='h-4 w-4 text-primary' />
                  <span>No credit card required</span>
                </div>
                <div className='flex items-center gap-2'>
                  <CheckCircle2 className='h-4 w-4 text-primary' />
                  <span>Setup in 5 minutes</span>
                </div>
                <div className='flex items-center gap-2'>
                  <CheckCircle2 className='h-4 w-4 text-primary' />
                  <span>Support for 15+ chains</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}

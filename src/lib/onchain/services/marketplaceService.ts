import type { Address } from 'viem'

import { membershipMarketplaceAbi } from '@/lib/onchain/abi'

import { OnchainService, ServiceConfig } from './base'

export type MarketplaceListing = {
  seller: Address
  priceWei: bigint
  listedAt: bigint
  expiresAt: bigint
  active: boolean
}

type ListingTuple = [Address, bigint, bigint, bigint, boolean]

export class MarketplaceService extends OnchainService {
  readonly address: Address

  constructor(config: ServiceConfig & { address: Address }) {
    super(config)
    this.address = config.address
  }

  async purchasePrimary(courseId: bigint, maxPrice: bigint) {
    return this.executeContractTx({
      abi: membershipMarketplaceAbi,
      address: this.address,
      functionName: 'purchasePrimary',
      args: [courseId, maxPrice],
      value: maxPrice
    })
  }

  async createListing(
    courseId: bigint,
    priceWei: bigint,
    durationSeconds: bigint
  ) {
    return this.executeContractTx({
      abi: membershipMarketplaceAbi,
      address: this.address,
      functionName: 'createListing',
      args: [courseId, priceWei, durationSeconds]
    })
  }

  async cancelListing(courseId: bigint) {
    return this.executeContractTx({
      abi: membershipMarketplaceAbi,
      address: this.address,
      functionName: 'cancelListing',
      args: [courseId]
    })
  }

  async buyListing(
    courseId: bigint,
    seller: Address,
    maxPrice: bigint
  ) {
    return this.executeContractTx({
      abi: membershipMarketplaceAbi,
      address: this.address,
      functionName: 'buyListing',
      args: [courseId, seller, maxPrice],
      value: maxPrice
    })
  }

  async renew(courseId: bigint, maxPrice: bigint) {
    return this.executeContractTx({
      abi: membershipMarketplaceAbi,
      address: this.address,
      functionName: 'renew',
      args: [courseId, maxPrice],
      value: maxPrice
    })
  }

  async getListing(courseId: bigint, seller: Address) {
    const listing = (await this.publicClient.readContract({
      abi: membershipMarketplaceAbi,
      address: this.address,
      functionName: 'getListing',
      args: [courseId, seller]
    })) as unknown as ListingTuple

    return this.mapListing(listing)
  }

  async getActiveListings(courseId: bigint) {
    const listings = (await this.publicClient.readContract({
      abi: membershipMarketplaceAbi,
      address: this.address,
      functionName: 'getActiveListings',
      args: [courseId]
    })) as unknown as ListingTuple[]

    return listings.map(listing => this.mapListing(listing))
  }

  async platformFeeBps() {
    return this.publicClient.readContract({
      abi: membershipMarketplaceAbi,
      address: this.address,
      functionName: 'platformFeeBps'
    }) as Promise<bigint>
  }

  async treasury() {
    return this.publicClient.readContract({
      abi: membershipMarketplaceAbi,
      address: this.address,
      functionName: 'treasury'
    }) as Promise<Address>
  }

  async maxListingDuration() {
    return this.publicClient.readContract({
      abi: membershipMarketplaceAbi,
      address: this.address,
      functionName: 'maxListingDuration'
    }) as Promise<bigint>
  }

  private mapListing([seller, priceWei, listedAt, expiresAt, active]: ListingTuple) {
    return {
      seller,
      priceWei,
      listedAt,
      expiresAt,
      active
    } as MarketplaceListing
  }
}

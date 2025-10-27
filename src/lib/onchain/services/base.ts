import type { Abi, Address, PublicClient } from 'viem'

import { PushChain as PushChainSdk } from '@pushchain/core'

type PushChainLike = {
  universal: {
    sendTransaction: (params: any) => Promise<{ hash: string; wait: () => Promise<unknown> }>
  }
}

export type ServiceConfig = {
  publicClient: PublicClient
  pushChain?: PushChainLike | null
}

export abstract class OnchainService {
  protected readonly publicClient: PublicClient
  protected readonly pushChain?: PushChainLike | null

  protected constructor(config: ServiceConfig) {
    this.publicClient = config.publicClient
    this.pushChain = config.pushChain ?? null
  }

  protected requirePushChain(): PushChainLike {
    if (!this.pushChain) {
      throw new Error(
        'Push Chain client required for this operation. Ensure the wallet is connected.'
      )
    }
    return this.pushChain
  }

  protected encodeTxData(args: {
    abi: Abi
    functionName: string
    functionArgs?: unknown[]
  }): `0x${string}` {
    const { abi, functionName, functionArgs = [] } = args
    return PushChainSdk.utils.helpers.encodeTxData({
      abi: abi as unknown as any[],
      functionName,
      args: functionArgs
    }) as `0x${string}`
  }

  protected async executeContractTx(params: {
    abi: Abi
    address: Address
    functionName: string
    args?: unknown[]
    value?: bigint
  }) {
    const client = this.requirePushChain()
    const data = this.encodeTxData({
      abi: params.abi,
      functionName: params.functionName,
      functionArgs: params.args
    })

    return client.universal.sendTransaction({
      to: params.address,
      data,
      value: params.value ?? 0n
    })
  }
}

# PushCampus Blockchain Workspace

This folder is a stand-alone Hardhat project that contains the smart contracts powering PushCampus’s on-chain course marketplace on Push Chain.

## Contract Suite

| Contract                      | Purpose                                                                                                              |
| ----------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| `MembershipPass1155.sol`      | Native-token-gated ERC-1155 passes (tokenId per course). Handles expirations, cooldowns, and marketplace-only transfers.    |
| `helpers/SplitPayout.sol`     | Pull-based native-token splitter deployed per course. Registrar mints fresh instances and collaborators withdraw on demand. |
| `Badge1155.sol`               | Soulbound completion badges (non-transferable ERC-1155).                                                             |
| `Registrar.sol`               | Deploys a `SplitPayout` and registers a course in one call.                                                          |
| `MembershipMarketplace.sol`   | Primary + secondary marketplace enforcing platform fees, cooldowns, and renewals.                                   |
| `RevenueSplitRouter.sol`      | Basis-point splitter used during join purchases to fan out native PC to owners and administrators immediately.           |

## Getting Started

1. Install dependencies and scaffold an env file

   ```bash
   cd blockchain
   pnpm install
   cp .env.example .env
   ```

2. Populate `.env` using the reference below. The deployment scripts will refuse
   to run when a required value is missing, so fill in the basics before
   invoking Hardhat.

### Environment Variables

| Key                                        | Purpose                                                                                             | When to provide it                         |
| ------------------------------------------ | --------------------------------------------------------------------------------------------------- | ------------------------------------------ |
| `PRIVATE_KEY`                              | Deployer/admin wallet used for all scripts.                                                         | **Before** first deployment                |
| `PUSH_DONUT_RPC_URL`                       | RPC endpoint for Push Chain Donut.                                                                  | **Before** first deployment                |
| `PUSHSCAN_API_KEY`                         | Optional – enables `hardhat verify` once Push Scan exposes verification APIs.                       | Optional                                   |
| `MEMBERSHIP_METADATA_URI`                  | Base URI for membership token metadata.                                                             | Before deployment (or leave blank to skip) |
| `BADGE_METADATA_URI`                       | Base URI for badge metadata.                                                                        | Before deployment (or leave blank to skip) |
| `MARKETPLACE_TREASURY_ADDRESS`             | Wallet that should receive marketplace fees.                                                        | **Before** marketplace deployment          |
| `MARKETPLACE_FEE_BPS`                      | Platform fee in basis points (defaults to `250` → 2.5%).                                            | Optional                                   |
| `MARKETPLACE_MAX_LISTING_DURATION_SECONDS` | Max duration for secondary listings (defaults to 7 days).                                           | Optional                                   |
| `MEMBERSHIP_CONTRACT_ADDRESS`              | Address of the deployed `MembershipPass1155`. Needed before registrar/marketplace scripts.          | After first pass deployment                |
| `REGISTRAR_CONTRACT_ADDRESS`               | Address of the deployed `Registrar`. Required when updating marketplace hooks.                      | After registrar deployment                 |

Deployment scripts persist deployed addresses to `deployment.log` using the same non-public keys that the Hardhat scripts understand. Keep `blockchain/.env` in sync with those required values so reruns can attach instead of redeploying. When you need the frontend to consume an address, copy it into the app-level `.env.local` as a `NEXT_PUBLIC_*` key.

Helper contracts that are instantiated per course live under `contracts/helpers/` (for example, `helpers/SplitPayout.sol`), highlighting that they are deployed by `Registrar` on demand. Environment-wide utilities such as `RevenueSplitRouter.sol` remain at the top level because you deploy them once and wire the resulting address into the frontend via `NEXT_PUBLIC_REVENUE_SPLIT_ROUTER_ADDRESS`.

## Typical Commands

```bash
npx hardhat compile
npx hardhat run scripts/deployMembershipPass.ts --network pushDonut
npx hardhat run scripts/deployRegistrar.ts --network pushDonut
npx hardhat run scripts/deployMarketplace.ts --network pushDonut
npx hardhat run scripts/deployBadge1155.ts --network pushDonut
npx hardhat run scripts/deployRevenueSplitRouter.ts --network pushDonut
```

Compiling generates ABIs under `artifacts/` and TypeScript types under `typechain-types/`.

## Deployment Cheatsheet

1. **Deploy `MembershipPass1155`** (`deployMembershipPass.ts`).
   - Uses metadata URI and the admin wallet.
   - Records the address under `MEMBERSHIP_CONTRACT_ADDRESS` in `deployment.log`; mirror it into `blockchain/.env`.
2. **Deploy `Badge1155`** (`deployBadge1155.ts`).
   - Logs the address for reference in `deployment.log`.
3. **Deploy `Registrar`** (`deployRegistrar.ts`).
   - Requires `MEMBERSHIP_CONTRACT_ADDRESS` in `.env` and grants `REGISTRAR_ROLE`.
   - Record the resulting address in `REGISTRAR_CONTRACT_ADDRESS`.
4. **Deploy `MembershipMarketplace`** (`deployMarketplace.ts`).
   - Requires `MEMBERSHIP_CONTRACT_ADDRESS` and `MARKETPLACE_TREASURY_ADDRESS`.
   - Grants `MARKETPLACE_ROLE` and records the Marketplace address for reference.
5. **Deploy `RevenueSplitRouter`** (`deployRevenueSplitRouter.ts`).
   - Stateless helper used for group join revenue splits. Deploy once per environment.
   - Logs the router address for reference; mirror it for the frontend if needed.
6. When the frontend needs a contract address, copy it from `blockchain/.env` (or `deployment.log`) into the app’s `.env.local` under the matching `NEXT_PUBLIC_*` key.

Whenever a creator registers a course the dApp calls the Registrar which deploys a `SplitPayout` and wires the course configuration.

> **Re-running scripts:** With the addresses stored in `blockchain/.env`, rerunning a
> deployment script detects that the contract already exists and reattaches,
> letting you perform admin tasks (e.g. fee updates, role grants) without
> redeploying.

Happy building on Push Chain!

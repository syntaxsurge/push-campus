# PushCampus: Universal Communities on Push Chain

Demo video: [YouTube](https://youtu.be/C_squUflvDs)

PushCampus lets creators run paid communities and cohort-driven courses on Push Chain’s Donut testnet using portable onchain memberships with a built-in marketplace and clear collaborator payouts — all inside one app.

## What It Solves
- One hub to sell access, teach, and share earnings with transparent records.
- Portable ERC‑1155 passes with expiry and transfer cooldowns to curb abuse.
- Free communities grant access without minting a pass (nothing to resell).

## Who It’s For
- Creators and small education teams who want ownership, portability, and simple revenue splits on Push Chain.

## How It Works
- Create a paid community (price, duration, cooldown). The app collects a small platform fee in PC and registers a course on Push Chain.
- Spin up a classroom, add modules and lessons, and safely embed video (YouTube links are normalized to embeds).
- Members join with PC on Push Chain. If they just joined, marketplace listing stays blocked until cooldown ends.
- “My Memberships” shows pass expiry and cooldown. Listing re-enables as soon as cooldown completes.
- Discover and join free groups instantly (no pass minted, not listable on the marketplace).

## Demo Chapters
1. Connect wallet (MetaMask via injected connector) and land on the dashboard.
2. Create a paid community and review the About tab (course ID + explorer link).
3. Classroom: create course, modules, lessons (demo uses sample YouTube playlist content).
4. Join paid group from a second wallet; tabs unlock automatically.
5. Marketplace: “List Your Membership” shows transfer cooldown rules.
6. My Memberships: see expiry and cooldown; listing disables during cooldown.
7. Feed: admin post; member likes/comments.
8. Discover: join a free group; browse its feed and classroom.

## Core Smart Contracts
- `MembershipPass1155`: native-token-gated access passes per course.
- `SplitPayout`: non-custodial revenue sharing for collaborators.
- `Badge1155`: soulbound proof-of-learning badges.
- `Registrar`: one-transaction course registration that wires everything together.
- `MembershipMarketplace`: primary and secondary marketplace for memberships.

## Features
- Wallet connect flow powered by standard injected connectors (MetaMask and browser wallets).
- Address-aware identity surface across posts, comments, and membership lists with optional display names.
- Wallet-backed Convex auth: user profiles keyed by wallet address.
- Course access and payouts fully on Push Chain using ERC-1155 passes and native-token routing.
- Production-ready Hardhat workspace under `blockchain/` powering the contract suite.

## Product Capabilities
- Paid and free communities, with gating handled by onchain state and group visibility.
- Marketplace listing, buying, and renewals with cooldown logic (UI blocks listing while cooldown settles).
- “My Memberships” view showing pass expiry, cooldown, and listing eligibility.
- Classroom with course grid, modules/lessons, safe video embeds, and live editing for owners.
- Feed with posts, likes, and comments; real-time updates via Convex.

## Prerequisites
- Node.js ≥ 18
- A Convex project (`npx convex dev` will prompt you to create or link one)
- A treasury wallet on Push Chain Donut to receive native PC payouts
- A Push Chain Donut wallet funded with testnet PC for fees and memberships

## Installation

```bash
git clone <this repo>
cd push-campus
pnpm install
```

## Testnet Funding

For end-to-end testing on Push Chain Donut:

1. Visit https://faucet.push.org/ to request testnet PC.
2. Confirm the same wallet holds enough PC to cover membership purchases and gas before interacting with the app.

## Scripts

- `pnpm dev` – start Next.js in development mode
- `pnpm convex:dev` – run Convex locally (required for live backend)
- `pnpm build` / `pnpm start` – production build & serve
- `pnpm lint` – lint the codebase
- `pnpm typecheck` – TypeScript validation

## On-chain Course Flow

1. Connect a wallet through the header menu (MetaMask or any injected wallet).
2. Creators call `Registrar.registerCourse` (via dashboard UI or script). This deploys a dedicated `SplitPayout` and registers pricing in `MembershipPass1155`.
3. Learners purchase or renew passes through the marketplace. The marketplace routes native PC, enforces cooldowns/fees, and mints through `MembershipPass1155`.
4. Collaborators withdraw their share using `SplitPayout.release`.
5. When a learner completes a course, the platform mints a non-transferable badge via `Badge1155`.

## Solidity Workspace

The `blockchain/` directory contains the Hardhat project:

- `contracts/MembershipPass1155.sol` – ERC-1155 course passes
- `contracts/SplitPayout.sol` – pull-based native-token splitter
- `contracts/Badge1155.sol` – soulbound completion badges
- `contracts/Registrar.sol` – deploys splitters and registers courses
- `contracts/MembershipMarketplace.sol` – primary/secondary marketplace for memberships

Compile with `cd blockchain && pnpm install && npx hardhat compile`. The `scripts/` folder hosts deployment scripts. Configure `blockchain/.env` with the following before deploying:

```env
PRIVATE_KEY="0xYourPrivateKey"
PUSH_DONUT_RPC_URL="https://evm.rpc-testnet-donut-node1.push.org/"
PUSHSCAN_API_KEY="<optional if Push Scan exposes verification API>"
MARKETPLACE_TREASURY_ADDRESS="0xYourTreasuryWallet"
MEMBERSHIP_METADATA_URI=""
BADGE_METADATA_URI=""
MEMBERSHIP_CONTRACT_ADDRESS=""
REGISTRAR_CONTRACT_ADDRESS=""
MARKETPLACE_FEE_BPS=250
MARKETPLACE_MAX_LISTING_DURATION_SECONDS=604800
```

Deployment order when bootstrapping a new environment:

1. `deployMembershipPass.ts` – deploys `MembershipPass1155`
2. `deployBadge1155.ts` – deploys `Badge1155`
3. `deployRegistrar.ts` – deploys `Registrar`, grants the role on `MembershipPass1155`, and records the address
4. `deployMarketplace.ts` – deploys `MembershipMarketplace`, grants marketplace roles, and records the address
5. (Optional) `deployRevenueSplitRouter.ts` – deploys router used for multi-party payouts

Each script prints the freshly deployed address—capture any required ones in `blockchain/.env` using the non-public keys above, then mirror them into the web app’s `.env.local` as `NEXT_PUBLIC_*` when the frontend needs access.

## Notes & Next Steps

- Learners need PC for membership payments and gas; consider adding a paymaster later if needed.
- Ensure `MEMBERSHIP_CONTRACT_ADDRESS` (and `REGISTRAR_CONTRACT_ADDRESS` when applicable) are present before deploying dependent scripts.
- When shipping beyond Donut, double-check all on-chain addresses and RPC URLs in `.env.local`.

Happy building on Push Chain!

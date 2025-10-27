import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "@nomiclabs/hardhat-truffle5";
require("dotenv").config();

/* -------------------------------------------------------------------------- */
/*                               E N V  V A R S                               */
/* -------------------------------------------------------------------------- */

const PRIVATE_KEY = process.env.PRIVATE_KEY ?? "";
const PUSH_DONUT_RPC_URL =
  process.env.PUSH_DONUT_RPC_URL ?? "https://evm.rpc-testnet-donut-node1.push.org/";

/* -------------------------------------------------------------------------- */
/*                               H A R D H A T                                */
/* -------------------------------------------------------------------------- */

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.25",
    settings: {
      evmVersion: "london",
      optimizer: { enabled: true, runs: 200 },
    },
  },
  networks: {
    /** Push Chain Donut testnet */
    pushDonut: {
      url: PUSH_DONUT_RPC_URL,
      chainId: 42101,
      accounts: PRIVATE_KEY ? [PRIVATE_KEY] : [],
    },
  },
  etherscan: {
    apiKey: {
      pushDonut: process.env.PUSHSCAN_API_KEY ?? "",
    },
    customChains: [
      {
        network: "pushDonut",
        chainId: 42101,
        urls: {
          apiURL: "https://donut.push.network/api",
          browserURL: "https://donut.push.network",
        },
      },
    ],
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
  },
  typechain: { target: "truffle-v5" },
};

export default config;

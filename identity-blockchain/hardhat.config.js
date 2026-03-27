import { defineConfig } from "hardhat/config";
import hardhatToolboxMochaEthers from "@nomicfoundation/hardhat-toolbox-mocha-ethers";

export default defineConfig({
  networks: {
    hardhat: {
      type: "edr-simulated",
      chainId: 31337,
      allowUnlimitedContractSize: true,
      gas: 30000000,
    },
    localhost: {
      type: "http",
      url: "http://127.0.0.1:8545",
      chainId: 31337,
      timeout: 60000,
    },
  },
  plugins: [hardhatToolboxMochaEthers],

  solidity: {
    version: "0.8.0",   // ← match your Identity.sol pragma (or use "0.8.28")
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },

  paths: {
    sources: "./contracts",
    artifacts: "./artifacts",
    cache: "./cache",
  },
});

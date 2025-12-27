require('@nomicfoundation/hardhat-toolbox');
require('dotenv').config();

// Register ts-node to handle TypeScript test files
require('ts-node').register({
  transpileOnly: true,
  files: true,
  compilerOptions: {
    module: 'commonjs',
  },
});

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: '0.8.27',
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    hardhat: {
      chainId: 1337,
    },
    sepolia: {
      url: process.env.SEPOLIA_RPC_URL || 'https://sepolia.infura.io/v3/YOUR-PROJECT-ID',
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: 11155111,
    },
  },
  paths: {
    sources: './blockchain/contracts',
    tests: './blockchain/test',
    cache: './blockchain/cache',
    artifacts: './blockchain/artifacts',
  },
  typechain: {
    outDir: 'blockchain/typechain-types',
    target: 'ethers-v6',
  },
  mocha: {
    timeout: 40000,
    require: ['ts-node/register'],
  },
};

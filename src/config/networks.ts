/**
 * Blockchain Network Configurations
 *
 * This file contains network configurations for different Ethereum networks.
 * RPC URLs can be overridden via environment variables for custom providers.
 */

export interface NetworkConfig {
  name: string;
  chainId: number;
  rpcUrl: string;
  blockExplorer: string;
}

/**
 * Network configurations by network name
 */
export const NETWORKS = {
  // Sepolia Testnet (Primary)
  sepolia: {
    name: 'Sepolia',
    chainId: 11155111,
    rpcUrl: process.env.SEPOLIA_RPC_URL || 'https://ethereum-sepolia-rpc.publicnode.com',
    blockExplorer: 'https://sepolia.etherscan.io',
  },

  // Local Hardhat Network (Development)
  localhost: {
    name: 'Localhost',
    chainId: 1337,
    rpcUrl: 'http://127.0.0.1:8545',
    blockExplorer: 'http://localhost:8545',
  },

  hardhat: {
    name: 'Hardhat',
    chainId: 1337,
    rpcUrl: 'http://127.0.0.1:8545',
    blockExplorer: 'http://localhost:8545',
  },

  // Future: Ethereum Mainnet
  // mainnet: {
  //   name: 'Ethereum Mainnet',
  //   chainId: 1,
  //   rpcUrl: process.env.MAINNET_RPC_URL || 'https://ethereum-rpc.publicnode.com',
  //   blockExplorer: 'https://etherscan.io',
  // },
} as const;

/**
 * Get network configuration for a specific network
 * Falls back to Sepolia if network not found
 */
export function getNetworkConfig(network: string = 'sepolia'): NetworkConfig {
  const networkConfig = NETWORKS[network as keyof typeof NETWORKS] || NETWORKS.sepolia;

  // Allow RPC URL override via environment variable
  if (process.env.BLOCKCHAIN_RPC_URL) {
    return {
      ...networkConfig,
      rpcUrl: process.env.BLOCKCHAIN_RPC_URL,
    };
  }

  return networkConfig;
}

/**
 * Export default configuration (Sepolia)
 */
export const defaultNetwork = getNetworkConfig('sepolia');

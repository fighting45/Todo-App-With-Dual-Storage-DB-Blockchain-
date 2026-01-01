// TodoRegistry ABI (imported from compiled artifacts)
export const TODO_REGISTRY_ABI = [
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'string',
        name: 'todoId',
        type: 'string',
      },
      {
        indexed: false,
        internalType: 'bytes32',
        name: 'todoHash',
        type: 'bytes32',
      },
      {
        indexed: true,
        internalType: 'address',
        name: 'owner',
        type: 'address',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'timestamp',
        type: 'uint256',
      },
    ],
    name: 'TodoCreated',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'string',
        name: 'todoId',
        type: 'string',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'timestamp',
        type: 'uint256',
      },
    ],
    name: 'TodoDeleted',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'string',
        name: 'todoId',
        type: 'string',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'timestamp',
        type: 'uint256',
      },
    ],
    name: 'TodoRestored',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'string',
        name: 'todoId',
        type: 'string',
      },
      {
        indexed: false,
        internalType: 'bytes32',
        name: 'oldHash',
        type: 'bytes32',
      },
      {
        indexed: false,
        internalType: 'bytes32',
        name: 'newHash',
        type: 'bytes32',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'timestamp',
        type: 'uint256',
      },
    ],
    name: 'TodoUpdated',
    type: 'event',
  },
  {
    inputs: [
      {
        internalType: 'string',
        name: 'todoId',
        type: 'string',
      },
      {
        internalType: 'bytes32',
        name: 'todoHash',
        type: 'bytes32',
      },
    ],
    name: 'createTodo',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'string',
        name: 'todoId',
        type: 'string',
      },
    ],
    name: 'deleteTodo',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'string',
        name: 'todoId',
        type: 'string',
      },
    ],
    name: 'getTodo',
    outputs: [
      {
        internalType: 'bytes32',
        name: 'todoHash',
        type: 'bytes32',
      },
      {
        internalType: 'address',
        name: 'owner',
        type: 'address',
      },
      {
        internalType: 'uint256',
        name: 'timestamp',
        type: 'uint256',
      },
      {
        internalType: 'bool',
        name: 'isDeleted',
        type: 'bool',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'string',
        name: 'todoId',
        type: 'string',
      },
    ],
    name: 'restoreTodo',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'string',
        name: 'todoId',
        type: 'string',
      },
    ],
    name: 'todoExistsByID',
    outputs: [
      {
        internalType: 'bool',
        name: '',
        type: 'bool',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'string',
        name: 'todoId',
        type: 'string',
      },
      {
        internalType: 'bytes32',
        name: 'newHash',
        type: 'bytes32',
      },
    ],
    name: 'updateTodo',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'string',
        name: 'todoId',
        type: 'string',
      },
      {
        internalType: 'bytes32',
        name: 'expectedHash',
        type: 'bytes32',
      },
    ],
    name: 'verifyTodo',
    outputs: [
      {
        internalType: 'bool',
        name: '',
        type: 'bool',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

/**
 * Contract Addresses by Network
 */
export const CONTRACT_ADDRESSES = {
  // Sepolia Testnet (Primary)
  sepolia: '0x24907eC5abCEeD2FfC0b0db9DFDee98898a85172',

  // Local Hardhat Network (Development)
  localhost: '0x5FbDB2315678afecb367f032d93F642f64180aa3',
  hardhat: '0x5FbDB2315678afecb367f032d93F642f64180aa3',

  // Future: Ethereum Mainnet
  // mainnet: '0x...',
} as const;

/**
 * Get contract configuration for a specific network
 */
export function getContractConfig(network: string = 'sepolia') {
  const address =
    CONTRACT_ADDRESSES[network as keyof typeof CONTRACT_ADDRESSES] || CONTRACT_ADDRESSES.sepolia;

  return {
    address,
    abi: TODO_REGISTRY_ABI,
  };
}

/**
 * Export default configuration (Sepolia)
 */
export const defaultContract = getContractConfig('sepolia');

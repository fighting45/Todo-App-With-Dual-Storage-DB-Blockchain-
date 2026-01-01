import { ethers, Contract, Wallet } from 'ethers';
import { config } from '../config';
import logger from '../utils/logger';
import { getContractConfig } from '../config/contracts';
import { getNetworkConfig } from '../config/networks';

/**
 * BlockchainService
 * Handles all interactions with the TodoRegistry smart contract
 */
export class BlockchainService {
  private contract: Contract;
  private provider: ethers.Provider;
  private wallet: Wallet;

  constructor() {
    // Get network configuration
    const network = config.blockchain.network || 'sepolia';
    const networkConfig = getNetworkConfig(network);

    // Get contract configuration
    const contractConfig = getContractConfig(network);

    // Initialize provider
    this.provider = new ethers.JsonRpcProvider(networkConfig.rpcUrl);

    // Initialize wallet
    this.wallet = new ethers.Wallet(config.blockchain.privateKey, this.provider);

    // Initialize contract instance with hardcoded ABI and address
    this.contract = new ethers.Contract(contractConfig.address, contractConfig.abi, this.wallet);

    logger.info('Blockchain service initialized', {
      network: networkConfig.name,
      chainId: networkConfig.chainId,
      contract: contractConfig.address,
    });
  }

  /**
   * Create a todo record on blockchain
   */
  async createTodo(todoId: string, todoHash: string): Promise<string> {
    try {
      logger.info('Creating todo on blockchain', { todoId, todoHash });

      const tx = await this.contract.createTodo(todoId, todoHash);
      const receipt = await tx.wait();

      logger.info('Todo created on blockchain', {
        todoId,
        txHash: receipt.hash,
        blockNumber: receipt.blockNumber,
      });

      return receipt.hash;
    } catch (error) {
      logger.error('Failed to create todo on blockchain', {
        todoId,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Update a todo's hash on blockchain
   */
  async updateTodo(todoId: string, newHash: string): Promise<string> {
    try {
      logger.info('Updating todo on blockchain', { todoId, newHash });

      const tx = await this.contract.updateTodo(todoId, newHash);
      const receipt = await tx.wait();

      logger.info('Todo updated on blockchain', {
        todoId,
        txHash: receipt.hash,
        blockNumber: receipt.blockNumber,
      });

      return receipt.hash;
    } catch (error) {
      logger.error('Failed to update todo on blockchain', {
        todoId,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Soft delete a todo on blockchain
   */
  async deleteTodo(todoId: string): Promise<string> {
    try {
      logger.info('Deleting todo on blockchain', { todoId });

      const tx = await this.contract.deleteTodo(todoId);
      const receipt = await tx.wait();

      logger.info('Todo deleted on blockchain', {
        todoId,
        txHash: receipt.hash,
        blockNumber: receipt.blockNumber,
      });

      return receipt.hash;
    } catch (error) {
      logger.error('Failed to delete todo on blockchain', {
        todoId,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Restore a deleted todo on blockchain
   */
  async restoreTodo(todoId: string): Promise<string> {
    try {
      logger.info('Restoring todo on blockchain', { todoId });

      const tx = await this.contract.restoreTodo(todoId);
      const receipt = await tx.wait();

      logger.info('Todo restored on blockchain', {
        todoId,
        txHash: receipt.hash,
        blockNumber: receipt.blockNumber,
      });

      return receipt.hash;
    } catch (error) {
      logger.error('Failed to restore todo on blockchain', {
        todoId,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Verify a todo's hash against blockchain
   */
  async verifyTodo(todoId: string, expectedHash: string): Promise<boolean> {
    try {
      logger.info('Verifying todo on blockchain', { todoId, expectedHash });

      const isValid = await this.contract.verifyTodo(todoId, expectedHash);

      logger.info('Todo verification result', { todoId, isValid });

      return isValid;
    } catch (error) {
      logger.error('Failed to verify todo on blockchain', {
        todoId,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Get todo details from blockchain
   */
  async getTodo(todoId: string): Promise<{
    todoHash: string;
    owner: string;
    timestamp: bigint;
    isDeleted: boolean;
  }> {
    try {
      logger.info('Getting todo from blockchain', { todoId });

      const [todoHash, owner, timestamp, isDeleted] = await this.contract.getTodo(todoId);

      return {
        todoHash,
        owner,
        timestamp,
        isDeleted,
      };
    } catch (error) {
      logger.error('Failed to get todo from blockchain', {
        todoId,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Check if a todo exists on blockchain
   */
  async todoExists(todoId: string): Promise<boolean> {
    try {
      const exists = await this.contract.todoExistsByID(todoId);
      return exists;
    } catch (error) {
      logger.error('Failed to check todo existence on blockchain', {
        todoId,
        error: error instanceof Error ? error.message : String(error),
      });
      return false;
    }
  }

  /**
   * Get wallet address (for testing/debugging)
   */
  getWalletAddress(): string {
    return this.wallet.address;
  }

  /**
   * Get contract address
   */
  getContractAddress(): string {
    const network = config.blockchain.network || 'sepolia';
    const contractConfig = getContractConfig(network);
    return contractConfig.address;
  }
}

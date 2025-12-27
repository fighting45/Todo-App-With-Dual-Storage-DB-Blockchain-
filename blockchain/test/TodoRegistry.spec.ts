import { expect } from 'chai';
import { ethers } from 'hardhat';
import { TodoRegistry } from '../typechain-types';
import { SignerWithAddress } from '@nomicfoundation/hardhat-ethers/signers';

describe('TodoRegistry', function () {
  let todoRegistry: TodoRegistry;
  let owner: SignerWithAddress;
  let user1: SignerWithAddress;
  let user2: SignerWithAddress;

  const todoId1 = '507f1f77bcf86cd799439011';
  const todoId2 = '507f1f77bcf86cd799439012';
  const todoHash1 = ethers.keccak256(ethers.toUtf8Bytes('todo content 1'));
  const todoHash2 = ethers.keccak256(ethers.toUtf8Bytes('todo content 2'));
  const updatedHash = ethers.keccak256(ethers.toUtf8Bytes('updated todo content'));

  beforeEach(async function () {
    // Get signers
    [owner, user1, user2] = await ethers.getSigners();

    // Deploy contract
    const TodoRegistryFactory = await ethers.getContractFactory('TodoRegistry');
    todoRegistry = await TodoRegistryFactory.deploy();
    await todoRegistry.waitForDeployment();
  });

  describe('Deployment', function () {
    it('Should deploy successfully', async function () {
      const address = await todoRegistry.getAddress();
      expect(address).to.not.equal(ethers.ZeroAddress);
    });
  });

  describe('Create Todo', function () {
    it('Should create a todo successfully', async function () {
      await expect(todoRegistry.connect(user1).createTodo(todoId1, todoHash1))
        .to.emit(todoRegistry, 'TodoCreated')
        .withArgs(todoId1, todoHash1, user1.address, await ethers.provider.getBlock('latest').then(b => b!.timestamp + 1));

      const [hash, todoOwner, timestamp, isDeleted] = await todoRegistry.getTodo(todoId1);
      expect(hash).to.equal(todoHash1);
      expect(todoOwner).to.equal(user1.address);
      expect(timestamp).to.be.gt(0);
      expect(isDeleted).to.be.false;
    });

    it('Should fail if todo ID is empty', async function () {
      await expect(todoRegistry.connect(user1).createTodo('', todoHash1))
        .to.be.revertedWith('Todo ID cannot be empty');
    });

    it('Should fail if todo hash is empty', async function () {
      await expect(todoRegistry.connect(user1).createTodo(todoId1, ethers.ZeroHash))
        .to.be.revertedWith('Todo hash cannot be empty');
    });

    it('Should fail if todo already exists', async function () {
      await todoRegistry.connect(user1).createTodo(todoId1, todoHash1);
      await expect(todoRegistry.connect(user1).createTodo(todoId1, todoHash2))
        .to.be.revertedWith('Todo already exists');
    });

    it('Should allow different users to create todos with different IDs', async function () {
      await todoRegistry.connect(user1).createTodo(todoId1, todoHash1);
      await todoRegistry.connect(user2).createTodo(todoId2, todoHash2);

      const [hash1, owner1] = await todoRegistry.getTodo(todoId1);
      const [hash2, owner2] = await todoRegistry.getTodo(todoId2);

      expect(hash1).to.equal(todoHash1);
      expect(owner1).to.equal(user1.address);
      expect(hash2).to.equal(todoHash2);
      expect(owner2).to.equal(user2.address);
    });
  });

  describe('Update Todo', function () {
    beforeEach(async function () {
      await todoRegistry.connect(user1).createTodo(todoId1, todoHash1);
    });

    it('Should update todo hash successfully', async function () {
      await expect(todoRegistry.connect(user1).updateTodo(todoId1, updatedHash))
        .to.emit(todoRegistry, 'TodoUpdated')
        .withArgs(todoId1, todoHash1, updatedHash, await ethers.provider.getBlock('latest').then(b => b!.timestamp + 1));

      const [hash] = await todoRegistry.getTodo(todoId1);
      expect(hash).to.equal(updatedHash);
    });

    it('Should fail if todo does not exist', async function () {
      await expect(todoRegistry.connect(user1).updateTodo(todoId2, updatedHash))
        .to.be.revertedWith('Todo does not exist');
    });

    it('Should fail if caller is not the owner', async function () {
      await expect(todoRegistry.connect(user2).updateTodo(todoId1, updatedHash))
        .to.be.revertedWith('Not authorized: caller is not the todo owner');
    });

    it('Should fail if new hash is empty', async function () {
      await expect(todoRegistry.connect(user1).updateTodo(todoId1, ethers.ZeroHash))
        .to.be.revertedWith('New hash cannot be empty');
    });

    it('Should fail if todo is deleted', async function () {
      await todoRegistry.connect(user1).deleteTodo(todoId1);
      await expect(todoRegistry.connect(user1).updateTodo(todoId1, updatedHash))
        .to.be.revertedWith('Cannot update deleted todo');
    });
  });

  describe('Delete Todo', function () {
    beforeEach(async function () {
      await todoRegistry.connect(user1).createTodo(todoId1, todoHash1);
    });

    it('Should delete todo successfully (soft delete)', async function () {
      await expect(todoRegistry.connect(user1).deleteTodo(todoId1))
        .to.emit(todoRegistry, 'TodoDeleted')
        .withArgs(todoId1, await ethers.provider.getBlock('latest').then(b => b!.timestamp + 1));

      const [, , , isDeleted] = await todoRegistry.getTodo(todoId1);
      expect(isDeleted).to.be.true;
    });

    it('Should fail if todo does not exist', async function () {
      await expect(todoRegistry.connect(user1).deleteTodo(todoId2))
        .to.be.revertedWith('Todo does not exist');
    });

    it('Should fail if caller is not the owner', async function () {
      await expect(todoRegistry.connect(user2).deleteTodo(todoId1))
        .to.be.revertedWith('Not authorized: caller is not the todo owner');
    });

    it('Should fail if todo is already deleted', async function () {
      await todoRegistry.connect(user1).deleteTodo(todoId1);
      await expect(todoRegistry.connect(user1).deleteTodo(todoId1))
        .to.be.revertedWith('Todo is already deleted');
    });
  });

  describe('Restore Todo', function () {
    beforeEach(async function () {
      await todoRegistry.connect(user1).createTodo(todoId1, todoHash1);
      await todoRegistry.connect(user1).deleteTodo(todoId1);
    });

    it('Should restore deleted todo successfully', async function () {
      await expect(todoRegistry.connect(user1).restoreTodo(todoId1))
        .to.emit(todoRegistry, 'TodoRestored')
        .withArgs(todoId1, await ethers.provider.getBlock('latest').then(b => b!.timestamp + 1));

      const [, , , isDeleted] = await todoRegistry.getTodo(todoId1);
      expect(isDeleted).to.be.false;
    });

    it('Should fail if todo does not exist', async function () {
      await expect(todoRegistry.connect(user1).restoreTodo(todoId2))
        .to.be.revertedWith('Todo does not exist');
    });

    it('Should fail if caller is not the owner', async function () {
      await expect(todoRegistry.connect(user2).restoreTodo(todoId1))
        .to.be.revertedWith('Not authorized: caller is not the todo owner');
    });

    it('Should fail if todo is not deleted', async function () {
      await todoRegistry.connect(user1).restoreTodo(todoId1);
      await expect(todoRegistry.connect(user1).restoreTodo(todoId1))
        .to.be.revertedWith('Todo is not deleted');
    });
  });

  describe('Verify Todo', function () {
    beforeEach(async function () {
      await todoRegistry.connect(user1).createTodo(todoId1, todoHash1);
    });

    it('Should verify correct hash', async function () {
      const isValid = await todoRegistry.verifyTodo(todoId1, todoHash1);
      expect(isValid).to.be.true;
    });

    it('Should reject incorrect hash', async function () {
      const isValid = await todoRegistry.verifyTodo(todoId1, todoHash2);
      expect(isValid).to.be.false;
    });

    it('Should fail if todo does not exist', async function () {
      await expect(todoRegistry.verifyTodo(todoId2, todoHash1))
        .to.be.revertedWith('Todo does not exist');
    });
  });

  describe('Get Todo', function () {
    beforeEach(async function () {
      await todoRegistry.connect(user1).createTodo(todoId1, todoHash1);
    });

    it('Should get todo details successfully', async function () {
      const [hash, todoOwner, timestamp, isDeleted] = await todoRegistry.getTodo(todoId1);

      expect(hash).to.equal(todoHash1);
      expect(todoOwner).to.equal(user1.address);
      expect(timestamp).to.be.gt(0);
      expect(isDeleted).to.be.false;
    });

    it('Should fail if todo does not exist', async function () {
      await expect(todoRegistry.getTodo(todoId2))
        .to.be.revertedWith('Todo does not exist');
    });
  });

  describe('Todo Exists', function () {
    it('Should return true for existing todo', async function () {
      await todoRegistry.connect(user1).createTodo(todoId1, todoHash1);
      const exists = await todoRegistry.todoExistsByID(todoId1);
      expect(exists).to.be.true;
    });

    it('Should return false for non-existing todo', async function () {
      const exists = await todoRegistry.todoExistsByID(todoId2);
      expect(exists).to.be.false;
    });
  });

  describe('Complex Scenarios', function () {
    it('Should handle complete lifecycle: create, update, delete, restore', async function () {
      // Create
      await todoRegistry.connect(user1).createTodo(todoId1, todoHash1);
      let [hash, , , isDeleted] = await todoRegistry.getTodo(todoId1);
      expect(hash).to.equal(todoHash1);
      expect(isDeleted).to.be.false;

      // Update
      await todoRegistry.connect(user1).updateTodo(todoId1, updatedHash);
      [hash, , , isDeleted] = await todoRegistry.getTodo(todoId1);
      expect(hash).to.equal(updatedHash);
      expect(isDeleted).to.be.false;

      // Delete
      await todoRegistry.connect(user1).deleteTodo(todoId1);
      [hash, , , isDeleted] = await todoRegistry.getTodo(todoId1);
      expect(hash).to.equal(updatedHash); // Hash should remain
      expect(isDeleted).to.be.true;

      // Restore
      await todoRegistry.connect(user1).restoreTodo(todoId1);
      [hash, , , isDeleted] = await todoRegistry.getTodo(todoId1);
      expect(hash).to.equal(updatedHash);
      expect(isDeleted).to.be.false;
    });

    it('Should maintain separate todos for different users', async function () {
      await todoRegistry.connect(user1).createTodo(todoId1, todoHash1);
      await todoRegistry.connect(user2).createTodo(todoId2, todoHash2);

      // User1 should not be able to modify user2's todo
      await expect(todoRegistry.connect(user1).updateTodo(todoId2, updatedHash))
        .to.be.revertedWith('Not authorized: caller is not the todo owner');

      // User2 should not be able to modify user1's todo
      await expect(todoRegistry.connect(user2).deleteTodo(todoId1))
        .to.be.revertedWith('Not authorized: caller is not the todo owner');
    });
  });
});

import { ethers } from 'hardhat';

async function main() {
  console.log('🚀 Deploying TodoRegistry contract...\n');

  // Get the contract factory
  const TodoRegistry = await ethers.getContractFactory('TodoRegistry');

  // Deploy the contract
  console.log('📝 Deploying contract...');
  const todoRegistry = await TodoRegistry.deploy();

  // Wait for deployment to complete
  await todoRegistry.waitForDeployment();

  const address = await todoRegistry.getAddress();

  console.log('✅ TodoRegistry deployed successfully!');
  console.log('📍 Contract address:', address);
  console.log('\n📋 Deployment Summary:');
  console.log('  Network:', (await ethers.provider.getNetwork()).name);
  console.log('  Chain ID:', (await ethers.provider.getNetwork()).chainId);
  console.log('  Deployer:', (await ethers.getSigners())[0].address);

  // Save deployment info
  console.log('\n💡 Add this to your .env file:');
  console.log(`BLOCKCHAIN_CONTRACT_ADDRESS=${address}`);

  return address;
}

main()
  .then((address) => {
    console.log(`\n✨ Deployment complete! Contract address: ${address}`);
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Deployment failed:', error);
    process.exit(1);
  });

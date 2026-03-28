const { ethers } = require('ethers');
const Identity = require('../identity-blockchain/artifacts/contracts/Identity.sol/Identity.json');

async function main() {
  const provider = new ethers.JsonRpcProvider('http://127.0.0.1:8545');
  const adminWallet = new ethers.Wallet('0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80', provider);
  const contract = new ethers.Contract('0x5FC8d32690cc91D4c39d9d3abcBD16989F875707', Identity.abi, adminWallet);
  
  const testUser = '0x70997970C51812dc3A010C7d01b50e0d17dc79C8';
  const testHash = '0xabcdef123456789abcdef123456789abcdef123456789abcdef123456789abcd';

  try {
    console.log('Admin:', adminWallet.address);
    console.log('Contract:', contract.address);
    console.log('Test user:', testUser);
    console.log('Test hash:', testHash);
    
    // Check if contract is admin
    const isAdmin = await contract.isAdmin();
    console.log('Is admin:', isAdmin);
    
    // Get nonce and register
    const nonce = await provider.getTransactionCount(adminWallet.address);
    console.log('\nRegistering with nonce', nonce);
    
    const registerTx = await contract.adminRegisterIdentity(testUser, testHash, { nonce });
    console.log('Register tx:', registerTx.hash);
    
    const registerReceipt = await registerTx.wait();
    console.log('Register confirmed at block', registerReceipt.blockNumber);
    
    // Query the stored hash
    console.log('\nQuerying stored hash...');
    const storedHash = await contract.getIdentityHash(testUser);
    console.log('Stored hash:', storedHash);
    console.log('Match:', storedHash === testHash);
    
  } catch (err) {
    console.error('Error:', err.message);
    console.error('Full error:', err);
  }
}

main();

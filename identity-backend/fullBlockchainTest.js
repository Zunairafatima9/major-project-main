const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');
const Identity = require('../identity-blockchain/artifacts/contracts/Identity.sol/Identity.json');

async function main() {
  const provider = new ethers.JsonRpcProvider('http://127.0.0.1:8545');
  const adminWallet = new ethers.Wallet('0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80', provider);
  const contract = new ethers.Contract('0x5FbDB2315678afecb367f032d93F642f64180aa3', Identity.abi, adminWallet);
  
  console.log('=== FULL BLOCKCHAIN TEST ===');
  console.log('Admin wallet:', adminWallet.address);
  console.log('Contract:', contract.address);
  console.log('');

  // Test user address (like from frontend)
  const testUserAddress = '0x5d7abed0761bf0a71308da8ae0b7982bf2049013';
  const testHash = '0xfc9ef9b58f63bf80f8913b0b54f2d0ce63f9873b4c0e71b784c0bbfaf3f5f4e1';

  try {
    console.log('--- Phase 1: Register Identity ---');
    console.log('Calling adminRegisterIdentity with:');
    console.log('  user:', testUserAddress);
    console.log('  hash:', testHash);
    
    // Get current nonce
    const nonce1 = await provider.getTransactionCount(adminWallet.address);
    console.log('Nonce:', nonce1);
    
    const registerTx = await contract.adminRegisterIdentity(testUserAddress, testHash, { nonce: nonce1 });
    console.log('✅ Tx sent:', registerTx.hash);
    
    const registerReceipt = await registerTx.wait();
    console.log('✅ Confirmed:', registerReceipt.transactionHash);
    console.log('  Block:', registerReceipt.blockNumber);
  } catch (err) {
    console.error('❌ Register failed:', err.message);
    return;
  }

  try {
    console.log('\n--- Phase 2: Verify Identity ---');
    console.log('Calling verifyIdentity for:', testUserAddress);
    
    // Get PENDING nonce - this gets the next available nonce after previous tx
    const nonce2 = await provider.getTransactionCount(adminWallet.address, 'pending');
    console.log('Pending Nonce:', nonce2);
    
    const verifyTx = await contract.verifyIdentity(testUserAddress, { nonce: nonce2 });
    console.log('✅ Tx sent:', verifyTx.hash);
    
    const verifyReceipt = await verifyTx.wait();
    console.log('✅ Confirmed:', verifyReceipt.transactionHash);
    console.log('  Block:', verifyReceipt.blockNumber);
  } catch (err) {
    console.error('❌ Verify failed:', err.message);
    return;
  }

  try {
    console.log('\n--- Phase 3: Check Status ---');
    const status = await contract.getStatus(testUserAddress);
    console.log('✅ Verification status:', status);
    
    const hash = await contract.getIdentityHash(testUserAddress);
    console.log('✅ Stored hash:', hash);
  } catch (err) {
    console.error('❌ Status check failed:', err.message);
  }

  console.log('\n=== TEST COMPLETE ===');
}

main().catch(console.error);

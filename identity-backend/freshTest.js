const { ethers } = require('ethers');
const Identity = require('../identity-blockchain/artifacts/contracts/Identity.sol/Identity.json');

async function main() {
  const provider = new ethers.JsonRpcProvider('http://127.0.0.1:8545');
  const signer = new ethers.Wallet('0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80', provider);
  const contract = new ethers.Contract('0x5FbDB2315678afecb367f032d93F642f64180aa3', Identity.abi, signer);
  
  console.log('=== FRESH DATA TEST ===');
  console.log('Admin:', signer.address);
  console.log('Contract:', contract.address);
  
  const testUser = '0x70997970C51812dc3A010C7d01b50e0d17dc79C8';
  const testHash = 'QmTestHash123456789';
  
  try {
    console.log('\n--- Register ---');
    const nonce1 = await provider.getTransactionCount(signer.address);
    const tx1 = await contract.adminRegisterIdentity(testUser, testHash, { nonce: nonce1 });
    const receipt1 = await tx1.wait();
    console.log('✅ Registered. Block:', receipt1.blockNumber);
  } catch (err) {
    console.error('❌ Register failed:', err.message);
  }
  
  try {
    console.log('\n--- Check Status Before Verify ---');
    const status = await contract.getStatus(testUser);
    console.log('Status:', status);
  } catch (err) {
    console.error('❌ getStatus failed:', err.message);
  }
  
  try {
    console.log('\n--- Verify ---');
    const nonce2 = await provider.getTransactionCount(signer.address, 'pending');
    const tx2 = await contract.verifyIdentity(testUser, { nonce: nonce2 });
    const receipt2 = await tx2.wait();
    console.log('✅ Verified. Block:', receipt2.blockNumber);
  } catch (err) {
    console.error('❌ Verify failed:', err.message);
  }
  
  try {
    console.log('\n--- Check Status After Verify ---');
    const status = await contract.getStatus(testUser);
    console.log('Status:', status);
  } catch (err) {
    console.error('❌ getStatus failed:', err.message);
  }
  
  try {
    console.log('\n--- Get Hash ---');
    const hash = await contract.getIdentityHash(testUser);
    console.log('Hash:', hash);
  } catch (err) {
    console.error('❌ getIdentityHash failed:', err.message);
  }
}

main().catch(console.error);

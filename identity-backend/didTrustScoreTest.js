const { ethers } = require('ethers');
const Identity = require('../identity-blockchain/artifacts/contracts/Identity.sol/Identity.json');

async function main() {
  const provider = new ethers.JsonRpcProvider('http://127.0.0.1:8545');
  const signer = new ethers.Wallet('0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80', provider);
  const contract = new ethers.Contract('0x5FbDB2315678afecb367f032d93F642f64180aa3', Identity.abi, signer);
  
  console.log('=== DID & TRUST SCORE TEST ===\n');
  
  const testUser = '0x70997970C51812dc3A010C7d01b50e0d17dc79C8';
  const testHash = '0xfc9ef9b58f63bf80f8913b0b54f2d0ce63f9873b4c0e71b784c0bbfaf3f5f4e1';
  
  // Register
  console.log('--- Registering Identity ---');
  const nonce1 = await provider.getTransactionCount(signer.address);
  const tx1 = await contract.adminRegisterIdentity(testUser, testHash, { nonce: nonce1 });
  const receipt1 = await tx1.wait();
  console.log('✅ Registered on blockchain');
  
  // Verify
  console.log('\n--- Verifying Identity ---');
  const nonce2 = await provider.getTransactionCount(signer.address, 'pending');
  const tx2 = await contract.verifyIdentity(testUser, { nonce: nonce2 });
  const receipt2 = await tx2.wait();
  console.log('✅ Verified on blockchain');
  
  // Check contract state
  console.log('\n--- Contract State ---');
  const status = await contract.getStatus(testUser);
  const storedHash = await contract.getIdentityHash(testUser);
  console.log('Status:', status);
  console.log('Stored Hash:', storedHash);
  
  console.log('\n--- Expected Response Data ---');
  console.log('DID Format: did:identity:{address}{hash}');
  console.log('Trust Score: 0-100 (Higher = More Trusted)');
  console.log('Example DID:', `did:identity:${testUser.slice(2, 10)}${testHash.slice(2, 18)}`);
  console.log('Example Score: 85/100 (HIGHLY TRUSTED)');
}

main().catch(console.error);

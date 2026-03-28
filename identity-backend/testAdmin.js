const { ethers } = require('ethers');
const Identity = require('../identity-blockchain/artifacts/contracts/Identity.sol/Identity.json');

async function main() {
  const provider = new ethers.JsonRpcProvider('http://127.0.0.1:8545');
  const wallet = new ethers.Wallet('0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80', provider);
  const contract = new ethers.Contract('0x5FbDB2315678afecb367f032d93F642f64180aa3', Identity.abi, wallet);
  
  console.log('Backend signer address:', wallet.address);
  console.log('');
  
  try {
    const admin = await contract.admin();
    console.log('Contract admin address:', admin);
    console.log('Backend is admin?', wallet.address.toLowerCase() === admin.toLowerCase());
  } catch (err) {
    console.error('Error reading admin:', err.message);
  }
  
  try {
    const isAdmin = await contract.isAdmin();
    console.log('Contract.isAdmin() called by backend:', isAdmin);
  } catch (err) {
    console.error('Error calling isAdmin():', err.message);
  }
  
  try {
    console.log('\n--- Testing adminRegisterIdentity ---');
    const testHash = "0xtest123";
    const testAddr = "0x1234567890123456789012345678901234567890";
    
    console.log('Attempting to call adminRegisterIdentity with:');
    console.log('  user:', testAddr);
    console.log('  hash:', testHash);
    
    const tx = await contract.adminRegisterIdentity(testAddr, testHash);
    console.log('Transaction sent:', tx.hash);
    
    const receipt = await tx.wait();
    console.log('Transaction confirmed:', receipt.transactionHash);
  } catch (err) {
    console.error('adminRegisterIdentity failed:', err.message);
  }
}

main().catch(console.error);

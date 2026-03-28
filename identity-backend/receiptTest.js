const { ethers } = require('ethers');
const Identity = require('../identity-blockchain/artifacts/contracts/Identity.sol/Identity.json');

async function main() {
  const provider = new ethers.JsonRpcProvider('http://127.0.0.1:8545');
  const signer = new ethers.Wallet('0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80', provider);
  const contract = new ethers.Contract('0x5FbDB2315678afecb367f032d93F642f64180aa3', Identity.abi, signer);
  
  console.log('=== RECEIPT STRUCTURE TEST ===\n');
  
  const nonce1 = await provider.getTransactionCount(signer.address);
  const tx = await contract.adminRegisterIdentity('0x70997970C51812dc3A010C7d01b50e0d17dc79C8', 'TEST123', { nonce: nonce1 });
  console.log('Transaction sent:', tx.hash);
  
  const receipt = await tx.wait();
  console.log('\nReceipt object keys:', Object.keys(receipt));
  console.log('\nReceipt values:');
  console.log('  receipt.hash:', receipt.hash);
  console.log('  receipt.transactionHash:', receipt.transactionHash);
  console.log('  receipt.blockNumber:', receipt.blockNumber);
  console.log('  receipt.type:', receipt.type);
  console.log('  receipt.status:', receipt.status);
  
  console.log('\nFull receipt:', JSON.stringify(receipt, null, 2));
}

main().catch(console.error);

const { ethers } = require('ethers');
const Identity = require('../identity-blockchain/artifacts/contracts/Identity.sol/Identity.json');

async function main() {
  const provider = new ethers.JsonRpcProvider('http://127.0.0.1:8545');
  const wallet = new ethers.Wallet('0xac0974bec39a17e36ba4a6b4d238ff944bacb476c3c796fa149a9723ee4c6b88', provider);
  const contract = new ethers.Contract('0x5FbDB2315678afecb367f032d93F642f64180aa3', Identity.abi, wallet);
  console.log('has adminRegisterIdentity', typeof contract.adminRegisterIdentity);
  console.log('has registerIdentity', typeof contract.registerIdentity);
  console.log('has verifyIdentity', typeof contract.verifyIdentity);
}

main().catch(console.error);

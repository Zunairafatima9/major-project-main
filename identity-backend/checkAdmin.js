const { ethers } = require('ethers');
const IdentityArtifact = require('../identity-blockchain/artifacts/contracts/Identity.sol/Identity.json');

async function main() {
  const provider = new ethers.JsonRpcProvider('http://127.0.0.1:8545');
  const contract = new ethers.Contract('0x5FbDB2315678afecb367f032d93F642f64180aa3', IdentityArtifact.abi, provider);
  const admin = await contract.admin();
  const status = await contract.isAdmin();
  console.log('contract admin:', admin);
  console.log('isAdmin (provider) for default from (not signer):', status);

  const signer = new ethers.Wallet('0xac0974bec39a17e36ba4a6b4d238ff944bacb476c3c796fa149a9723ee4c6b88', provider);
  const signed = contract.connect(signer);
  console.log('signer address:', signer.address);
  console.log('signer isAdmin:', await signed.isAdmin());
  const name = await signed.getIdentityHash('0x5d7abed0761bf0a71308da8ae0b7982bf2049013').catch(e=>e.message);
  console.log('identity hash for user (if exists):', name);
}

main().catch(err => { console.error('ERROR', err); process.exit(1); });

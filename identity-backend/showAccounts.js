const { ethers } = require('ethers');

// All 20 Hardhat default accounts
const accounts = [
  '0xac0974bec39a17e36ba4a6b4d238ff944bacb476c3c796fa149a9723ee4c6b88',
  '0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d',
  '0x5de4111afa1a4b94908f83103db1fb50423ee7f933523bd6b221eeda5b31b868',
];

console.log('Hardhat Default Accounts:');
accounts.forEach((key, i) => {
  const wallet = new ethers.Wallet(key);
  console.log(`${i}: ${wallet.address} (key: ${key.slice(0, 10)}...)`);
});

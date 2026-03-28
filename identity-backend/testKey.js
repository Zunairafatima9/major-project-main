const { ethers } = require('ethers');
const key = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';
const w = new ethers.Wallet(key);
console.log('Private key:', key);
console.log('Maps to address:', w.address);

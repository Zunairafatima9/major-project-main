const { ethers } = require('ethers');
console.log('HDNodeWallet keys', Object.keys(ethers.HDNodeWallet || {}));
console.log('Wallet keys', Object.keys(ethers.Wallet || {}));

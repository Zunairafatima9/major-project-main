const { ethers } = require('ethers');
console.log('Wallet methods:', Object.keys(ethers.Wallet || {}));
console.log('Wallet.fromPhrase', typeof ethers.Wallet.fromPhrase); 
console.log('Wallet.fromMnemonic', typeof ethers.Wallet.fromMnemonic); 
console.log('HDNodeWallet fromPhrase', typeof ethers.HDNodeWallet?.fromPhrase);
console.log('HDNodeWallet fromMnemonic', typeof ethers.HDNodeWallet?.fromMnemonic);

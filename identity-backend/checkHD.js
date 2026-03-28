const { ethers } = require('ethers');
const mnemonic = 'test test test test test test test test test test test junk';
for (let i = 0; i < 10; i++) {
  const wallet = ethers.HDNodeWallet.fromMnemonic(mnemonic, { path: `m/44'/60'/0'/0/${i}` });
  console.log(i, wallet.address, wallet.privateKey);
}

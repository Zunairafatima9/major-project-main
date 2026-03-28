const { ethers } = require('ethers');
const mnemonic = 'test test test test test test test test test test test junk';
for (let i = 0; i < 10; i++) {
  const w1 = ethers.Wallet.fromPhrase(mnemonic, { path: `m/44'/60'/0'/0/${i}` });
  const w2 = ethers.HDNodeWallet.fromPhrase(mnemonic, { path: `m/44'/60'/0'/0/${i}` });
  console.log(i, 'Wallet', w1.address, w1.privateKey, 'HDNode', w2.address, w2.privateKey);
}

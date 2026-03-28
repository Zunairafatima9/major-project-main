const { ethers } = require('ethers');

async function main() {
  const phrase = 'test test test test test test test test test test test junk';
  for (let i = 0; i < 10; i++) {
    const w = await ethers.HDNodeWallet.fromPhrase(phrase, { path: `m/44'/60'/0'/0/${i}` });
    console.log(i, w.address, w.privateKey);
  }
}

main().catch(console.error);

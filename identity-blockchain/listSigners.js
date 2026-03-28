const hre = require('hardhat');
async function main() {
  const signers = await hre.ethers.getSigners();
  signers.forEach((s, i) => {
    console.log(i, s.address, s.privateKey ? s.privateKey : '(no privateKey exposed)');
  });
}
main().catch((e) => { console.error(e); process.exit(1); });

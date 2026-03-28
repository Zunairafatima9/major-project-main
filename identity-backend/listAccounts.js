const { ethers } = require('ethers');
(async () => {
  const provider = new ethers.JsonRpcProvider('http://127.0.0.1:8545');
  const accounts = await provider.send('eth_accounts', []);
  console.log(accounts);
})();

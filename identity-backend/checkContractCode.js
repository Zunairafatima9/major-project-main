const { ethers } = require('ethers');

async function main() {
  const provider = new ethers.JsonRpcProvider('http://127.0.0.1:8545');
  const contractAddr = '0x5FC8d32690cc91D4c39d9d3abcBD16989F875707';
  
  // Check if contract exists
  const code = await provider.getCode(contractAddr);
  console.log('Contract address:', contractAddr);
  console.log('Code length:', code.length);
  console.log('Has code:', code !== '0x');
  
  // Try to get the block info
  const blockNumber = await provider.getBlockNumber();
  console.log('Current block:', blockNumber);
}

main().catch(console.error);


const { ethers } = require('ethers');

async function main() {
  const provider = new ethers.JsonRpcProvider('http://127.0.0.1:8545');
  const addr = '0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9';
  
  console.log('=== CONTRACT DEPLOYMENT VERIFICATION ===\n');
  
  const code = await provider.getCode(addr);
  console.log('Bytecode length:', code.length);
  console.log('Is deployed:', code !== '0x');
  
  if (code !== '0x') {
    console.log('First 200 chars:', code.slice(0, 200));
  } else {
    console.log('⚠️  NO BYTECODE AT ADDRESS - Contract not deployed!');
  }
}

main().catch(console.error);

const { ethers } = require('ethers');

async function main() {
  const provider = new ethers.JsonRpcProvider('http://127.0.0.1:8545');
  
  const contractAddr = '0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9';
  const userAddr = '0x70997970C51812dc3A010C7d01b50e0d17dc79C8';
  
  // Encode getStatus(user) call
  const iface = new ethers.Interface([
    'function getStatus(address user) public view returns (bool)',
    'function getIdentityHash(address user) public view returns (string memory)',
  ]);
  
  const data1 = iface.encodeFunctionData('getStatus', [userAddr]);
  const data2 = iface.encodeFunctionData('getIdentityHash', [userAddr]);
  
  console.log('=== RAW RPC CALL TEST ===\n');
  
  try {
    const result1 = await provider.call({
      to: contractAddr,
      data: data1
    });
    console.log('getStatus raw result:', result1);
    const decoded1 = iface.decodeFunctionResult('getStatus', result1);
    console.log('getStatus decoded:', decoded1);
  } catch (err) {
    console.error('getStatus call failed:', err.message);
  }
  
  try {
    const result2 = await provider.call({
      to: contractAddr,
      data: data2
    });
    console.log('\ngetIdentityHash raw result:', result2);
    const decoded2 = iface.decodeFunctionResult('getIdentityHash', result2);
    console.log('getIdentityHash decoded:', decoded2);
  } catch (err) {
    console.error('getIdentityHash call failed:', err.message);
  }
  
  // Also try admin() view function to see if ANY view function works
  console.log('\n--- Testing admin() view ---');
  try {
    const contractJson = require('../identity-blockchain/artifacts/contracts/Identity.sol/Identity.json');
    const contract = new ethers.Contract(contractAddr, contractJson.abi, provider);
    const admin = await contract.admin();
    console.log('admin() returned:', admin);
  } catch (err) {
    console.error('admin() failed:', err.message);
  }
}

main().catch(console.error);

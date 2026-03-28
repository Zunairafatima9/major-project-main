const ABI = require('../identity-blockchain/artifacts/contracts/Identity.sol/Identity.json');

const functions = ['getStatus', 'verifyIdentity', 'adminRegisterIdentity', 'registerIdentity', 'getIdentityHash'];
console.log('\n=== CONTRACT ABI ANALYSIS ===\n');

functions.forEach(fname => {
  const method = ABI.abi.find(x => x.name === fname);
  if (method) {
    console.log(`✅ ${fname}`);
    console.log(`   Type: ${method.type}`);
    console.log(`   Inputs: ${method.inputs ? method.inputs.map(i => i.type).join(', ') : 'none'}`);
    console.log(`   Outputs: ${method.outputs ? method.outputs.map(o => o.type).join(', ') : 'none'}`);
  } else {
    console.log(`❌ ${fname} - NOT FOUND`);
  }
});

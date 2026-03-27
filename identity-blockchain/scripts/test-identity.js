// scripts/test-identity.js
const { ethers } = require("hardhat");

async function main() {
  const contractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";

  const Identity = await ethers.getContractFactory("Identity");
  const identity = await Identity.attach(contractAddress);

  const [admin, user] = await ethers.getSigners();

  console.log("Admin address:", admin.address);
  console.log("Testing with user:", user.address);

  // 1. Register Identity (as user)
  console.log("\nRegistering identity...");
  const tx1 = await identity.connect(user).registerIdentity("ipfs://QmYourIdentityHash123456789");
  await tx1.wait();
  console.log("✅ Identity registered!");

  // 2. Verify as Admin
  console.log("\nVerifying identity as admin...");
  const tx2 = await identity.connect(admin).verifyIdentity(user.address);
  await tx2.wait();
  console.log("✅ Identity verified!");

  // 3. Check status
  const status = await identity.getStatus(user.address);
  console.log("\nVerification status:", status);

  const hash = await identity.getIdentityHash(user.address);
  console.log("Identity hash:", hash);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
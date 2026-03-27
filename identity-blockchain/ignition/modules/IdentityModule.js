// ignition/modules/IdentityModule.js

import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const IdentityModule = buildModule("IdentityModule", (m) => {
  
  const identity = m.contract("Identity");

  return { identity };
});

export default IdentityModule;
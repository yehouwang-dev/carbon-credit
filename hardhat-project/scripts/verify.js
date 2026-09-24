const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function verify(name, address, constructorArguments) {
  try {
    await hre.run("verify:verify", { address, constructorArguments });
    console.log(`✓ ${name} verified: ${address}`);
  } catch (error) {
    const message = error?.message || String(error);
    if (message.toLowerCase().includes("already verified")) {
      console.log(`✓ ${name} was already verified: ${address}`);
      return;
    }
    throw error;
  }
}

async function main() {
  const manifestPath = path.resolve(__dirname, "../../fronted/src/contracts/deployment.json");
  const deployment = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  if (deployment.chainId !== 11155111) {
    throw new Error("The current deployment manifest is not for Sepolia.");
  }

  const c = deployment.contracts;
  await verify("CarbonCredit", c.CarbonCredit, [hre.ethers.parseUnits("1000000", 18)]);
  await verify("CarbonCreditNFT", c.CarbonCreditNFT, [10000]);
  await verify("CarbonMultiSig", c.CarbonMultiSig, []);
  await verify("CarbonTimeLock", c.CarbonTimeLock, []);
  await verify("CarbonCreditVault", c.CarbonCreditVault, [c.CarbonCredit, c.CarbonCreditNFT]);
  await verify("CarbonCreditTreasury", c.CarbonCreditTreasury, [c.CarbonCredit]);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

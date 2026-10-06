const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function deploy(name, args = []) {
  const Factory = await hre.ethers.getContractFactory(name);
  const contract = await Factory.deploy(...args);
  await contract.waitForDeployment();
  const address = await contract.getAddress();
  console.log(`  ✓ ${name}: ${address}`);
  return contract;
}

async function main() {
  const network = await hre.ethers.provider.getNetwork();
  const isLocalNetwork = network.chainId === 31337n || network.chainId === 1337n;
  const isSepolia = network.chainId === 11155111n;

  if (!isLocalNetwork && !isSepolia) {
    throw new Error(`Unsupported chain ${network.chainId}. Deployment is limited to localhost and Sepolia.`);
  }
  if (isSepolia && !/^0x[a-fA-F0-9]{64}$/.test(process.env.PRIVATE_KEY || "")) {
    throw new Error("A valid dedicated Sepolia test-wallet PRIVATE_KEY is required. Never use a wallet holding real assets.");
  }

  const [deployer] = await hre.ethers.getSigners();
  if (!deployer) throw new Error("No deployer account is configured for this network.");
  const deploymentBlock = await hre.ethers.provider.getBlockNumber();
  const maxSupply = hre.ethers.parseUnits("1000000", 18);

  console.log(`\nDeploying Carbon Credit Platform to chain ${network.chainId}...`);
  console.log("Deployer:", deployer.address);

  const carbonCredit = await deploy("CarbonCredit", [maxSupply]);
  const carbonCreditNFT = await deploy("CarbonCreditNFT", [10000]);
  const carbonMultiSig = await deploy("CarbonMultiSig");
  const carbonTimeLock = await deploy("CarbonTimeLock");
  const carbonCreditVault = await deploy("CarbonCreditVault", [
    await carbonCredit.getAddress(),
    await carbonCreditNFT.getAddress(),
  ]);
  const carbonCreditTreasury = await deploy("CarbonCreditTreasury", [
    await carbonCredit.getAddress(),
  ]);
  await (await carbonCredit.setProjectRegistry(await carbonCreditNFT.getAddress())).wait();
  console.log("  ✓ CarbonCredit linked to the verified project registry");

  const seedSepoliaDemo = isSepolia && process.env.SEED_SEPOLIA_DEMO === "true";
  if (isLocalNetwork || seedSepoliaDemo) {
    console.log(`\nSeeding ${isSepolia ? "Sepolia testnet" : "local"} demo data...`);
    await (await carbonCredit.mint(
      await carbonCreditVault.getAddress(),
      hre.ethers.parseUnits("100000", 18),
      "Local vault liquidity"
    )).wait();
    await (await carbonCreditNFT.submitProject(
      "Hainan Solar Demonstration",
      "Solar",
      2000000,
      "Hainan, China",
      "Demo Verifier",
      "VCS",
      "2026",
      "ipfs://demo-audit-document",
      "ipfs://demo-carbon-project"
    )).wait();
    await (await carbonCreditNFT.reviewApplication(1, true, "Demo project verified")).wait();
    await (await carbonCreditVault.setCollateralValue(
      1,
      hre.ethers.parseUnits("10000", 18)
    )).wait();
    await (await carbonCredit.mintFromProject(
      1,
      deployer.address,
      hre.ethers.parseUnits("10000", 18),
      "Hainan Solar 2026 issuance"
    )).wait();
    console.log("  ✓ Approved sample application, 10,000 project-linked CC, and vault liquidity created");
  }

  const deployment = {
    chainId: Number(network.chainId),
    network: hre.network.name,
    deployedAt: new Date().toISOString(),
    deploymentBlock,
    deployer: deployer.address,
    contracts: {
      CarbonCredit: await carbonCredit.getAddress(),
      CarbonCreditNFT: await carbonCreditNFT.getAddress(),
      CarbonMultiSig: await carbonMultiSig.getAddress(),
      CarbonTimeLock: await carbonTimeLock.getAddress(),
      CarbonCreditVault: await carbonCreditVault.getAddress(),
      CarbonCreditTreasury: await carbonCreditTreasury.getAddress(),
    },
  };

  const outputDir = path.resolve(__dirname, "../../fronted/src/contracts");
  const manifestName = isSepolia ? "deployment.sepolia.json" : "deployment.json";
  fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(
    path.join(outputDir, manifestName),
    `${JSON.stringify(deployment, null, 2)}\n`
  );
  console.log(`\nDeployment manifest written to fronted/src/contracts/${manifestName}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

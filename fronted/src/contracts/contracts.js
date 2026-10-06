import { ethers } from 'ethers';
import localDeployment from './deployment.json';
import sepoliaDeployment from './deployment.sepolia.json';

const selectedNetwork = import.meta.env.VITE_NETWORK || 'local';
const deployments = {
  local: localDeployment,
  sepolia: sepoliaDeployment,
};

if (!Object.prototype.hasOwnProperty.call(deployments, selectedNetwork)) {
  throw new Error(`Unsupported VITE_NETWORK "${selectedNetwork}". Use "local" or "sepolia".`);
}

export const deployment = deployments[selectedNetwork];
export const isDeploymentConfigured = Object.values(deployment.contracts).every(
  (address) => ethers.utils.isAddress(address) && address !== ethers.constants.AddressZero
);

export const CONTRACT_ABIS = {
  CarbonCredit: [
    'function owner() view returns (address)',
    'function balanceOf(address) view returns (uint256)',
    'function totalSupply() view returns (uint256)',
    'function totalMinted() view returns (uint256)',
    'function totalBurned() view returns (uint256)',
    'function maxTotalSupply() view returns (uint256)',
    'function issuers(address) view returns (bool)',
    'function setIssuer(address,bool)',
    'function projectIssued(uint256) view returns (uint256)',
    'function projectRetired(uint256) view returns (uint256)',
    'function remainingProjectCapacity(uint256) view returns (uint256)',
    'function mint(address,uint256,string)',
    'function mintFromProject(uint256,address,uint256,string)',
    'function pause()',
    'function unpause()',
    'function paused() view returns (bool)',
    'function transfer(address,uint256) returns (bool)',
    'function burnCarbonCredits(uint256,string)',
    'function retireFromProject(uint256,uint256,string,string) returns (bytes32)',
    'function getRetirement(bytes32) view returns (tuple(bytes32 certificateId,address account,string beneficiary,uint256 projectTokenId,uint256 amount,string reason,uint256 timestamp))',
    'function approve(address,uint256) returns (bool)',
    'event CarbonBurned(address indexed from,uint256 amount,string reason,uint256 timestamp)',
    'event CarbonMinted(address indexed to,uint256 amount,string reason,uint256 timestamp)',
    'event CarbonRetired(bytes32 indexed certificateId,address indexed account,uint256 indexed projectTokenId,uint256 amount,string beneficiary,string reason,uint256 timestamp)',
  ],
  CarbonCreditNFT: [
    'function owner() view returns (address)',
    'function balanceOf(address) view returns (uint256)',
    'function ownerOf(uint256) view returns (address)',
    'function reviewers(address) view returns (bool)',
    'function setReviewer(address,bool)',
    'function projectCount() view returns (uint256)',
    'function applicationCount() view returns (uint256)',
    'function getProject(uint256) view returns (tuple(uint256 tokenId,address creator,string projectName,string projectType,uint256 emissionReduction,string location,string verifier,string auditCycle,bool isActive,uint256 createdAt,uint256 applicationId,string standard,string vintage,string documentHash))',
    'function getApplication(uint256) view returns (tuple(uint256 applicationId,address applicant,string projectName,string projectType,uint256 emissionReduction,string location,string verifier,string standard,string vintage,string documentHash,string metadataURI,uint8 status,string reviewReason,uint256 submittedAt,uint256 reviewedAt,uint256 tokenId))',
    'function submitProject(string,string,uint256,string,string,string,string,string,string) returns (uint256)',
    'function reviewApplication(uint256,bool,string) returns (uint256)',
    'function mintProject(address,string,string,uint256,string,string,string,string) returns (uint256)',
    'function approve(address,uint256)',
    'function pause()',
    'function unpause()',
    'function paused() view returns (bool)',
  ],
  CarbonCreditVault: [
    'function stakeNFT(uint256,uint256)',
    'function unstakeNFT(uint256)',
    'function repayLoan(uint256,uint256)',
    'function getUserStakes(address) view returns (tuple(address staker,uint256 tokenId,uint256 ccLocked,uint256 stakeTime,bool isLiquidated)[])',
    'function activeStakes(uint256) view returns (bool)',
    'function totalStaked() view returns (uint256)',
    'function collateralValueCC(uint256) view returns (uint256)',
    'function maxLoanFor(uint256) view returns (uint256)',
    'function loanDueAt(uint256) view returns (uint256)',
    'function setCollateralValue(uint256,uint256)',
    'function paused() view returns (bool)',
    'function pauseNewStakes()',
    'function resumeNewStakes()',
  ],
  CarbonCreditTreasury: [
    'function getBalance() view returns (uint256)',
  ],
  CarbonMultiSig: [
    'function totalSigners() view returns (uint256)',
    'function requiredConfirmations() view returns (uint256)',
  ],
  CarbonTimeLock: [
    'function LOCK_DURATION() view returns (uint256)',
    'function operationCounter() view returns (uint256)',
  ],
};

export function createContracts(signerOrProvider) {
  if (!isDeploymentConfigured) {
    throw new Error(`Contract addresses are not configured for ${deployment.network}.`);
  }
  return Object.fromEntries(
    Object.entries(deployment.contracts).map(([name, address]) => [
      name,
      new ethers.Contract(address, CONTRACT_ABIS[name], signerOrProvider),
    ])
  );
}

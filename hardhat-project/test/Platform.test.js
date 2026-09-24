const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Carbon Credit Platform contracts", function () {
  let owner, user, signer2, recipient;
  let token, nft, vault, treasury, multiSig, timeLock;

  beforeEach(async function () {
    [owner, user, signer2, recipient] = await ethers.getSigners();
    token = await (await ethers.getContractFactory("CarbonCredit")).deploy(
      ethers.parseUnits("1000000")
    );
    nft = await (await ethers.getContractFactory("CarbonCreditNFT")).deploy(100);
    vault = await (await ethers.getContractFactory("CarbonCreditVault")).deploy(
      await token.getAddress(),
      await nft.getAddress()
    );
    treasury = await (await ethers.getContractFactory("CarbonCreditTreasury")).deploy(
      await token.getAddress()
    );
    multiSig = await (await ethers.getContractFactory("CarbonMultiSig")).deploy();
    timeLock = await (await ethers.getContractFactory("CarbonTimeLock")).deploy();
  });

  async function mintProject(to = user.address) {
    await nft.mintProject(
      to,
      "Solar A",
      "Solar",
      10000,
      "Macao",
      "VCS",
      "2026",
      "ipfs://project-a"
    );
  }

  describe("CarbonCreditNFT", function () {
    it("creates, updates, and deactivates a verified project", async function () {
      await mintProject();
      expect(await nft.ownerOf(1)).to.equal(user.address);
      expect(await nft.projectCount()).to.equal(1);
      await nft.updateProject(1, "location", "Hainan");
      await nft.updateEmissionReduction(1, 12000);
      let project = await nft.getProject(1);
      expect(project.location).to.equal("Hainan");
      expect(project.emissionReduction).to.equal(12000);
      await nft.deactivateProject(1);
      project = await nft.getProject(1);
      expect(project.isActive).to.equal(false);
    });

    it("rejects invalid projects and non-owner minting", async function () {
      await expect(
        nft.connect(user).mintProject(user.address, "A", "Solar", 1, "Macao", "VCS", "2026", "x")
      ).to.be.reverted;
      await expect(
        nft.mintProject(user.address, "A", "Solar", 0, "Macao", "VCS", "2026", "x")
      ).to.be.revertedWith("Reduction must be greater than zero");
    });

    it("supports submission, reviewer approval, and NFT issuance", async function () {
      await nft.connect(user).submitProject(
        "Forest B", "Forestry", 50000, "Guangdong", "Gold Standard",
        "Gold Standard", "2026", "ipfs://audit", "ipfs://metadata"
      );
      const pending = await nft.getApplication(1);
      expect(pending.applicant).to.equal(user.address);
      expect(pending.status).to.equal(0);

      await nft.reviewApplication(1, true, "Documents verified");
      const reviewed = await nft.getApplication(1);
      expect(reviewed.status).to.equal(1);
      expect(reviewed.tokenId).to.equal(1);
      expect(await nft.ownerOf(1)).to.equal(user.address);
    });

    it("prevents ordinary users from reviewing applications", async function () {
      await nft.connect(user).submitProject(
        "Forest B", "Forestry", 50000, "Guangdong", "VCS",
        "VCS", "2026", "ipfs://audit", "ipfs://metadata"
      );
      await expect(nft.connect(user).reviewApplication(1, true, "Self approval"))
        .to.be.revertedWith("Not a reviewer");
    });

    it("lets the administrator grant and revoke reviewer access", async function () {
      await nft.setReviewer(signer2.address, true);
      expect(await nft.reviewers(signer2.address)).to.equal(true);
      await nft.setReviewer(signer2.address, false);
      expect(await nft.reviewers(signer2.address)).to.equal(false);
    });
  });

  describe("Project-linked issuance and retirement", function () {
    beforeEach(async function () {
      await token.setProjectRegistry(await nft.getAddress());
      await mintProject(user.address);
    });

    it("enforces the verified project issuance cap", async function () {
      const projectCap = ethers.parseUnits("100"); // 10,000 / 100 = 100 tCO2e.
      await token.mintFromProject(1, user.address, projectCap, "Project issuance");
      expect(await token.projectIssued(1)).to.equal(projectCap);
      await expect(token.mintFromProject(1, user.address, 1, "Over issue"))
        .to.be.revertedWith("CarbonCredit: project cap exceeded");
    });

    it("creates a verifiable retirement certificate", async function () {
      const issued = ethers.parseUnits("50");
      const retired = ethers.parseUnits("10");
      await token.mintFromProject(1, user.address, issued, "Project issuance");
      const tx = await token.connect(user).retireFromProject(1, retired, "Macao Green Ltd", "2026 operations");
      const receipt = await tx.wait();
      const event = receipt.logs.map((log) => {
        try { return token.interface.parseLog(log); } catch { return null; }
      }).find((item) => item?.name === "CarbonRetired");
      const record = await token.getRetirement(event.args.certificateId);
      expect(record.account).to.equal(user.address);
      expect(record.beneficiary).to.equal("Macao Green Ltd");
      expect(record.projectTokenId).to.equal(1);
      expect(record.amount).to.equal(retired);
    });

    it("lets the administrator delegate project issuance", async function () {
      await token.setIssuer(signer2.address, true);
      await token.connect(signer2).mintFromProject(1, user.address, ethers.parseUnits("1"), "Delegated issuance");
      expect(await token.balanceOf(user.address)).to.equal(ethers.parseUnits("1"));
      await token.setIssuer(signer2.address, false);
      await expect(token.connect(signer2).mintFromProject(1, user.address, 1, "Revoked"))
        .to.be.revertedWith("CarbonCredit: not an issuer");
    });
  });

  describe("CarbonCreditTreasury", function () {
    it("accepts approved CC and transfers an allocation", async function () {
      const amount = ethers.parseUnits("1000");
      await token.mint(user.address, amount, "Treasury funding");
      await token.connect(user).approve(await treasury.getAddress(), amount);
      await treasury.connect(user).fundTreasuryWithTokens(amount);
      expect(await treasury.getBalance()).to.equal(amount);

      const allocation = ethers.parseUnits("250");
      await treasury.allocate(recipient.address, allocation, "Project grant");
      expect(await token.balanceOf(recipient.address)).to.equal(allocation);
      expect(await treasury.getBalance()).to.equal(amount - allocation);
      expect((await treasury.getAllocation(0)).executed).to.equal(true);
    });
  });

  describe("CarbonCreditVault", function () {
    it("supports stake, partial repayment, and unstake", async function () {
      await mintProject();
      await vault.setCollateralValue(1, ethers.parseUnits("10000"));
      const liquidity = ethers.parseUnits("10000");
      const loan = ethers.parseUnits("1000");
      await token.mint(await vault.getAddress(), liquidity, "Vault liquidity");
      await nft.connect(user).approve(await vault.getAddress(), 1);
      await vault.connect(user).stakeNFT(1, loan);
      expect(await nft.ownerOf(1)).to.equal(await vault.getAddress());
      expect(await token.balanceOf(user.address)).to.equal(loan);
      expect((await vault.getStakeStatus(1)).staker).to.equal(user.address);

      const partial = ethers.parseUnits("400");
      await token.connect(user).approve(await vault.getAddress(), loan);
      await vault.connect(user).repayLoan(1, partial);
      expect((await vault.stakes(1)).ccLocked).to.equal(loan - partial);
      await vault.connect(user).unstakeNFT(1);
      expect(await nft.ownerOf(1)).to.equal(user.address);
      expect((await vault.getStakeStatus(1)).isActive).to.equal(false);
    });

    it("prevents another user from repaying or unstaking", async function () {
      await mintProject();
      await vault.setCollateralValue(1, ethers.parseUnits("10000"));
      await token.mint(await vault.getAddress(), ethers.parseUnits("10000"), "Liquidity");
      await nft.connect(user).approve(await vault.getAddress(), 1);
      await vault.connect(user).stakeNFT(1, ethers.parseUnits("100"));
      await expect(vault.connect(recipient).unstakeNFT(1)).to.be.revertedWith("Not stake owner");
    });

    it("allows liquidation only after the loan duration", async function () {
      await mintProject();
      await vault.setCollateralValue(1, ethers.parseUnits("10000"));
      await token.mint(await vault.getAddress(), ethers.parseUnits("10000"), "Liquidity");
      await nft.connect(user).approve(await vault.getAddress(), 1);
      await vault.connect(user).stakeNFT(1, ethers.parseUnits("100"));
      await expect(vault.liquidate(user.address, 1)).to.be.revertedWith("Loan not overdue");
      await ethers.provider.send("evm_increaseTime", [30 * 24 * 60 * 60 + 1]);
      await ethers.provider.send("evm_mine", []);
      await vault.liquidate(user.address, 1);
      expect(await nft.ownerOf(1)).to.equal(owner.address);
    });
  });

  describe("CarbonMultiSig", function () {
    it("executes an owner call after two confirmations", async function () {
      await multiSig.addSigner(signer2.address);
      await multiSig.setRequiredConfirmations(2);
      await token.transferOwnership(await multiSig.getAddress());
      const data = token.interface.encodeFunctionData("mint", [
        recipient.address,
        ethers.parseUnits("10"),
        "Multisig mint",
      ]);
      await multiSig.propose(await token.getAddress(), 0, data, "Mint 10 CC");
      await multiSig.connect(signer2).confirm(1);
      expect(await token.balanceOf(recipient.address)).to.equal(ethers.parseUnits("10"));
    });

    it("does not allow a zero confirmation threshold", async function () {
      await expect(multiSig.setRequiredConfirmations(0)).to.be.revertedWith(
        "At least one confirmation required"
      );
    });
  });

  describe("CarbonTimeLock", function () {
    it("delays a contract call for 48 hours", async function () {
      await token.transferOwnership(await timeLock.getAddress());
      const data = token.interface.encodeFunctionData("mint", [
        recipient.address,
        ethers.parseUnits("5"),
        "Delayed mint",
      ]);
      await timeLock.scheduleOperation(await token.getAddress(), data, "Mint after review");
      await expect(timeLock.executeOperation(1)).to.be.revertedWith("Lock period not expired");
      await ethers.provider.send("evm_increaseTime", [48 * 60 * 60 + 1]);
      await ethers.provider.send("evm_mine", []);
      await timeLock.executeOperation(1);
      expect(await token.balanceOf(recipient.address)).to.equal(ethers.parseUnits("5"));
    });
  });
});

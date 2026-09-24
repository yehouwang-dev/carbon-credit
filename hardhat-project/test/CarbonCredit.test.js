const { expect } = require("chai");
const { ethers } = require("hardhat");
require("@nomicfoundation/hardhat-chai-matchers");

describe("CarbonCredit", function () {
  let carbonCredit, owner, addr1, addr2;

  // ─── 前置条件：每次测试前重新部署合约 ──────────────────────────
  beforeEach(async function () {
    // 【通用】获取三个测试账户
    [owner, addr1, addr2] = await ethers.getSigners();

    // 【通用】使用 100 万吨作为最大铸造上限（1000000 * 10^18）
    const maxSupply = ethers.parseUnits("1000000");

    const Factory = await ethers.getContractFactory("CarbonCredit");
    carbonCredit = await Factory.deploy(maxSupply);
    await carbonCredit.waitForDeployment();
  });

  // ═══════════════════════════════════════════════════════════
  //  1. 通用代币逻辑 —— 名称、符号、精度
  // ═══════════════════════════════════════════════════════════

  describe("Token Basics", function () {
    it("应该正确设置代币名称", async function () {
      expect(await carbonCredit.name()).to.equal("CarbonCredit");  // 【通用】ERC-20 name()
    });

    it("应该正确设置代币符号", async function () {
      expect(await carbonCredit.symbol()).to.equal("CC");          // 【通用】ERC-20 symbol()
    });

    it("应该返回正确的总供应量", async function () {
      const totalSupply = await carbonCredit.totalSupply();
      expect(Number(totalSupply)).to.equal(0);                     // 【通用】初始供应为 0
    });
  });

  // ═══════════════════════════════════════════════════════════
  //  2. 碳信用业务逻辑 —— 仅管理员可铸造
  // ═══════════════════════════════════════════════════════════

  describe("Minting (Owner Only)", function () {
    it("管理员铸造后，接收地址余额正确", async function () {
      const amount = ethers.parseUnits("100");   // 100 吨碳信用
      await carbonCredit.connect(owner).mint(addr1.address, amount, "风电项目-A");

      const balance = await carbonCredit.balanceOf(addr1.address);
      expect(balance).to.equal(amount);                                          // 【通用】余额匹配
    });

    it("铸造后 totalMinted 递增", async function () {
      await carbonCredit.connect(owner).mint(addr1.address, ethers.parseUnits("50"), "光伏项目-B");
      expect(await carbonCredit.totalMinted()).to.equal(ethers.parseUnits("50")); // 【碳信】累计铸造统计
    });

    it("铸造后 remainingMintCapacity 递减", async function () {
      const supplyCap = await carbonCredit.maxTotalSupply();
      await carbonCredit.connect(owner).mint(addr1.address, ethers.parseUnits("200"), "水电项目-C");
      expect(await carbonCredit.remainingMintCapacity()).to.equal(supplyCap - ethers.parseUnits("200")); // 【碳信】剩余配额
    });

    it("非管理员调用 mint 应被拒绝", async function () {
      await expect(
        carbonCredit.connect(addr1).mint(addr2.address, ethers.parseUnits("10"), "非法铸造")
      ).to.be.reverted;                                                              // 【通用】权限校验
    });

    it("向零地址铸造应被拒绝", async function () {
      const ZERO_ADDR = ethers.ZeroAddress;   // 【通用】ethers v6 获取零地址常量
      await expect(
        carbonCredit.mint(ZERO_ADDR, ethers.parseUnits("10"), "无效地址")
      ).to.be.revertedWith("CarbonCredit: mint to the zero address");            // 【通用】防零地址
    });

    it("铸造 0 数量应被拒绝", async function () {
      await expect(
        carbonCredit.mint(addr1.address, 0, "空铸造")
      ).to.be.revertedWith("CarbonCredit: amount must be greater than 0");       // 【通用】数量校验
    });
  });

  // ═══════════════════════════════════════════════════════════
  //  3. 碳信用业务逻辑 —— 总量上限校验
  // ═══════════════════════════════════════════════════════════

  describe("Max Supply Cap", function () {
    it("累计铸造不应超过全局上限", async function () {
      const cap = await carbonCredit.maxTotalSupply();     // 1000000
      const half = ethers.parseUnits("600000");            // 分两次铸造 60万 + 60万 = 120万 > 100万

      await carbonCredit.connect(owner).mint(addr1.address, half, "项目1");
      await expect(
        carbonCredit.connect(owner).mint(addr2.address, half, "项目2")
      ).to.be.revertedWith("CarbonCredit: exceeded max mint cap");                 // 【碳信业务】超上限拦截
    });

    it("刚好等于上限的铸造应成功", async function () {
      const cap = await carbonCredit.maxTotalSupply();                               // 【碳信业务】边界值测试
      await carbonCredit.connect(owner).mint(addr1.address, cap, "满额铸造");
      expect(await carbonCredit.totalMinted()).to.equal(cap);
    });

    it("调整上限后，可以铸造更多", async function () {
      const cap = await carbonCredit.maxTotalSupply();
      const half = ethers.parseUnits("600000");
      await carbonCredit.connect(owner).mint(addr1.address, half, "初始60万");

      const newMax = ethers.parseUnits("800000");                                   // 【碳信业务】扩容到80万
      await carbonCredit.updateMaxSupply(newMax);
      expect(await carbonCredit.maxTotalSupply()).to.equal(newMax);

      const validExtra = ethers.parseUnits("199999");                               // 60万 + 199999 < 80万
      await carbonCredit.connect(owner).mint(addr2.address, validExtra, "合规追加");
      expect(await carbonCredit.totalMinted()).to.equal(half + validExtra);         // 【碳信业务】验证总量正确
    });

    it("非管理员不能调整上限", async function () {
      await expect(
        carbonCredit.connect(addr1).updateMaxSupply(999)
      ).to.be.reverted;                                                             // 【通用】权限校验
    });
  });

  // ═══════════════════════════════════════════════════════════
  //  4. 碳信用业务逻辑 —— 用户销毁核销
  // ═══════════════════════════════════════════════════════════

  describe("Burn (User Carbon Credit Write-off)", function () {
    it("用户在获得代币后可以正常销毁", async function () {
      const amount = ethers.parseUnits("100");
      await carbonCredit.connect(owner).mint(addr1.address, amount, "先铸造100吨");

      const reason = "企业排放核销-2025";
      await carbonCredit.connect(addr1).burnCarbonCredits(amount, reason);

      // 【通用】销毁后余额归零
      expect(await carbonCredit.balanceOf(addr1.address)).to.equal(0);

      // 【碳信业务】累计销毁量增加
      expect(await carbonCredit.totalBurned()).to.equal(amount);                  // 【碳信】统计正确
    });

    it("销毁数量不能超过余额", async function () {
      await carbonCredit.connect(owner).mint(addr1.address, ethers.parseUnits("50"), "铸50吨");
      await expect(
        carbonCredit.connect(addr1).burnCarbonCredits(ethers.parseUnits("100"), "超额销毁")
      ).to.be.revertedWith("CarbonCredit: burn amount exceeds balance");          // 【通用】余额不足
    });

    it("销毁 0 数量应被拒绝", async function () {
      await expect(
        carbonCredit.connect(addr1).burnCarbonCredits(0, "空销毁")
      ).to.be.revertedWith("CarbonCredit: amount must be greater than 0");        // 【通用】数量校验
    });

    it("没有余额的用户也应被拒绝", async function () {
      await expect(
        carbonCredit.connect(addr2).burnCarbonCredits(ethers.parseUnits("1"), "零余额销毁")
      ).to.be.revertedWith("CarbonCredit: burn amount exceeds balance");           // 【通用】
    });
  });

  // ═══════════════════════════════════════════════════════════
  //  5. 完整业务流程集成测试
  // ═══════════════════════════════════════════════════════════

  describe("Integration: Mint → Transfer → Burn Flow", function () {
    it("管理员铸造 → 转账给用户 → 用户核销销毁 完整流程", async function () {
      // 1. 管理员铸造 1000 吨碳信用给 addr1
      const mintAmount = ethers.parseUnits("1000");
      await carbonCredit.connect(owner).mint(addr1.address, mintAmount, "风电项目-Phase1");

      expect(await carbonCredit.balanceOf(addr1.address)).to.equal(mintAmount);    // 【通用】余额确认
      expect(await carbonCredit.totalMinted()).to.equal(mintAmount);                // 【碳信】铸造统计

      // 2. addr1 转账 200 吨给 addr2
      const transferAmount = ethers.parseUnits("200");
      await carbonCredit.connect(addr1).transfer(addr2.address, transferAmount);   // 【通用】标准转账

      expect(await carbonCredit.balanceOf(addr1.address)).to.equal(mintAmount - transferAmount);  // 【通用】转出方余额
      expect(await carbonCredit.balanceOf(addr2.address)).to.equal(transferAmount);               // 【通用】转入方余额

      // 3. addr1 销毁其全部余额用于核销
      const burnAmount = mintAmount - transferAmount;
      await carbonCredit.connect(addr1).burnCarbonCredits(burnAmount, "年度排放核销-钢铁厂A");

      expect(await carbonCredit.balanceOf(addr1.address)).to.equal(0);             // 【通用】已清零
      expect(await carbonCredit.totalBurned()).to.equal(burnAmount);                // 【碳信】销毁统计

      // 4. 全局状态校验
      expect(await carbonCredit.totalMinted()).to.equal(mintAmount);                // 【碳信】铸造量不变
      expect(await carbonCredit.balanceOf(addr2.address)).to.equal(transferAmount); // 【通用】addr2 仍有200吨
    });
  });
});

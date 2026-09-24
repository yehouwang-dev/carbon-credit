// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title CarbonCreditTreasury
 * @notice 碳信用金库 — 集中管理平台储备代币，用于：
 *         1. 铸造储备（控制发行节奏）
 *         2. 项目补贴/激励
 *         3. 市场稳定性操作
 */
contract CarbonCreditTreasury is Ownable {

    IERC20 public ccToken;

    // ===== 业务参数 =====
    uint256 public treasuryBalance;      // 金库当前余额
    uint256 public maxTreasuryAllocation; // 单次最大分配额度

    // ===== 分配记录 =====
    struct Allocation {
        address recipient;
        uint256 amount;
        string purpose;       // 用途（如"项目补贴-风电场A"）
        uint256 timestamp;
        bool executed;
    }
    Allocation[] public allocations;

    // ===== 事件 =====
    event TreasuryFunded(uint256 amount, address indexed funder);
    event TreasuryAllocated(
        uint256 indexed allocId,
        address indexed recipient,
        uint256 amount,
        string purpose
    );
    event MaxAllocationUpdated(uint256 newMax);

    constructor(address _ccToken) Ownable(msg.sender) {
        ccToken = IERC20(_ccToken);
        maxTreasuryAllocation = 100_000 * 10**18; // 默认上限 10万 CC
    }

    /**
     * @notice 向金库注入 CC 代币
     */
    function fundTreasury() external payable {
        uint256 amount = msg.value;
        require(amount > 0, "Must fund with value");
        treasuryBalance += amount;
        emit TreasuryFunded(amount, msg.sender);
    }

    /**
     * @notice 向金库注入 ERC20 CC 代币
     */
    function fundTreasuryWithTokens(uint256 amount) external {
        require(amount <= treasuryBalance, "Insufficient balance");
        treasuryBalance -= amount;
        require(ccToken.transferFrom(msg.sender, address(this), amount), "Transfer failed");
        emit TreasuryFunded(amount, msg.sender);
    }

    /**
     * @notice 分配 CC 代币（项目补贴/激励）
     */
    function allocate(address recipient, uint256 amount, string calldata purpose) external onlyOwner {
        require(amount <= maxTreasuryAllocation, "Exceeds max allocation");
        require(amount <= treasuryBalance, "Insufficient treasury");
        treasuryBalance -= amount;

        allocations.push(Allocation({
            recipient: recipient,
            amount: amount,
            purpose: purpose,
            timestamp: block.timestamp,
            executed: false
        }));

        emit TreasuryAllocated(allocations.length - 1, recipient, amount, purpose);
    }

    /**
     * @notice 设置单次最大分配额度
     */
    function setMaxAllocation(uint256 newMax) external onlyOwner {
        maxTreasuryAllocation = newMax;
        emit MaxAllocationUpdated(newMax);
    }

    /**
     * @notice 查询金库余额
     */
    function getBalance() external view returns (uint256) {
        return treasuryBalance;
    }

    /**
     * @notice 查询分配记录
     */
    function getAllocation(uint256 allocId) external view returns (Allocation memory) {
        return allocations[allocId];
    }
}

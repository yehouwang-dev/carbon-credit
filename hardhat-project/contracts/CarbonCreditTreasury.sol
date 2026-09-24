// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title CarbonCreditTreasury
 * @notice 碳信用金库 — 集中管理平台储备代币，用于：
 *         1. 铸造储备（控制发行节奏）
 *         2. 项目补贴/激励
 *         3. 市场稳定性操作
 */
contract CarbonCreditTreasury is Ownable {
    using SafeERC20 for IERC20;

    IERC20 public ccToken;

    // ===== 业务参数 =====
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
     * @notice 向金库注入 ERC20 CC 代币
     */
    function fundTreasuryWithTokens(uint256 amount) external {
        require(amount > 0, "Amount must be greater than zero");
        ccToken.safeTransferFrom(msg.sender, address(this), amount);
        emit TreasuryFunded(amount, msg.sender);
    }

    /**
     * @notice 分配 CC 代币（项目补贴/激励）
     */
    function allocate(address recipient, uint256 amount, string calldata purpose) external onlyOwner {
        require(amount <= maxTreasuryAllocation, "Exceeds max allocation");
        require(recipient != address(0), "Invalid recipient");
        require(amount > 0, "Amount must be greater than zero");
        require(amount <= ccToken.balanceOf(address(this)), "Insufficient treasury");

        allocations.push(Allocation({
            recipient: recipient,
            amount: amount,
            purpose: purpose,
            timestamp: block.timestamp,
            executed: true
        }));

        ccToken.safeTransfer(recipient, amount);

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
        return ccToken.balanceOf(address(this));
    }

    /**
     * @notice 查询分配记录
     */
    function getAllocation(uint256 allocId) external view returns (Allocation memory) {
        return allocations[allocId];
    }
}

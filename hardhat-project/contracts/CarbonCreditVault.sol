// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title CarbonCreditVault
 * @notice 碳信用质押金库 — 质押 NFT 获取流动性/收益。
 *         NFT 质押后可抵押获得 CC 代币流动性，支持 DeFi 集成。
 */
contract CarbonCreditVault is Ownable, ReentrancyGuard, Pausable {
    using SafeERC20 for IERC20;

    // ===== 依赖合约 =====
    IERC20 public ccToken;           // CarbonCredit ERC20 代币
    IERC721 public nftCollection;    // CarbonCreditNFT 集合

    // ===== 质押参数 =====
    uint256 public constant LOAN_TO_VALUE = 50;        // 质押率 50%
    uint256 public constant LOAN_DURATION = 30 days;

    // ===== 业务结构体 =====
    struct Stake {
        address staker;
        uint256 tokenId;
        uint256 ccLocked;       // 锁定/借出的 CC 数量
        uint256 stakeTime;
        bool isLiquidated;
    }

    mapping(uint256 => Stake) public stakes;
    mapping(address => uint256[]) private stakeTokenIdsByUser;
    mapping(uint256 => bool) public activeStakes;
    mapping(uint256 => uint256) public collateralValueCC;
    uint256 public totalStaked;
    uint256 public totalLockedCC;

    // ===== 事件 =====
    event NFTStaked(address indexed staker, uint256 indexed tokenId, uint256 ccLocked, uint256 timestamp);
    event NFTUnstaked(address indexed staker, uint256 indexed tokenId, uint256 ccReturned, uint256 timestamp);
    event LoanRepaid(address indexed staker, uint256 indexed tokenId, uint256 amountRepaid, uint256 timestamp);
    event NFTLiquidated(address indexed staker, uint256 indexed tokenId, address indexed liquidator, uint256 timestamp);
    event CollateralValueUpdated(uint256 indexed tokenId, uint256 valueCC);
    event EmergencyPauseUpdated(bool paused);

    constructor(address _ccToken, address _nftCollection) Ownable(msg.sender) {
        require(_ccToken != address(0), "Invalid CC token");
        require(_nftCollection != address(0), "Invalid NFT collection");
        ccToken = IERC20(_ccToken);
        nftCollection = IERC721(_nftCollection);
    }

    /// @notice Administrator records a reviewed collateral value denominated in CC.
    /// @dev This is a manual appraisal, not a live market oracle.
    function setCollateralValue(uint256 tokenId, uint256 valueCC) external onlyOwner {
        nftCollection.ownerOf(tokenId);
        require(!activeStakes[tokenId], "Cannot revalue an active stake");
        require(valueCC > 0, "Value must be greater than zero");
        collateralValueCC[tokenId] = valueCC;
        emit CollateralValueUpdated(tokenId, valueCC);
    }

    function pauseNewStakes() external onlyOwner {
        _pause();
        emit EmergencyPauseUpdated(true);
    }

    function resumeNewStakes() external onlyOwner {
        _unpause();
        emit EmergencyPauseUpdated(false);
    }

    // ==================== 质押操作 ====================

    /**
     * @notice 质押 NFT 并借出 CC 代币
     */
    function stakeNFT(uint256 tokenId, uint256 ccAmount) external nonReentrant whenNotPaused {
        require(!activeStakes[tokenId], "NFT already staked");
        require(nftCollection.ownerOf(tokenId) == msg.sender, "Not NFT owner");
        require(ccAmount > 0, "Loan amount must be greater than zero");
        uint256 maxLoan = _calculateMaxLoan(tokenId);
        require(ccAmount <= maxLoan, "Exceeds max loan");
        require(ccToken.balanceOf(address(this)) >= ccAmount, "Insufficient vault liquidity");

        nftCollection.transferFrom(msg.sender, address(this), tokenId);
        stakes[tokenId] = Stake({
            staker: msg.sender,
            tokenId: tokenId,
            ccLocked: ccAmount,
            stakeTime: block.timestamp,
            isLiquidated: false
        });
        stakeTokenIdsByUser[msg.sender].push(tokenId);
        activeStakes[tokenId] = true;
        totalStaked++;
        totalLockedCC += ccAmount;

        ccToken.safeTransfer(msg.sender, ccAmount);
        emit NFTStaked(msg.sender, tokenId, ccAmount, block.timestamp);
    }

    /**
     * @notice 解押 NFT 并归还 CC 贷款
     */
    function unstakeNFT(uint256 tokenId) external nonReentrant {
        require(activeStakes[tokenId], "NFT not staked");
        Stake storage stake = stakes[tokenId];
        require(stake.staker == msg.sender, "Not stake owner");
        require(!stake.isLiquidated, "NFT already liquidated");

        uint256 repayment = stake.ccLocked;
        if (repayment > 0) {
            ccToken.safeTransferFrom(msg.sender, address(this), repayment);
            totalLockedCC -= repayment;
            stake.ccLocked = 0;
        }

        nftCollection.transferFrom(address(this), msg.sender, tokenId);

        activeStakes[tokenId] = false;
        totalStaked--;

        emit NFTUnstaked(msg.sender, tokenId, repayment, block.timestamp);
    }

    /**
     * @notice 偿还部分贷款
     */
    function repayLoan(uint256 tokenId, uint256 amount) external nonReentrant {
        require(activeStakes[tokenId], "NFT not staked");
        Stake storage stake = stakes[tokenId];
        require(stake.staker == msg.sender, "Not stake owner");
        require(amount > 0, "Amount must be greater than zero");
        require(amount <= stake.ccLocked, "Over repayment");

        ccToken.safeTransferFrom(msg.sender, address(this), amount);
        stake.ccLocked -= amount;
        totalLockedCC -= amount;

        emit LoanRepaid(msg.sender, tokenId, amount, block.timestamp);
    }

    // ==================== 清算（管理员触发） ====================

    /**
     * @notice 清算高风险质押
     */
    function liquidate(address staker, uint256 tokenId) external onlyOwner nonReentrant {
        require(activeStakes[tokenId], "NFT not staked");
        Stake storage stake = stakes[tokenId];
        require(stake.staker == staker, "Invalid staker");
        require(!stake.isLiquidated, "Already liquidated");
        require(stake.ccLocked > 0, "No outstanding loan");
        require(block.timestamp >= stake.stakeTime + LOAN_DURATION, "Loan not overdue");

        nftCollection.transferFrom(address(this), msg.sender, tokenId);
        activeStakes[tokenId] = false;
        stake.isLiquidated = true;
        totalLockedCC -= stake.ccLocked;
        totalStaked--;

        emit NFTLiquidated(staker, tokenId, msg.sender, block.timestamp);
    }

    // ==================== 查询 ====================

    function getUserStakes(address user) external view returns (Stake[] memory) {
        uint256[] storage tokenIds = stakeTokenIdsByUser[user];
        Stake[] memory result = new Stake[](tokenIds.length);
        for (uint256 i = 0; i < tokenIds.length; i++) {
            result[i] = stakes[tokenIds[i]];
        }
        return result;
    }

    function getStakeStatus(uint256 tokenId) external view returns (bool isActive, address staker) {
        return (activeStakes[tokenId], stakes[tokenId].staker);
    }

    // ==================== 内部函数 ====================

    function maxLoanFor(uint256 tokenId) external view returns (uint256) {
        return _calculateMaxLoan(tokenId);
    }

    function loanDueAt(uint256 tokenId) external view returns (uint256) {
        if (!activeStakes[tokenId]) return 0;
        return stakes[tokenId].stakeTime + LOAN_DURATION;
    }

    function _calculateMaxLoan(uint256 tokenId) internal view returns (uint256) {
        return (collateralValueCC[tokenId] * LOAN_TO_VALUE) / 100;
    }
}

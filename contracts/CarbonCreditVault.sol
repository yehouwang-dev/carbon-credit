// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title CarbonCreditVault
 * @notice 碳信用质押金库 — 质押 NFT 获取流动性/收益。
 *         NFT 质押后可抵押获得 CC 代币流动性，支持 DeFi 集成。
 */
contract CarbonCreditVault is Ownable {

    // ===== 依赖合约 =====
    IERC20 public ccToken;           // CarbonCredit ERC20 代币
    IERC721 public nftCollection;    // CarbonCreditNFT 集合

    // ===== 质押参数 =====
    uint256 public constant LOAN_TO_VALUE = 50;        // 质押率 50%
    uint256 public constant LIQUIDATION_THRESHOLD = 30; // 清算阈值

    // ===== 业务结构体 =====
    struct Stake {
        address staker;
        uint256 tokenId;
        uint256 ccLocked;       // 锁定/借出的 CC 数量
        uint256 stakeTime;
        bool isLiquidated;
    }

    mapping(address => Stake[]) public stakesByUser;
    mapping(uint256 => uint256) public tokenToStakeIndex;
    mapping(uint256 => bool) public activeStakes;
    uint256 public totalStaked;
    uint256 public totalLockedCC;

    // ===== 事件 =====
    event NFTStaked(address indexed staker, uint256 indexed tokenId, uint256 ccLocked, uint256 timestamp);
    event NFTUnstaked(address indexed staker, uint256 indexed tokenId, uint256 ccReturned, uint256 timestamp);
    event LoanRepaid(address indexed staker, uint256 indexed tokenId, uint256 amountRepaid, uint256 timestamp);
    event NFTLiquidated(address indexed staker, uint256 indexed tokenId, address indexed liquidator, uint256 timestamp);

    constructor(address _ccToken, address _nftCollection) Ownable(msg.sender) {
        ccToken = IERC20(_ccToken);
        nftCollection = IERC721(_nftCollection);
    }

    // ==================== 质押操作 ====================

    /**
     * @notice 质押 NFT 并借出 CC 代币
     */
    function stakeNFT(uint256 tokenId, uint256 ccAmount) external {
        require(!activeStakes[tokenId], "NFT already staked");
        require(nftCollection.ownerOf(tokenId) == msg.sender, "Not NFT owner");

        nftCollection.transferFrom(msg.sender, address(this), tokenId);

        uint256 maxLoan = _calculateMaxLoan();
        require(ccAmount <= maxLoan, "Exceeds max loan");

        uint256 stakeIndex = stakesByUser[msg.sender].length;
        stakesByUser[msg.sender].push(
            Stake({
                staker: msg.sender,
                tokenId: tokenId,
                ccLocked: ccAmount,
                stakeTime: block.timestamp,
                isLiquidated: false
            })
        );
        tokenToStakeIndex[tokenId] = stakeIndex;
        activeStakes[tokenId] = true;
        totalStaked++;
        totalLockedCC += ccAmount;

        require(ccToken.transfer(msg.sender, ccAmount), "CC transfer failed");
        emit NFTStaked(msg.sender, tokenId, ccAmount, block.timestamp);
    }

    /**
     * @notice 解押 NFT 并归还 CC 贷款
     */
    function unstakeNFT(uint256 tokenId) external {
        require(activeStakes[tokenId], "NFT not staked");

        uint256 stakeIndex = tokenToStakeIndex[tokenId];
        Stake storage stake = stakesByUser[msg.sender][stakeIndex];
        require(!stake.isLiquidated, "NFT already liquidated");

        require(ccToken.transfer(address(this), stake.ccLocked), "CC repayment failed");
        totalLockedCC -= stake.ccLocked;

        nftCollection.transferFrom(address(this), msg.sender, tokenId);

        activeStakes[tokenId] = false;
        stake.isLiquidated = true;
        totalStaked--;

        emit NFTUnstaked(msg.sender, tokenId, stake.ccLocked, block.timestamp);
    }

    /**
     * @notice 偿还部分贷款
     */
    function repayLoan(uint256 tokenId, uint256 amount) external {
        require(activeStakes[tokenId], "NFT not staked");
        uint256 stakeIndex = tokenToStakeIndex[tokenId];
        Stake storage stake = stakesByUser[msg.sender][stakeIndex];
        require(amount <= stake.ccLocked, "Over repayment");

        require(ccToken.transfer(address(this), amount), "Repayment failed");
        stake.ccLocked -= amount;
        totalLockedCC -= amount;

        emit LoanRepaid(msg.sender, tokenId, amount, block.timestamp);
    }

    // ==================== 清算（管理员触发） ====================

    /**
     * @notice 清算高风险质押
     */
    function liquidate(address staker, uint256 tokenId) external onlyOwner {
        require(activeStakes[tokenId], "NFT not staked");
        uint256 stakeIndex = tokenToStakeIndex[tokenId];
        Stake storage stake = stakesByUser[staker][stakeIndex];
        require(!stake.isLiquidated, "Already liquidated");

        uint256 collateralValue = _getCollateralValue();
        uint256 loanRatio = (stake.ccLocked * 100) / (collateralValue > 0 ? collateralValue : 1);
        require(loanRatio >= LIQUIDATION_THRESHOLD, "Not liquidatable");

        nftCollection.transferFrom(address(this), msg.sender, tokenId);
        activeStakes[tokenId] = false;
        stake.isLiquidated = true;
        totalStaked--;

        emit NFTLiquidated(staker, tokenId, msg.sender, block.timestamp);
    }

    // ==================== 查询 ====================

    function getUserStakes(address user) external view returns (Stake[] memory) {
        return stakesByUser[user];
    }

    function getStakeStatus(uint256 tokenId) external view returns (bool isActive, address staker) {
        return (activeStakes[tokenId], stakesByUser[address(0)][0].staker);
    }

    // ==================== 内部函数 ====================

    function _calculateMaxLoan() internal pure returns (uint256) {
        uint256 collateralValue = _getCollateralValue();
        return (collateralValue * LOAN_TO_VALUE) / 100;
    }

    function _getCollateralValue() internal pure returns (uint256) {
        // 简化：固定估值 10000 CC/NFT（实际应接预言机）
        return 10000 * 10**18;
    }
}

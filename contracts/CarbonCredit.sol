// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title CarbonCredit
 * @notice 碳信用平台专用 ERC-20 代币合约。
 *         仅管理员（owner）可铸造，用户可自行销毁以核销碳排放配额。
 */
contract CarbonCredit is ERC20, Ownable {

    // ===== 通用代币参数 =====

    /// @notice 代币名称：CarbonCredit
    string private constant _TOKEN_NAME = "CarbonCredit";

    /// @notice 代币符号：CC
    string private constant _TOKEN_SYMBOL = "CC";

    /// @notice 代币精度（18 位，与 ETH 一致）
    uint8 private constant _DECIMALS = 18;

    // ===== 碳信用业务参数 =====

    /// @notice 全局最大可铸造总量（单位：基础数量，即 1e18 进制的完整代币数）
    ///         例如设为 1_000_000 * 10^18 代表最多发行 100 万吨碳信用
    uint256 public maxTotalSupply;

    // ===== 状态变量 =====

    /// @notice 当前累计铸造量（链上已铸造的总量，不扣除销毁部分）
    uint256 private _mintedAmount;

    /// @notice 当前销毁总量
    uint256 private _burnedAmount;

    // ===== 事件 =====

    /**
     * @notice 仅在 owner 铸造时触发，记录铸造原因（业务来源描述）
     */
    event CarbonMinted(
        address indexed to,
        uint256 amount,
        string reason,   // 例如："CCER项目-华北风电场-2025Q4"
        uint256 timestamp
    );

    /**
     * @notice 用户销毁代币核销碳排放时触发
     */
    event CarbonBurned(
        address indexed from,
        uint256 amount,
        string reason,   // 例如："企业年度排放核销-广东钢铁厂"
        uint256 timestamp
    );

    /**
     * @notice owner 重置最大铸造上限时触发
     */
    event MaxSupplyUpdated(uint256 newMaxSupply);

    // ===== 构造函数 =====

    /**
     * @notice 部署合约并设置初始参数
     * @param _maxSupply 最大可铸造总量（已按 18 位精度换算的绝对值）
     */
    constructor(uint256 _maxSupply)
        ERC20(_TOKEN_NAME, _TOKEN_SYMBOL)  // 【通用】ERC-20 标准初始化
        Ownable(msg.sender)                  // 【通用】部署者自动成为 owner
    {
        require(_maxSupply > 0, "Max supply must be greater than zero"); // 【通用】防御性检查
        maxTotalSupply = _maxSupply;                                    // 【碳信业务】设定最大铸造上限
    }

    // ===== 通用 ERC-20 视图函数（从父合约继承）=====

    /// @notice 返回合约已铸造的总量（不含销毁扣除）
    function totalMinted() external view returns (uint256) {
        return _mintedAmount;
    }

    /// @notice 返回合约累计销毁的总量
    function totalBurned() external view returns (uint256) {
        return _burnedAmount;
    }

    /// @notice 返回剩余可铸造额度
    function remainingMintCapacity() external view returns (uint256) {
        return maxTotalSupply - _mintedAmount;
    }

    // ===== 碳信用业务逻辑：仅管理员可铸造 =====

    /**
     * @notice 铸造碳信用代币（仅 owner 管理员可调用）
     * @param to     接收地址
     * @param amount 铸造数量（基础单位，1 token = 1e18）
     * @param reason 业务原因描述（例如项目名称或来源）
     *
     * 【碳信用业务】只有获得资质的项目方管理员才能铸造对应碳信用的吨数；
     *               每次铸造需记录原因以便后续审计追溯。
     */
    function mint(
        address to,
        uint256 amount,
        string calldata reason
    )
        external
        onlyOwner
    {
        require(to != address(0), "CarbonCredit: mint to the zero address");  // 【通用】防零地址
        require(amount > 0, "CarbonCredit: amount must be greater than 0");   // 【通用】数量须正数
        require(
            _mintedAmount + amount <= maxTotalSupply,                        // 【碳信业务】不超过全局上限
            "CarbonCredit: exceeded max mint cap"
        );

        _mintedAmount += amount;      // 【碳信业务】更新累计铸造计数
        _mint(to, amount);             // 【通用】调用 ERC-20 父类铸造逻辑
        emit CarbonMinted(to, amount, reason, block.timestamp);  // 【碳信业务】emit 可审计事件
    }

    // ===== 碳信用业务逻辑：用户销毁核销 =====

    /**
     * @notice 销毁本人持有的代币用于碳排放核销
     * @param amount 销毁数量
     * @param reason 核销原因（例如年度减排核算）
     *
     * 【碳信用业务】持有者可用积累的碳信用积分抵扣自身碳排放额度，
     *               销毁后代币永久退出流通，实现"核销"目的。
     */
    function burnCarbonCredits(uint256 amount, string calldata reason) external {
        require(amount > 0, "CarbonCredit: amount must be greater than 0");                          // 【通用】
        require(amount <= balanceOf(msg.sender), "CarbonCredit: burn amount exceeds balance");       // 【通用】余额充足

        _burnedAmount += amount;              // 【碳信业务】累计销毁+1
        _burn(msg.sender, amount);             // 【通用】调用 ERC-20 父类销毁逻辑
        emit CarbonBurned(msg.sender, amount, reason, block.timestamp);  // 【碳信业务】emit 可审计事件
    }

    // ===== 管理员辅助操作 =====

    /**
     * @notice 管理员调整最大铸造上限（仅限 owner 调用，用于项目扩容）
     * @param newMaxSupply 新的最大可铸造总量
     */
    function updateMaxSupply(uint256 newMaxSupply) external onlyOwner {
        require(newMaxSupply >= _mintedAmount, "CarbonCredit: new max must cover already minted");
        maxTotalSupply = newMaxSupply;
        emit MaxSupplyUpdated(newMaxSupply);
    }
}

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/**
 * @title CarbonTimeLock
 * @notice 碳信用平台时间锁合约 — 大额铸造/销毁操作设置冷却期。
 *         防止恶意快速操作，给予社区/审计方反应时间。
 */
contract CarbonTimeLock {

    // ===== 通用时间锁参数 =====
    address public owner;
    uint256 public constant LOCK_DURATION = 48 hours;
    uint256 public constant MIN_LOCK_AMOUNT = 10000 * 10**18;

    // ===== 业务结构体 =====
    struct PendingOperation {
        address target;
        bytes data;
        uint256 scheduledAt;
        bool executed;
        string description;
    }

    mapping(uint256 => PendingOperation) public pendingOperations;
    uint256 public operationCounter;
    uint256[] public pendingOps;

    // ===== 白名单：允许跳过的操作类型（function selector）=====
    mapping(bytes4 => bool) public whitelist;

    // ===== 事件 =====
    event OperationScheduled(
        uint256 indexed opId,
        address indexed proposer,
        uint256 scheduledAt,
        string description
    );
    event OperationExecuted(
        uint256 indexed opId,
        address indexed executor,
        bool success
    );
    event WhitelistUpdated(bytes4 selector, bool allowed);

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    // ==================== 白名单管理 ====================

    function addWhitelist(bytes4 selector) external onlyOwner {
        whitelist[selector] = true;
        emit WhitelistUpdated(selector, true);
    }

    function removeWhitelist(bytes4 selector) external onlyOwner {
        whitelist[selector] = false;
        emit WhitelistUpdated(selector, false);
    }

    // ==================== 操作调度 ====================

    function scheduleOperation(
        address target,
        bytes calldata data,
        string calldata description
    ) external onlyOwner returns (uint256) {
        require(target != address(0), "Invalid target");
        require(data.length >= 4, "Invalid call data");
        bytes4 selector = bytes4(data);
        uint256 scheduledAt = whitelist[selector]
            ? block.timestamp
            : block.timestamp + LOCK_DURATION;

        operationCounter++;
        uint256 opId = operationCounter;

        pendingOperations[opId] = PendingOperation({
            target: target,
            data: data,
            scheduledAt: scheduledAt,
            executed: false,
            description: description
        });
        pendingOps.push(opId);

        emit OperationScheduled(opId, msg.sender, scheduledAt, description);
        return opId;
    }

    function executeOperation(uint256 opId) external {
        PendingOperation storage op = pendingOperations[opId];
        require(op.target != address(0), "Operation does not exist");
        require(!op.executed, "Already executed");
        require(block.timestamp >= op.scheduledAt, "Lock period not expired");
        op.executed = true;

        (bool success, ) = op.target.call(op.data);
        require(success, "Operation failed");
        emit OperationExecuted(opId, msg.sender, success);
    }

    // ==================== 查询 ====================

    function remainingTime(uint256 opId) external view returns (uint256) {
        PendingOperation storage op = pendingOperations[opId];
        if (op.executed) return 0;
        if (block.timestamp >= op.scheduledAt) return 0;
        return op.scheduledAt - block.timestamp;
    }

    function getPendingOperations() external view returns (uint256[] memory) {
        uint256 count = 0;
        for (uint256 i = 0; i < pendingOps.length; i++) {
            if (!pendingOperations[pendingOps[i]].executed) count++;
        }
        uint256[] memory result = new uint256[](count);
        uint256 idx = 0;
        for (uint256 i = 0; i < pendingOps.length; i++) {
            if (!pendingOperations[pendingOps[i]].executed) {
                result[idx] = pendingOps[i];
                idx++;
            }
        }
        return result;
    }

    function needsLock(bytes4 selector) external view returns (bool) {
        return !whitelist[selector];
    }
}

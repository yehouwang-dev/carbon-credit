// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/**
 * @title CarbonMultiSig
 * @notice 碳信用平台多签合约 — 关键操作需 N/M 多签审批，防止单点故障。
 *         用于管理 CarbonCredit/CarbonCreditNFT 等合约的管理员权限。
 */
contract CarbonMultiSig {

    // ===== 通用多签参数 =====
    address public owner;
    uint256 public requiredConfirmations;
    uint256 public totalSigners;
    mapping(address => bool) public signers;
    mapping(uint256 => Transaction) public transactions;
    mapping(uint256 => mapping(address => bool)) public confirmations;
    uint256 public transactionCounter;

    // ===== 业务结构体 =====
    struct Transaction {
        address target;
        uint256 value;
        bytes data;
        bool executed;
        uint256 confirmationCount;
        uint256 createdAt;
        address executor;
    }

    // ===== 事件 =====
    event ProposalSubmitted(
        uint256 indexed txId,
        address indexed proposer,
        address target,
        uint256 value,
        string description
    );
    event ProposalConfirmed(
        uint256 indexed txId,
        address indexed confirmer
    );
    event ProposalExecuted(
        uint256 indexed txId,
        address indexed executor,
        bool success
    );
    event SignerAdded(address indexed signer);
    event SignerRemoved(address indexed signer);

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner");
        _;
    }

    modifier onlySigner() {
        require(signers[msg.sender], "Not a signer");
        _;
    }

    constructor() {
        owner = msg.sender;
        signers[msg.sender] = true;
        totalSigners = 1;
        requiredConfirmations = 1;
    }

    receive() external payable {}

    // ==================== 签名者管理 ====================

    function addSigner(address signer) external onlyOwner {
        require(signer != address(0), "Invalid signer");
        require(!signers[signer], "Already a signer");
        signers[signer] = true;
        totalSigners++;
        emit SignerAdded(signer);
    }

    function removeSigner(address signer) external onlyOwner {
        require(signers[signer], "Not a signer");
        require(totalSigners > 2, "Need at least 2 signers");
        require(requiredConfirmations <= totalSigners - 1, "Lower confirmation threshold first");
        signers[signer] = false;
        totalSigners--;
        emit SignerRemoved(signer);
    }

    function setRequiredConfirmations(uint256 _required) external onlyOwner {
        require(_required > 0, "At least one confirmation required");
        require(_required <= totalSigners, "Invalid required count");
        requiredConfirmations = _required;
    }

    // ==================== 交易提议 ====================

    function propose(
        address target,
        uint256 value,
        bytes calldata data,
        string calldata description
    ) external onlySigner returns (uint256) {
        require(target != address(0), "Invalid target");
        transactionCounter++;
        uint256 txId = transactionCounter;

        transactions[txId] = Transaction({
            target: target,
            value: value,
            data: data,
            executed: false,
            confirmationCount: 0,
            createdAt: block.timestamp,
            executor: address(0)
        });

        confirmations[txId][msg.sender] = true;
        transactions[txId].confirmationCount++;

        emit ProposalSubmitted(txId, msg.sender, target, value, description);
        if (requiredConfirmations == 1) {
            _execute(txId);
        }
        return txId;
    }

    function confirm(uint256 txId) external onlySigner {
        require(!transactions[txId].executed, "Already executed");
        require(!confirmations[txId][msg.sender], "Already confirmed");

        confirmations[txId][msg.sender] = true;
        transactions[txId].confirmationCount++;

        emit ProposalConfirmed(txId, msg.sender);

        if (transactions[txId].confirmationCount >= requiredConfirmations) {
            _execute(txId);
        }
    }

    function execute(uint256 txId) external onlySigner {
        require(!transactions[txId].executed, "Already executed");
        require(
            transactions[txId].confirmationCount >= requiredConfirmations,
            "Insufficient confirmations"
        );
        _execute(txId);
    }

    function _execute(uint256 txId) internal {
        Transaction storage txn = transactions[txId];
        require(!txn.executed, "Already executed");
        txn.executed = true;
        txn.executor = msg.sender;

        (bool success, ) = txn.target.call{value: txn.value}(txn.data);
        require(success, "Transaction failed");

        emit ProposalExecuted(txId, msg.sender, success);
    }

    // ==================== 查询 ====================

    function getTransaction(uint256 txId) external view returns (
        address target,
        uint256 value,
        bytes memory data,
        bool executed,
        uint256 confirmationCount,
        uint256 createdAt,
        address executor
    ) {
        Transaction storage txn = transactions[txId];
        return (txn.target, txn.value, txn.data, txn.executed, txn.confirmationCount, txn.createdAt, txn.executor);
    }

    function pendingCount() external view returns (uint256) {
        uint256 count = 0;
        for (uint256 i = 1; i <= transactionCounter; i++) {
            if (!transactions[i].executed &&
                transactions[i].confirmationCount < requiredConfirmations) {
                count++;
            }
        }
        return count;
    }
}

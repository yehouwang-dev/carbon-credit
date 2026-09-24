// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title CarbonCreditNFT
 * @notice 碳信用 NFT 合约 — 为每个减排项目发行唯一 NFT 资产凭证。
 *         每个 NFT 代表一个经认证的碳减排项目，可质押产生收益。
 */
contract CarbonCreditNFT is ERC721URIStorage, Ownable {

    // ===== 通用 NFT 参数 =====
    string private _baseTokenURI;
    uint256 private _tokenIdCounter;

    // ===== 碳信用业务参数 =====
    /// @notice 最大可发行 NFT 总数上限
    uint256 public immutable MAX_NFT_SUPPLY;

    // ===== 业务结构体 =====
    struct Project {
        uint256 tokenId;
        address creator;
        string projectName;
        string projectType;     // 风电/光伏/造林/碳捕集
        uint256 emissionReduction; // 减排量（吨×100）
        string location;
        string verifier;       // 验证机构 VCS/GS/CCER
        string auditCycle;     // 审计周期
        bool isActive;
        uint256 createdAt;
    }

    mapping(uint256 => Project) public projects;
    mapping(uint256 => bool) private _exists;

    // ===== 事件 =====
    event ProjectMinted(
        uint256 indexed tokenId,
        address indexed to,
        string projectType,
        uint256 emissionReduction,
        string location,
        uint256 timestamp
    );
    event ProjectUpdated(
        uint256 indexed tokenId,
        string field,
        string newValue
    );

    constructor(uint256 maxSupply) ERC721("CarbonCredit NFT", "CC-NFT") Ownable(msg.sender) {
        MAX_NFT_SUPPLY = maxSupply;
    }

    // ==================== 铸造逻辑 ====================

    /**
     * @notice 创建新的碳信用 NFT — 仅 owner 可调用
     * @return tokenId 新 mint 的 NFT ID
     */
    function mintProject(
        address to,
        string calldata name,
        string calldata type_,
        uint256 reduction,
        string calldata location_,
        string calldata verifier_,
        string calldata auditCycle_,
        string calldata uri
    ) external onlyOwner returns (uint256) {
        require(_tokenIdCounter < MAX_NFT_SUPPLY, "NFT supply limit reached");
        _tokenIdCounter++;
        uint256 newTokenId = _tokenIdCounter;

        projects[newTokenId] = Project({
            tokenId: newTokenId,
            creator: msg.sender,
            projectName: name,
            projectType: type_,
            emissionReduction: reduction,
            location: location_,
            verifier: verifier_,
            auditCycle: auditCycle_,
            isActive: true,
            createdAt: block.timestamp
        });

        _exists[newTokenId] = true;
        _safeMint(to, newTokenId);
        _setTokenURI(newTokenId, uri);

        emit ProjectMinted(
            newTokenId, to, type_, reduction, location_, block.timestamp
        );
        return newTokenId;
    }

    // ==================== 业务方法 ====================

    /**
     * @notice 更新项目元数据字段
     */
    function updateProject(
        uint256 tokenId,
        string calldata field,
        string calldata value
    ) external onlyOwner {
        require(_exists[tokenId], "Project does not exist");
        require(projects[tokenId].isActive, "Project is inactive");
        emit ProjectUpdated(tokenId, field, value);
    }

    /**
     * @notice 标记项目为失效
     */
    function deactivateProject(uint256 tokenId) external onlyOwner {
        require(_exists[tokenId], "Project does not exist");
        projects[tokenId].isActive = false;
    }

    /**
     * @notice 查询某 NFT 的减排量（吨）
     */
    function getEmissionReduction(uint256 tokenId) external view returns (uint256) {
        require(_exists[tokenId], "Project does not exist");
        return projects[tokenId].emissionReduction;
    }

    /**
     * @notice 查询某 NFT 的完整项目信息
     */
    function getProject(uint256 tokenId) external view returns (Project memory) {
        require(_exists[tokenId], "Project does not exist");
        return projects[tokenId];
    }

    // ==================== 继承方法 ====================
    function _baseURI() internal view override returns (string memory) {
        return _baseTokenURI;
    }

    function setBaseURI(string calldata newBaseURI) external onlyOwner {
        _baseTokenURI = newBaseURI;
    }
}

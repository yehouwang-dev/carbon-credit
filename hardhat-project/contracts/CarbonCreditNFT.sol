// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title CarbonCreditNFT
 * @notice 碳信用 NFT 合约 — 为每个减排项目发行唯一 NFT 资产凭证。
 *         每个 NFT 代表一个经认证的碳减排项目，可质押产生收益。
 */
contract CarbonCreditNFT is ERC721URIStorage, Ownable, Pausable {

    // ===== 通用 NFT 参数 =====
    string private _baseTokenURI;
    uint256 private _tokenIdCounter;
    uint256 private _applicationCounter;
    mapping(address => bool) public reviewers;

    enum ApplicationStatus { Submitted, Approved, Rejected }

    struct ProjectApplication {
        uint256 applicationId;
        address applicant;
        string projectName;
        string projectType;
        uint256 emissionReduction;
        string location;
        string verifier;
        string standard;
        string vintage;
        string documentHash;
        string metadataURI;
        ApplicationStatus status;
        string reviewReason;
        uint256 submittedAt;
        uint256 reviewedAt;
        uint256 tokenId;
    }

    mapping(uint256 => ProjectApplication) private _applications;

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
        uint256 applicationId;
        string standard;
        string vintage;
        string documentHash;
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
    event ProjectDeactivated(uint256 indexed tokenId);
    event ReviewerUpdated(address indexed reviewer, bool allowed);
    event ProjectSubmitted(uint256 indexed applicationId, address indexed applicant, string projectName);
    event ProjectReviewed(uint256 indexed applicationId, bool approved, string reason, uint256 tokenId);
    event EmergencyPauseUpdated(bool paused);

    constructor(uint256 maxSupply) ERC721("CarbonCredit NFT", "CC-NFT") Ownable(msg.sender) {
        require(maxSupply > 0, "Max supply must be greater than zero");
        MAX_NFT_SUPPLY = maxSupply;
        reviewers[msg.sender] = true;
    }

    modifier onlyReviewer() {
        require(reviewers[msg.sender], "Not a reviewer");
        _;
    }

    function setReviewer(address reviewer, bool allowed) external onlyOwner {
        require(reviewer != address(0), "Invalid reviewer");
        reviewers[reviewer] = allowed;
        emit ReviewerUpdated(reviewer, allowed);
    }

    function submitProject(
        string calldata name,
        string calldata type_,
        uint256 reduction,
        string calldata location_,
        string calldata verifier_,
        string calldata standard_,
        string calldata vintage_,
        string calldata documentHash_,
        string calldata uri
    ) external whenNotPaused returns (uint256) {
        require(bytes(name).length > 0, "Project name required");
        require(bytes(type_).length > 0, "Project type required");
        require(reduction > 0, "Reduction must be greater than zero");
        require(bytes(standard_).length > 0, "Standard required");
        require(bytes(documentHash_).length > 0, "Document hash required");

        _applicationCounter++;
        uint256 applicationId = _applicationCounter;
        _applications[applicationId] = ProjectApplication({
            applicationId: applicationId,
            applicant: msg.sender,
            projectName: name,
            projectType: type_,
            emissionReduction: reduction,
            location: location_,
            verifier: verifier_,
            standard: standard_,
            vintage: vintage_,
            documentHash: documentHash_,
            metadataURI: uri,
            status: ApplicationStatus.Submitted,
            reviewReason: "",
            submittedAt: block.timestamp,
            reviewedAt: 0,
            tokenId: 0
        });
        emit ProjectSubmitted(applicationId, msg.sender, name);
        return applicationId;
    }

    function reviewApplication(uint256 applicationId, bool approved, string calldata reason) external onlyReviewer whenNotPaused returns (uint256) {
        ProjectApplication storage application = _applications[applicationId];
        require(application.applicant != address(0), "Application does not exist");
        require(application.status == ApplicationStatus.Submitted, "Application already reviewed");

        application.reviewReason = reason;
        application.reviewedAt = block.timestamp;
        uint256 tokenId = 0;
        if (approved) {
            application.status = ApplicationStatus.Approved;
            tokenId = _mintProject(
                application.applicant,
                application.projectName,
                application.projectType,
                application.emissionReduction,
                application.location,
                application.verifier,
                application.vintage,
                application.metadataURI,
                applicationId,
                application.standard,
                application.documentHash
            );
            application.tokenId = tokenId;
        } else {
            application.status = ApplicationStatus.Rejected;
        }
        emit ProjectReviewed(applicationId, approved, reason, tokenId);
        return tokenId;
    }

    function getApplication(uint256 applicationId) external view returns (ProjectApplication memory) {
        require(_applications[applicationId].applicant != address(0), "Application does not exist");
        return _applications[applicationId];
    }

    function applicationCount() external view returns (uint256) {
        return _applicationCounter;
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
    ) external onlyReviewer whenNotPaused returns (uint256) {
        return _mintProject(to, name, type_, reduction, location_, verifier_, auditCycle_, uri, 0, "Direct review", "");
    }

    function _mintProject(
        address to,
        string memory name,
        string memory type_,
        uint256 reduction,
        string memory location_,
        string memory verifier_,
        string memory auditCycle_,
        string memory uri,
        uint256 applicationId,
        string memory standard_,
        string memory documentHash_
    ) internal returns (uint256) {
        require(_tokenIdCounter < MAX_NFT_SUPPLY, "NFT supply limit reached");
        require(to != address(0), "Invalid recipient");
        require(bytes(name).length > 0, "Project name required");
        require(bytes(type_).length > 0, "Project type required");
        require(reduction > 0, "Reduction must be greater than zero");
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
            createdAt: block.timestamp,
            applicationId: applicationId,
            standard: standard_,
            vintage: auditCycle_,
            documentHash: documentHash_
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
        require(bytes(value).length > 0, "Value required");

        bytes32 fieldHash = keccak256(bytes(field));
        if (fieldHash == keccak256("projectName")) {
            projects[tokenId].projectName = value;
        } else if (fieldHash == keccak256("projectType")) {
            projects[tokenId].projectType = value;
        } else if (fieldHash == keccak256("location")) {
            projects[tokenId].location = value;
        } else if (fieldHash == keccak256("verifier")) {
            projects[tokenId].verifier = value;
        } else if (fieldHash == keccak256("auditCycle")) {
            projects[tokenId].auditCycle = value;
        } else {
            revert("Unsupported field");
        }
        emit ProjectUpdated(tokenId, field, value);
    }

    function updateEmissionReduction(uint256 tokenId, uint256 reduction) external onlyOwner {
        require(_exists[tokenId], "Project does not exist");
        require(projects[tokenId].isActive, "Project is inactive");
        require(reduction > 0, "Reduction must be greater than zero");
        projects[tokenId].emissionReduction = reduction;
        emit ProjectUpdated(tokenId, "emissionReduction", "updated");
    }

    /**
     * @notice 标记项目为失效
     */
    function deactivateProject(uint256 tokenId) external onlyOwner {
        require(_exists[tokenId], "Project does not exist");
        projects[tokenId].isActive = false;
        emit ProjectDeactivated(tokenId);
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

    function isProjectActive(uint256 tokenId) external view returns (bool) {
        return _exists[tokenId] && projects[tokenId].isActive;
    }

    function pause() external onlyOwner {
        _pause();
        emit EmergencyPauseUpdated(true);
    }

    function unpause() external onlyOwner {
        _unpause();
        emit EmergencyPauseUpdated(false);
    }

    function _update(address to, uint256 tokenId, address auth)
        internal
        override
        whenNotPaused
        returns (address)
    {
        return super._update(to, tokenId, auth);
    }

    function projectCount() external view returns (uint256) {
        return _tokenIdCounter;
    }

    // ==================== 继承方法 ====================
    function _baseURI() internal view override returns (string memory) {
        return _baseTokenURI;
    }

    function setBaseURI(string calldata newBaseURI) external onlyOwner {
        _baseTokenURI = newBaseURI;
    }
}

// src/i18n/translations.js
export const translations = {
  en: {
    appTitle: "Carbon Credit Platform",
    connectWallet: "Connect Wallet",
    connected: "Connected",
    notConnected: "Not Connected",
    balance: "Balance",
    token: "Token (CC)",
    nft: "NFT Assets",
    mint: "Mint Credits",
    burn: "Burn Credits",
    stake: "Stake NFT",
    unstake: "Unstake",
    amount: "Amount",
    submit: "Submit",
    ownerOnly: "Owner only action",
    maxSupply: "Max Supply: 10,000,000 CC",
    connectedTo: "Connected to",
    multiSigOwner: "MultiSig Owner: Yes",
    timeLockActive: "Time Lock: Active",
    logout: "Logout",
    languageSwitch: "Language",
    loading: "Loading...",
    error: "Error",
    success: "Success",
    pleaseInstallMetaMask: "Please install MetaMask to connect your wallet.",
    walletConnectionFailed: "Wallet connection failed.",
    unknownNetwork: "Unknown network",
    copied: "Address copied",
    dismiss: "Dismiss",
    contractPending: "CC contract address has not been configured yet",
    connectToViewBalance: "Connect your wallet to view your balance",
    pleaseInstall: "Please install",
    toConnectWallet: "to connect your wallet"
    ,appSubtitle: "Verified projects, transparent issuance, auditable retirement"
    ,disconnect: "Disconnect"
    ,localDemo: "Local Demo"
    ,deploymentNotConfigured: "This network's contract addresses are not configured yet. Deploy to the selected network first."
    ,localDemoUnavailable: "The local demo is only available with the localhost deployment."
    ,sepoliaTestnetNotice: "Sepolia testnet prototype — demo tokens and sample project data have no real-world value and are not environmental certification."
    ,sepoliaWalletHint: "Connect a wallet configured for Sepolia. Use a dedicated test wallet; never use a wallet holding real assets."
    ,administrator: "Administrator"
    ,readDataFailed: "Unable to read contract data. Check that the local chain and deployment are running."
    ,wrongNetwork: "Please switch your wallet to chain"
    ,localNodeUnavailable: "The local blockchain is unavailable. Start the Hardhat node and deploy the contracts first."
    ,waitingConfirmation: "waiting for confirmation"
    ,transactionPending: "transaction submitted"
    ,transactionSuccess: "completed successfully"
    ,transactionFailed: "Transaction failed"
    ,welcomeTitle: "A working carbon credit MVP"
    ,welcomeText: "Issue verified carbon credits, manage project NFTs, stake assets and permanently retire credits on-chain."
    ,enterDemo: "Enter local demo"
    ,demoHint: "Uses the local Hardhat account and never touches real funds."
    ,myBalance: "My balance"
    ,circulatingSupply: "Circulating supply"
    ,retiredTotal: "Credits retired"
    ,verifiedProjects: "Verified projects"
    ,tokenOperations: "Carbon credit operations"
    ,reason: "Reason / reference"
    ,reasonPlaceholder: "Project issuance or retirement purpose"
    ,recipient: "Recipient address"
    ,transfer: "Transfer"
    ,createProject: "Register a carbon project"
    ,projectName: "Project name"
    ,projectType: "Project type"
    ,reductionTons: "Reduction (tCO₂e)"
    ,location: "Location"
    ,verifier: "Verifier"
    ,auditCycle: "Audit cycle"
    ,issueProjectNFT: "Issue project NFT"
    ,adminRequired: "Only the platform administrator can register verified projects."
    ,myProjects: "My project assets"
    ,noProjects: "No project NFTs are held by this account."
    ,nftFinance: "NFT-backed liquidity"
    ,loanAmount: "Loan amount (CC)"
    ,approveAndStake: "Approve and stake NFT"
    ,repayAndUnstake: "Repay and unstake"
    ,retirementRecords: "Retirement records"
    ,noRetirements: "No credits have been retired by this account."
    ,systemStatus: "System status"
    ,network: "Chain ID"
    ,vaultLiquidity: "Vault liquidity"
    ,treasuryBalance: "Treasury balance"
    ,activeStakes: "Active stakes"
    ,multisig: "Multisig threshold"
    ,maxSupplyLabel: "Maximum issuance"
    ,footerText: "Carbon Credit Platform local MVP"
    ,downloadCertificate: "Certificate"
    ,reviewerRole: "Reviewer"
    ,issuerRole: "Issuer"
    ,projectTokenId: "Project NFT ID"
    ,beneficiary: "Retirement beneficiary"
    ,beneficiaryPlaceholder: "Company or individual name"
    ,optional: "Optional"
    ,standard: "Credit standard"
    ,vintage: "Vintage year"
    ,documentHash: "Evidence document hash"
    ,submitProject: "Submit project"
    ,submitForReview: "Submit for review"
    ,reviewQueue: "Project review queue"
    ,myApplications: "My project applications"
    ,pending: "Pending"
    ,approved: "Approved"
    ,rejected: "Rejected"
    ,applicant: "Applicant"
    ,reviewNote: "Review note"
    ,approve: "Approve"
    ,reject: "Reject"
    ,noApplications: "No project applications to display."
    ,issued: "Issued"
    ,retired: "Retired"
    ,remaining: "Remaining"
    ,verifyCertificate: "Verify a retirement certificate"
    ,verify: "Verify"
    ,certificateValid: "Valid on-chain certificate"
    ,invalidCertificateId: "Enter a valid 32-byte certificate ID."
    ,certificateNotFound: "No on-chain certificate was found for this ID."
    ,roleManagement: "Role management"
    ,roleManagementHint: "Grant or revoke the reviewer and project-linked credit issuer roles."
    ,grantRole: "Grant"
    ,revokeRole: "Revoke"
    ,collateralAppraisalCC: "Reviewed collateral value (CC)"
    ,saveAppraisal: "Save reviewed appraisal"
    ,maxLoanHint: "Maximum loan at 50% LTV:"
    ,repaymentAmount: "Repayment amount in CC"
    ,partialRepayment: "Repay part"
    ,emergencyControls: "Emergency controls"
    ,pauseExplanation: "Pausing blocks new issuance, NFT transfers, or new stakes. Existing loans can still be repaid and unstaked."
    ,creditIssuance: "Credit issuance and transfers"
    ,projectNFTs: "Project NFT transfers and applications"
    ,newStakes: "New NFT stakes"
    ,creditsPaused: "Credits paused"
    ,paused: "Paused"
    ,active: "Active"
    ,pause: "Pause"
    ,resume: "Resume"
  },
  zh: {
    appTitle: "碳信用平台",
    connectWallet: "连接钱包",
    connected: "已连接",
    notConnected: "未连接",
    balance: "余额",
    token: "代币 (CC)",
    nft: "NFT资产",
    mint: "铸造信用",
    burn: "销毁信用",
    stake: "质押NFT",
    unstake: "解押",
    amount: "数量",
    submit: "提交",
    ownerOnly: "仅限所有者操作",
    maxSupply: "最大供应量: 10,000,000 CC",
    connectedTo: "连接到",
    multiSigOwner: "多签所有者: 是",
    timeLockActive: "时间锁: 激活",
    logout: "退出登录",
    languageSwitch: "语言",
    loading: "加载中...",
    error: "错误",
    success: "成功",
    pleaseInstallMetaMask: "请安装 MetaMask 后连接钱包。",
    walletConnectionFailed: "钱包连接失败。",
    unknownNetwork: "未知网络",
    copied: "地址已复制",
    dismiss: "关闭",
    contractPending: "尚未配置 CC 合约地址",
    connectToViewBalance: "连接钱包后查看余额",
    pleaseInstall: "请安装",
    toConnectWallet: "以连接钱包"
    ,appSubtitle: "项目可核验、发行可追溯、核销可审计"
    ,disconnect: "断开连接"
    ,localDemo: "本地演示"
    ,deploymentNotConfigured: "当前网络的合约地址尚未配置，请先部署到所选网络。"
    ,localDemoUnavailable: "本地演示仅适用于 localhost 部署。"
    ,sepoliaTestnetNotice: "Sepolia 测试网研究原型——演示代币和示例项目没有现实价值，也不构成环境认证。"
    ,sepoliaWalletHint: "请连接已切换到 Sepolia 的钱包。使用专用测试钱包，切勿使用持有真实资产的钱包。"
    ,administrator: "管理员"
    ,readDataFailed: "无法读取合约数据，请检查本地区块链和合约部署状态。"
    ,wrongNetwork: "请将钱包切换到链"
    ,localNodeUnavailable: "本地区块链不可用，请先启动 Hardhat 节点并部署合约。"
    ,waitingConfirmation: "等待确认"
    ,transactionPending: "交易已提交"
    ,transactionSuccess: "已成功完成"
    ,transactionFailed: "交易失败"
    ,welcomeTitle: "可运行的碳信用 MVP"
    ,welcomeText: "在链上发行已核验碳信用、管理项目 NFT、质押资产并永久核销碳信用。"
    ,enterDemo: "进入本地演示"
    ,demoHint: "使用 Hardhat 本地账户，不会涉及真实资金。"
    ,myBalance: "我的余额"
    ,circulatingSupply: "流通供应量"
    ,retiredTotal: "已核销数量"
    ,verifiedProjects: "已核验项目"
    ,tokenOperations: "碳信用操作"
    ,reason: "原因 / 业务参考"
    ,reasonPlaceholder: "项目发行或核销用途"
    ,recipient: "接收地址"
    ,transfer: "转账"
    ,createProject: "登记碳减排项目"
    ,projectName: "项目名称"
    ,projectType: "项目类型"
    ,reductionTons: "减排量（tCO₂e）"
    ,location: "地点"
    ,verifier: "核证机构"
    ,auditCycle: "审计周期"
    ,issueProjectNFT: "发行项目 NFT"
    ,adminRequired: "只有平台管理员可以登记已核验项目。"
    ,myProjects: "我的项目资产"
    ,noProjects: "当前账户未持有项目 NFT。"
    ,nftFinance: "NFT 抵押流动性"
    ,loanAmount: "借款数量（CC）"
    ,approveAndStake: "授权并质押 NFT"
    ,repayAndUnstake: "还款并解押"
    ,retirementRecords: "碳信用核销记录"
    ,noRetirements: "当前账户还没有核销记录。"
    ,systemStatus: "系统状态"
    ,network: "链 ID"
    ,vaultLiquidity: "质押库流动性"
    ,treasuryBalance: "储备金余额"
    ,activeStakes: "有效质押"
    ,multisig: "多签门槛"
    ,maxSupplyLabel: "最大发行量"
    ,footerText: "碳信用平台本地 MVP"
    ,downloadCertificate: "下载证书"
    ,reviewerRole: "审核员"
    ,issuerRole: "发行员"
    ,projectTokenId: "项目 NFT ID"
    ,beneficiary: "核销受益人"
    ,beneficiaryPlaceholder: "企业或个人名称"
    ,optional: "可选"
    ,standard: "碳信用标准"
    ,vintage: "减排年份"
    ,documentHash: "证明文件哈希"
    ,submitProject: "提交项目"
    ,submitForReview: "提交审核"
    ,reviewQueue: "项目审核队列"
    ,myApplications: "我的项目申请"
    ,pending: "待审核"
    ,approved: "已批准"
    ,rejected: "已驳回"
    ,applicant: "申请人"
    ,reviewNote: "审核意见"
    ,approve: "批准"
    ,reject: "驳回"
    ,noApplications: "暂无可显示的项目申请。"
    ,issued: "已发行"
    ,retired: "已核销"
    ,remaining: "可发行"
    ,verifyCertificate: "验证核销证书"
    ,verify: "验证"
    ,certificateValid: "链上证书有效"
    ,invalidCertificateId: "请输入有效的 32 字节证书 ID。"
    ,certificateNotFound: "未找到该 ID 对应的链上证书。"
    ,roleManagement: "角色权限管理"
    ,roleManagementHint: "授予或撤销审核员和项目碳信用发行员权限。"
    ,grantRole: "授权"
    ,revokeRole: "撤销"
    ,collateralAppraisalCC: "经复核的抵押估值（CC）"
    ,saveAppraisal: "保存复核估值"
    ,maxLoanHint: "50% 质押率最高可借："
    ,repaymentAmount: "CC 还款数量"
    ,partialRepayment: "部分还款"
    ,emergencyControls: "紧急控制"
    ,pauseExplanation: "暂停会阻止新发行、NFT 转移或新增质押；已有借款仍可还款和解押。"
    ,creditIssuance: "碳信用发行和转账"
    ,projectNFTs: "项目 NFT 转移和申请"
    ,newStakes: "新增 NFT 质押"
    ,creditsPaused: "碳信用已暂停"
    ,paused: "已暂停"
    ,active: "正常"
    ,pause: "暂停"
    ,resume: "恢复"
  }
};

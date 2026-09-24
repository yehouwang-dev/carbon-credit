# 🌿 Carbon Credit Platform — 碳信用区块链平台

> 基于以太坊的碳信用发行、交易与核销去中心化平台，支持 ERC-20 代币结算 + ERC-721 NFT 资产凭证。

## ✅ 当前可用状态

项目已具备可本地演示的 MVP：

- 六份合约可一次性部署，部署地址自动写入前端。
- 本地部署自动创建 10,000 CC、100,000 CC 质押流动性和一个示例项目 NFT。
- 前端可直接使用 Hardhat 演示账户，也可连接 MetaMask。
- 支持真实链上余额、铸造、转账、核销、项目 NFT 发行、质押与解押。
- 前端展示核销记录、质押库流动性、多签门槛和发行统计。
- 项目方可提交申请，审核员批准后自动发行项目 NFT。
- CC 发行强制绑定已批准项目，且不得超过该项目的核证减排量。
- 核销生成唯一链上证书 ID，支持独立验证页和证书下载。
- 包含管理员、审核员、发行员、项目方和普通持有者权限。
- 当前共 33 项合约自动化测试。

### 本地完整启动

打开三个终端，依次运行：

```bash
# 终端 1：本地区块链
cd hardhat-project
npm run node

# 终端 2：部署合约并创建演示数据
cd hardhat-project
npm run deploy:local

# 终端 3：前端
cd fronted
npm run dev
```

打开 `http://127.0.0.1:8080` 后点击“本地演示”，即可不安装 MetaMask 体验完整流程。

每次重启 Hardhat 节点后，都需重新执行 `npm run deploy:local`，因为本地链状态会重置。

### Sepolia 公网测试版

1. 将 `hardhat-project/.env.example` 复制为 `.env`。
2. 填写专用测试钱包私钥、Sepolia RPC 和可选的 Etherscan API Key。
3. 确保测试钱包拥有少量 Sepolia ETH。
4. 执行：

```bash
cd hardhat-project
npm run deploy:sepolia
npm run verify:sepolia

cd ../fronted
npm run build
```

部署脚本会将 Sepolia 合约地址自动写入前端。前端连接 MetaMask 时会自动请求切换到目标网络。

> 切勿使用存有真实资产的钱包，也不要将 `.env` 提交到 Git。

---

## 📋 项目概述

本项目将传统碳信用市场（如 CCER、VCS）数字化，实现：

- **碳信用发行**：项目方通过 NFT 认证减排量，平台铸造 ERC-20 碳信用代币
- **碳信用交易**：企业/个人可购买 CC 代币用于碳排放抵消
- **碳信用核销**：燃烧 CC 代币完成减排核销，链上留痕可审计
- **质押 DeFi**：质押 NFT 获取流动性，碳资产可金融化
- **治理风控**：多签 + 时间锁机制保障资金安全

---

## 🏗️ 系统架构

```
┌─────────────────────────────────────────────────────────────┐
│                      前端交互层 (React + Vite)               │
│         http://localhost:8080  |  中英文切换  |  MetaMask    │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                      智能合约层 (Solidity 0.8.28)            │
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ CarbonCredit │  │CarbonCreditNFT│  │CarbonMultiSig│      │
│  │   (ERC-20)   │  │   (ERC-721)  │  │   (多签管理) │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │CarbonTimeLock│  │CarbonCreditVault│ │CarbonTreasury│     │
│  │  (时间锁)    │  │   (质押金库)   │  │  (储备金库)  │     │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                    网络层 (Hardhat / Sepolia)                │
│         本地开发: npx hardhat node                          │
│         测试部署: npx hardhat run scripts/deploy.js --network sepolia
└─────────────────────────────────────────────────────────────┘
```

---

## 📁 项目结构

```
碳信用平台/
├── hardhat-project/          # Hardhat 智能合约项目
│   ├── contracts/            # Solidity 智能合约
│   │   ├── CarbonCredit.sol          # ERC-20 碳信用代币
│   │   ├── CarbonCreditNFT.sol       # ERC-721 碳信用 NFT 资产凭证
│   │   ├── CarbonMultiSig.sol        # 多签治理合约
│   │   ├── CarbonTimeLock.sol        # 时间锁风控合约
│   │   ├── CarbonCreditVault.sol     # NFT 质押金库
│   │   └── CarbonCreditTreasury.sol  # 储备金库
│   ├── test/                 # 单元测试
│   │   └── CarbonCredit.test.js      # ERC20 核心测试
│   ├── scripts/              # 部署脚本
│   │   └── deploy.js                 # 本地/Sepolia 部署
│   ├── hardhat.config.js     # Hardhat 配置
│   ├── .env.example          # 环境变量模板
│   └── package.json
│
├── fronted/                  # 前端 React 应用
│   ├── src/
│   │   ├── App.jsx           # 主组件
│   │   ├── App.css           # 样式
│   │   ├── main.jsx          # React 入口
│   │   └── i18n/             # 国际化
│   │       ├── translations.js   # 中英文翻译
│   │       └── useLanguage.js    # 语言切换 Hook
│   ├── index.html            # HTML 入口
│   └── package.json
│
└── README.md                 # 本文档
```

---

## 🚀 快速开始

### 1. 环境要求

- **Node.js** >= 18 LTS
- **npm** 或 **yarn**
- **MetaMask** 浏览器插件（用于钱包连接）

### 2. 安装依赖

```bash
# 进入合约项目目录
cd hardhat-project
npm install

# 进入前端目录
cd ../fronted
npm install
```

### 3. 配置环境变量

```bash
# 复制环境变量模板
cp .env.example .env

# 编辑 .env 填入真实值：
# PRIVATE_KEY=your_wallet_private_key
# SEPOLIA_RPC_URL=https://your_alchemy_or_infura_url
# ETHERSCAN_API_KEY=your_etherscan_api_key
```

### 4. 本地开发

```bash
# 终端 1：启动本地以太坊节点
cd hardhat-project
npx hardhat node

# 终端 2：部署合约到本地节点
npx hardhat run scripts/deploy.js --network localhost

# 终端 3：启动前端开发服务器
cd ../fronted
npm run dev
# 访问 http://localhost:8080
```

### 5. 部署到 Sepolia 测试网

```bash
# 确保 .env 已配置 Sepolia RPC 和私钥
cd hardhat-project
npx hardhat run scripts/deploy.js --network sepolia

# 部署后自动验证合约（需 Etherscan API Key）
npx hardhat verify --network sepolia <DEPLOYED_CONTRACT_ADDRESS>
```

---

## 🧪 测试

```bash
cd hardhat-project
npx hardhat test
```

---

## 🔧 核心功能说明

### CarbonCredit (ERC-20)
- **代币名称**：CarbonCredit | **符号**：CC
- **精度**：18 位
- **最大供应量**：1,000,000 CC（可配置）
- **铸造权限**：仅合约 owner（平台管理员/多签）
- **销毁权限**：任意持有者可调用（碳核销）

### CarbonCreditNFT (ERC-721)
- 每个 NFT 代表一个经认证的减排项目
- 包含：项目名称、类型、减排量、地理位置、验证机构、审计周期
- 支持 IPFS 元数据 URI
- 最大发行量可配置

### CarbonMultiSig
- 关键操作（大额铸造/销毁）需多人审批
- 支持动态添加/移除签名者
- 可配置所需确认数（M/N 机制）

### CarbonTimeLock
- 大额操作设置 48 小时冷却期
- 支持白名单跳过（已审计函数）
- 防止恶意快速操作

### CarbonCreditVault
- 质押 NFT 获取 CC 代币流动性
- 支持贷款偿还、部分还款
- 清算机制（抵押率不足时）

---

## 🌐 前端功能

- ✅ MetaMask 钱包连接
- ✅ 中英文实时切换（自动保存偏好）
- ✅ 代币余额/供应量展示
- ✅ NFT 资产列表
- ✅ 响应式布局（移动端适配）

---

## 📝 毕设答辩要点

### 技术亮点
1. **双层 Token 设计**：ERC-20 用于结算，ERC-721 用于资产凭证
2. **治理安全**：多签 + 时间锁双重风控
3. **DeFi 集成**：NFT 质押借贷，碳资产金融化
4. **全栈完整**：Solidity → Hardhat → React 全链路开发

### 创新点
- 链上可审计的碳核销记录
- 减排项目 NFT 化，增强资产流动性
- 多签治理保障平台资金安全

---

## 📄 许可证

MIT License

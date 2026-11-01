# 2026-11-01 interface release validation

- Warm off-white/forest presentation, a native SVG illustrative project, dated validation evidence, and a guided four-step workspace with persistent project state and session-only receipts.
- Frontend model 5/5; query acceptance and security regressions 14/14; Sepolia-mode build passes; frontend npm audit: zero findings.
- Chrome regression passes: complete lifecycle, out-of-order errors, query miss/recovery, in-page navigation/session retention, reset, Chinese/English, 320/390/768/1024/1440px widths, architecture selection and keyboard, pause/reduced motion, disabled unconfigured wallets. No RPC or third-party asset calls, page errors or failed assets in the presentation/simulation.
- Contract suite: 33/33 passing. Current tooling audit: 8 low, 4 moderate, 0 high/critical. New advisory results differ from the historical 27 October snapshot below. Moderate findings include legacy glob/minimatch and their Hardhat/Mocha dependency paths. A forced Hardhat 3 migration is not part of this visual release.
- No Sepolia configuration or public testnet transactions were added. The browser model remains separate from the blockchain interface.
- GitHub and Vercel publication are in progress; final publication is verified against the resulting branch head and public deployment.
- The older two-minute video stays local and records the 27 October interface. The recording script supports the guided workspace; the binary video is not included in this source sync.

# 2026-10-27 修复与升级验证

## 当前交付状态

| 工作 | 状态 | 证据/边界 |
| --- | --- | --- |
| 两项查询问题 | 已修复 | 5/5 基础验收；另有 9 项查询与证书安全回归 |
| 前端依赖 | 已升级 | ethers 6.17.0、Vite 8.3.5、React 插件 6.1.2；npm audit 0 告警 |
| 合约开发工具 | 已兼容升级 | 33 项合约测试通过；审计无高/中危，仍有 11 项低危 |
| 本地链浏览器闭环 | 已验证 | 真实 Hardhat 签名、铸造、核销、证书查询和无效输入清理 |
| 两分钟演示 | 已录制 | 1280×800、约120秒、英文画面字幕、无配音；仅浏览器模拟，不是 Sepolia 证据 |
| Sepolia 真实闭环 | 待用户钱包 | 当前无专用测试账户配置和测试ETH；没有发送本轮公开链交易 |
| GitHub / Vercel | Historical 2026-10-27 snapshot | See the 2026-11-01 update above |

## 查询修复

生产默认截止为 10 秒，测试注入 25ms 截止。仅明确的 `CALL_EXCEPTION` 且原因是 `CarbonCredit: certificate not found` 才报告不存在。网络、超时、未知错误和不完整数据各自处理，不能据此断言没有记录。

新请求、输入改变、断开连接或卸载会使旧请求失效。对于不可取消的底层钱包/RPC请求，应用取消等待并忽略迟到结果，不声称撤销底层已发送请求。

测试直接导入应用使用的 `certificateQuery.js`，不再依赖从 JSX 截取函数。回归覆盖迟到结果、竞态、取消、清理旧成功状态、来源伪造错误分类、异常回复和HTML转义。下载的 HTML 证书对用户文本进行转义。

## 依赖范围

前端从 ethers 5 迁移到 6：BrowserProvider、异步 signer、BigInt、顶层工具函数和合约 runner 均已迁移。修复了短期区块号缓存可能导致新核销事件不显示的问题，交易后读取未缓存的区块头。

工具链保留 Hardhat 2，移除未使用的 TypeChain 插件，替换废弃 Etherscan 插件，修正 Chai peer 版本冲突，并对可兼容传递依赖使用安全补丁。没有执行强制主版本修复。

剩余 11 项低危主要来自 Hardhat 2 依赖的旧 ABI/加密工具传递链；未伪装成整个项目零风险。彻底移除需另行迁移 Hardhat 3 并验证任务、插件和部署行为。npm audit 仅覆盖已知通报，不是合约安全审计。

## 本地链证据（不是 Sepolia）

一次浏览器回归的链ID为 **31337**，核销交易为 `0x9133cc8700292a2cf6786ad39ff0ab6c04666a8315351b43a26f8d3796907024`，证书ID为 `0x941104fab365ce0e7be7cb773686a4b9afd38b6e7543c845e0db1a94fe468bc6`。

这些记录只存在于当时的本地节点，节点重启会丢失。它们没有公共区块浏览器链接，不能作为公开测试网部署证明。

浏览器本地链脚本为 `fronted/test/local-chain.smoke.cjs`。在本机运行 `DEMO_NO_OPEN=1 DEMO_RPC_PORT=18545 DEMO_WEB_PORT=18083 npm run demo` 后，可用已有 Playwright/Chrome 环境运行该脚本；它会发送本地演示交易，不应指向公共网络。

## 复跑

```bash
npm --prefix fronted test
npm --prefix fronted run test:acceptance
npm --prefix fronted run build:sepolia
npm --prefix fronted audit
npm --prefix hardhat-project test
npm --prefix hardhat-project audit
```

CI 使用 Node.js 24，包含基础验收与回归，以及高危阈值的依赖检查。浏览器回归脚本 `fronted/test/motion.smoke.cjs` 使用本机已有的 Playwright/Chrome，不是项目新增运行时依赖。

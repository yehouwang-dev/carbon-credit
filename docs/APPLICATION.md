# 申请展示材料

## 可复用英文项目介绍

Carbon Credit Platform is an AI-assisted research prototype exploring the relationship between project review, recorded issuance limits, and credit retirement. Project NFTs store application and review records, while an ERC-20 contract supports project-associated issuance and retirement queries. A bilingual interface provides a clearly labelled, wallet-free simulation alongside a separate blockchain interface.

The current validation includes 33 smart-contract tests, five certificate-query acceptance tasks, nine additional query/security regressions, and browser checks of the simulated workflow. A local Hardhat transaction flow has also been exercised, and the six contracts are deployed and source-verified on Sepolia (with 100 CC issued and 10 CC retired in a public testnet run) alongside a live Vercel portfolio deployment. The prototype does not certify real-world reductions, preserve per-token project provenance, or claim integrated multisig administration.

## 个人贡献与 AI 辅助：如实填写

| 项目 | 当前可确认的事实 | 申请中应避免的说法 |
| --- | --- | --- |
| 项目用途 | 用户明确将项目用于研究生申请展示 | 未经确认的课程成绩、论文发表、获奖或商业采用 |
| 需求与方向 | 用户提出完善功能、文档、测试、上线和视觉展示等需求，选择并评价了设计方向 | 将所有技术方案自动描述为本人独立原创 |
| 实现与排错 | 本聊天中的 AI 编程代理参与了代码、动效、测试、依赖升级、文档和部署配置工作 | “全部代码独立完成”“未使用AI” |
| 本人实际编码/设计/验证 | 需要用户补充具体文件、决策及能独立解释的部分 | 代理执行了测试就等同于本人亲自编写并理解全部测试 |

没有替用户编造个人职责。提交前应确认实际参与的设计、实现和核验工作；明确区分本人贡献与 AI 辅助。

## 可用于面试的设计取舍

1. **为什么 ERC-721 + ERC-20？** NFT 记录项目身份与元数据，ERC-20 简化流转；代价是转账后不保留逐枚项目来源。可讨论 ERC-1155/项目批次记账作为后续方向，而非声称已实现。
2. **为什么保留无钱包模拟？** 让评审无需插件或测试币即可体验流程；与真实链上接口严格分开，模拟ID带 `SIM-ONLY` 前缀。
3. **为什么区分网络错误和无结果？** 无法取得来源不等于来源证明不存在。超时、故障与真实不存在必须有不同结论。
4. **区块链解决了什么？** 提供记录与状态转换的可查询性；不能自行验证额外性、减排真实性或审核机构资质。
5. **尚有哪些中心化边界？** 管理员可配置元数据、角色、估值与部分铸造路径；多签/时间锁尚未接管应用权限。

## 演示视频

本机文件：`docs/media/carbon-credit-demo-2026-10-27.webm`。约两分钟，英文画面字幕、无配音，内容为实际录制的浏览器模拟操作。视频全程说明 `SIMULATION ONLY`，不是 Sepolia 交易录像。

时间路线：00:00 项目问题；00:12 四阶段流程；00:26 架构与治理边界；00:40 模拟声明；00:50 审核；01:02 发行100；01:15 核销10；01:28 查询记录；01:41 无结果；01:50 重置与贡献说明。

视频文件当前仅在本机，不应在尚未上传时声称有公开视频链接。Sepolia 真实闭环与 6 个合约源码验证已完成，如需更新演示视频，可另录带可核验浏览器链接的版本。

已有 Playwright/Chrome 环境时，用 `node scripts/record-demo.cjs` 可从本机18082预览重录；也可通过 `DEMO_URL` 指定本机展示地址。无需为项目新增视频运行时依赖。

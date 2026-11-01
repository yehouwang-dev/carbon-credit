# MetaMask 与 Sepolia：用户准备步骤

本项目需要一个仅用于测试的账户。不要充值或购买真实 ETH，不要发送助记词、私钥、密码或登录令牌。

1. 在可信的 MetaMask 插件中创建一个专用测试账户，记下账户名称。不要使用持有真实资产的账户。
2. 打开网络菜单，开启“显示测试网络”，选择 **Ethereum Sepolia**，不要选 Ethereum Mainnet、Base Sepolia 或其他网络。参考 [MetaMask 官方说明](https://support.metamask.io/configure/networks/how-to-view-testnets-in-metamask/)。
3. 复制该账户的公开 `0x…` 地址，打开 [Google Cloud 官方 Sepolia 水龙头](https://cloud.google.com/application/web3/faucet/ethereum/sepolia)，根据其要求登录并申请免费测试 ETH。可用性和领取额度以页面为准，不保证一定能领取。
4. 若页面要求购买主网币、提供助记词或支付陌生手续费，停止操作，不要付费绕过限制。可以换用 [以太坊官方网络页列出的水龙头](https://ethereum.org/developers/docs/networks/)。
5. 到账后，向助手提供公开地址以及显示网络名称和测试余额的截图即可。隐藏无关账户/资产信息，不导出私钥。

## 继续部署前的检查

- 核对链ID为 11155111，账户为专用测试账户，余额足够支付估算的测试网费用。
- 本轮读取到公共 RPC 返回 `0xaa36a7`；这只证明当时连通，部署前仍需复核。
- 当前没有已完成的 Sepolia 部署、交易收据或公共证书记录。
- 现有 CLI 脚本需要本机配置专用签名账户；若保持私钥只在 MetaMask 中，应增加钱包确认的部署路径，再由用户逐笔确认交易，不能仅凭公开地址代签。
- 合约部署、注册表连接、项目申请/审核、发行、核销和查询都实际成功后，才能记录公开交易链接、更新前端清单并最终发布。

# Current interface

The original dark motion study below is historical. The 2026-11-01 release uses a cream-and-forest palette, a native SVG project landscape and a guided simulation workspace; see [UI-REDESIGN.md](UI-REDESIGN.md). Pause/reduced-motion controls are retained.

# 生态科技动效：本地实现与验证

日期：2026-10-27。仅本地前端改版，未同步 GitHub、未发布 Vercel、未部署 Sepolia。

## 已实现

- 首屏：原创 SVG 碳循环球、地形线、缓慢轨道和浮动记录卡；可视内容明确标注为概念图，不是实时链上数据。
- 版式：深森林绿、浅绿色衬线强调文字、细边框和轻量玻璃感。保留中英文和研究原型说明。
- 流程：审核、发行、核销、查询四阶段随进入视口逐次显示；不锁定、拦截或劫持滚动。
- 架构：五个可按键盘操作的模块按钮，显示各模块说明；独立治理模块用虚线表示，完整架构 SVG 可展开。
- 模拟：真实模拟状态驱动四步进度、450ms 数字过渡和轻量反馈。SIM-ONLY ID、虚构数据提示与刷新清空规则不变。
- 动效控制：用户可暂停；遵循系统 `prefers-reduced-motion` 并监听偏好变化；减少动态时直接展示最终状态。错误、成功和查询结果不会因暂停而不可见。
- 性能与隐私：不安装新依赖，无远程字体、视频、图片或额外 RPC 请求。动效主要使用 CSS/SVG；数字过渡完成或组件卸载时停止 RAF。

## 参考与边界

参考公开案例的设计方向，而非复制付费模板、代码或素材：

- [MotionSites Riverine](https://motionsites.org/prompts/riverine)：自然主题和分层标题入场。
- [MotionSites Vexel](https://motionsites.org/prompts/vexel)：数据球的视觉方向。
- [MotionSites Design World](https://motionsites.org/prompts/design-world)：克制的立体和玻璃质感。

未使用付费素材，也未把装饰节点或模拟数据描述成认证或已完成的链上交易。

## 文件

- `fronted/src/Portfolio.jsx`：页面组织、双语文案、暂停开关和模拟进度。
- `fronted/src/PortfolioMotion.jsx`：SVG 主视觉、视口进入效果、数字过渡、流程与架构交互。
- `fronted/src/Portfolio.css`：动效与手机响应式样式。
- `fronted/test/motion.smoke.cjs`：本地浏览器验收脚本，需要已有 Playwright 和 Chrome 环境。

## 查看与验证

从项目根目录运行：

```bash
npm --prefix fronted run build:sepolia
npm --prefix fronted run preview -- --host 127.0.0.1 --port 18082 --strictPort
```

访问 `http://127.0.0.1:18082/`。这里的 `build:sepolia` 只构建公开展示模式，不会发送交易或部署合约。

开发模式也可以使用 `npm --prefix fronted run dev`，然后访问 `http://127.0.0.1:8080/?showcase=1`。

检查项：桌面和 390px 手机视口无横向溢出；四步滚动显示；架构切换与图片加载；暂停状态下提示仍可见；系统减少动态时无连续动画；完整模拟发行/核销/查询/重置；查询输入变化后不保留旧结果；Sepolia 未配置时连接按钮仍禁用；无新增远程请求或页面脚本错误。

已有 Playwright/Chrome 环境时，可运行 `node fronted/test/motion.smoke.cjs`。本次使用本机工具自带的 Playwright（通过 NODE_PATH 提供），未将其安装为项目依赖。

本轮运行 `npm --prefix fronted test`：5 项模拟模型测试通过。原证书查询验收报告中的“超时”“来源不足”失败属于另一条链上查询路径，仍未修复；本轮没有改动 `App.jsx` 或合约逻辑，不能宣称原验收已全通过。

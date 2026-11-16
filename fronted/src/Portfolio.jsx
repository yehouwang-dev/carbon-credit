import React, { useRef, useState } from 'react';
import App from './App';
import { deployment, isDeploymentConfigured } from './contracts/contracts';
import { createDemo, transitionDemo } from './demo/model';
import { useReducedMotion, useReveal } from './PortfolioMotion';
import { SimulationWorkspace } from './PortfolioStudio';
import './Portfolio.css';
import TastePage from './TastePage';

const copy = {
  en: {
    pauseMotion: 'Pause motion', resumeMotion: 'Resume motion', reducedMotion: 'Reduced motion', steps: 'Simulation progress',
    stepNames: ['Review', 'Issue', 'Retire', 'Query'], fullDisclaimer: 'Fictional fixtures. Real questions.', readMore: 'Explore the lifecycle',
    tag: 'RESEARCH PORTFOLIO / CARBON CREDIT TRACEABILITY', title: 'A clearer path from project to retirement.',
    intro: 'Explore how recorded project review, credit issuance limits, and retirement records connect. A working research prototype—not a certified carbon registry.',
    overview: 'Overview', simulation: 'Try the simulation', chain: 'Blockchain interface', architecture: 'System architecture',
    noWallet: 'No wallet needed', noWalletText: 'Read the system and try the lifecycle without installing software or acquiring tokens.',
    records: 'Inspectable records', recordsText: 'The contract prototype links project records, aggregate issuance and retirement certificate IDs.',
    boundaries: 'Explicit boundaries', boundariesText: 'Fictional data. No independent audit. On-chain records do not prove environmental claims.',
    question: 'THE RESEARCH QUESTION', questionText: 'How can a verifier inspect the relationship between an approved project, its recorded issuance cap, and a retirement record?',
    disclaimer: 'SIMULATION ONLY — fictional data in this browser session. No wallet, RPC calls, transactions, real credits, or on-chain certificates. Refresh or reset clears the session.',
    project: 'Demo Forest / SIM-PROJECT-1', review: '1. Approve sample project', approved: 'Sample review recorded', pending: 'Awaiting simulated review',
    issue: '2. Issue simulated credits', retire: '3. Retire simulated credits', verify: '4. Find simulated record', amount: 'Amount (whole CC)', beneficiary: 'Beneficiary', query: 'Simulation record ID',
    balance: 'Simulated balance', issued: 'Cumulative issued', retired: 'Retired', capacity: 'Remaining issuance cap', reset: 'Reset simulation',
    success: 'Simulation updated. Nothing was sent to a blockchain.', found: 'Found in this simulation session only', notFound: 'No matching simulation record in this session.',
    empty: 'Retire simulated credits to create a session-only record.', notLive: 'Sepolia is not deployed/configured yet. Real transactions are disabled; the simulation remains available.',
    live: 'Sepolia testnet configuration is present. Wallet transactions use test ETH only; this does not imply certification.',
    archText: 'Direct frontend-to-contract access. No separate backend, database or price oracle. Multisig and timelock remain independent primitives, not application owners.',
    limits: 'What this does not prove', limitsText: 'Project metadata is administrator-managed. CC is fungible, so project attribution is aggregate accounting rather than per-token provenance. Evidence references are not verified documents.',
    auth: 'AI-assisted implementation and documentation. Personal contributions should be described separately in application materials.',
    capExceeded: 'The recorded cap is exhausted; retirement does not reopen it.', reviewFirst: 'Approve the sample project first.', invalidAmount: 'Enter a positive whole number.', insufficientBalance: 'Not enough simulated balance.', beneficiaryRequired: 'Enter a beneficiary (1–120 characters).', alreadyApproved: 'This sample is already approved.', unknownAction: 'Unknown simulation action.',
  },
  zh: {
    pauseMotion: '暂停动效', resumeMotion: '开启动效', reducedMotion: '已减少动效', steps: '模拟流程进度',
    stepNames: ['审核', '发行', '核销', '查询'], fullDisclaimer: '虚构的数据，真实的研究问题。', readMore: '了解生命周期',
    tag: '研究项目 / 碳信用生命周期追溯', title: '从项目到核销，让记录更清晰。',
    intro: '探索项目审核记录、信用发行额度与核销凭证如何关联。这是可运行的研究原型，不是真实碳信用认证平台。',
    overview: '项目概览', simulation: '体验模拟演示', chain: '区块链接口', architecture: '系统架构',
    noWallet: '无需钱包', noWalletText: '无需安装软件或领取测试代币，即可了解系统并体验核心流程。',
    records: '可查询的记录', recordsText: '合约原型关联项目记录、累计发行量和核销凭证 ID。',
    boundaries: '明确的边界', boundariesText: '虚构数据、未经独立审计。链上记录不能证明真实环境效益。',
    question: '研究问题', questionText: '核验者如何检查一个已审核项目、其记录的发行上限与核销记录之间的关系？',
    disclaimer: '仅模拟演示：数据仅存在于当前浏览器会话。不连接钱包或区块链，不发送交易，不产生真实碳信用或链上证书。刷新或重置会清空。',
    project: '演示森林 / SIM-PROJECT-1', review: '1. 模拟批准项目', approved: '已记录模拟审核', pending: '等待模拟审核',
    issue: '2. 模拟发行信用', retire: '3. 模拟核销信用', verify: '4. 查询模拟记录', amount: '数量（整数 CC）', beneficiary: '受益方', query: '模拟记录 ID',
    balance: '模拟余额', issued: '累计模拟发行', retired: '模拟核销', capacity: '剩余发行额度', reset: '重置模拟',
    success: '模拟已更新，没有向区块链发送任何操作。', found: '仅在本次模拟会话中找到记录', notFound: '本次模拟会话没有此记录。',
    empty: '模拟核销后会生成仅限本次会话的记录。', notLive: 'Sepolia 尚未部署或配置，真实交易不可用；模拟演示可以正常体验。',
    live: '已存在 Sepolia 配置，钱包操作仅使用测试 ETH；这不代表真实碳信用认证。',
    archText: '前端直接访问合约，无独立后端、数据库或价格预言机。多签与时间锁是独立原型，尚未接管应用管理权限。',
    limits: '它不能证明什么', limitsText: '项目元数据由管理员管理。CC 可以混合转账，项目归属是累计记账而不是逐枚来源追踪。证据引用不等于已核实的文件。',
    auth: '实现与文档包含 AI 辅助；申请材料应另行如实说明个人贡献。',
    capExceeded: '记录的发行额度已用完，核销不会恢复额度。', reviewFirst: '请先模拟批准项目。', invalidAmount: '请输入正整数。', insufficientBalance: '模拟余额不足。', beneficiaryRequired: '请输入受益方（1–120 字符）。', alreadyApproved: '该示例已批准。', unknownAction: '未知模拟操作。',
  },
};

export default function Portfolio() {
  const root = useRef(null);
  const reducedMotion = useReducedMotion();
  const [motionPaused, setMotionPaused] = useState(false);
  const [language, setLanguage] = useState('en');
  const [view, setView] = useState(() => { const initial = new URLSearchParams(window.location.search).get('view'); return ['simulation', 'chain'].includes(initial) ? initial : 'overview'; });
  const [state, setState] = useState(createDemo);
  const [issueAmount, setIssueAmount] = useState('100');
  const [retireAmount, setRetireAmount] = useState('10');
  const [beneficiary, setBeneficiary] = useState('Portfolio Demo');
  const [query, setQuery] = useState('');
  const [result, setResult] = useState(null);
  const [queried, setQueried] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [feedbackId, setFeedbackId] = useState(0);
  useReveal(root, view, reducedMotion || motionPaused);
  const c = copy[language];
  const live = deployment.network === 'sepolia' && isDeploymentConfigured;
  const completed = [state.approved, state.issued > 0, state.retired > 0, queried && Boolean(result)];
  const clearFeedback = () => { setError(''); setMessage(''); };
  const navigate = next => { clearFeedback(); setView(next); const url = new URL(window.location.href); if (next === 'overview') url.searchParams.delete('view'); else url.searchParams.set('view', next); window.history.replaceState(null, '', url); window.scrollTo({ top: 0, behavior: 'auto' }); };
  const act = action => {
    setFeedbackId(id => id + 1);
    try {
      const next = transitionDemo(state, action);
      setState(next); setError(''); setMessage('success'); setQueried(false); setResult(null);
      if (action.type === 'retire') setQuery(next.certificates.at(-1).id);
      if (action.type === 'reset') { setQuery(''); setMessage(''); }
      return true;
    } catch (e) { setError(e.message); setMessage(''); return false; }
  };
  return <div ref={root} className="portfolio taste-portfolio" data-motion-paused={motionPaused || reducedMotion} lang={language === 'zh' ? 'zh-CN' : 'en'}>
    <nav className="portfolio-nav" aria-label={language === 'zh' ? '主导航' : 'Main navigation'}>
      <button className="portfolio-brand" onClick={() => navigate('overview')}><span className="portfolio-brand-mark" aria-hidden="true">◎</span><span>Carbon Trace</span></button>
      <div>{['overview', 'simulation', 'chain'].map(key => <button key={key} aria-pressed={view === key} onClick={() => navigate(key)}>{c[key]}</button>)}<button className="portfolio-motion-toggle" disabled={reducedMotion} aria-pressed={motionPaused || reducedMotion} onClick={() => setMotionPaused(value => !value)}><span aria-hidden="true">{motionPaused || reducedMotion ? '▷' : 'Ⅱ'}</span> {reducedMotion ? c.reducedMotion : motionPaused ? c.resumeMotion : c.pauseMotion}</button><button onClick={() => setLanguage(language === 'en' ? 'zh' : 'en')}>{language === 'en' ? '中文' : 'English'}</button></div>
    </nav>
    {view === 'chain' ? <><div className="portfolio-chain-note" role="status">{live ? c.live : c.notLive}</div><App /></> : <main className="portfolio-main">
      {view === 'overview' ? <>
        <TastePage language={language} c={c} live={live} onDemo={() => navigate('simulation')}/>
      </> : <>
        <SimulationWorkspace {...{ language, c, state, act, clearFeedback, issueAmount, setIssueAmount, retireAmount, setRetireAmount, beneficiary, setBeneficiary, query, setQuery, result, setResult, queried, setQueried, error, message, feedbackId, completed }} animate={!motionPaused && !reducedMotion}/>

      </>}
    </main>}
    <footer className="portfolio-footer"><div><span className="footer-brand">◎ Carbon Trace</span><p>{language === 'zh' ? '碳信用追溯研究原型 · 无真实资产' : 'Carbon credit traceability · Research prototype · No real assets'}</p></div><div><a href="https://github.com/yehouwang-dev/carbon-credit" target="_blank" rel="noreferrer">GitHub <span aria-hidden="true">↗</span></a><p>{c.auth}</p><p className="portfolio-status">{live ? c.live : c.notLive}</p></div></footer>
  </div>;
}

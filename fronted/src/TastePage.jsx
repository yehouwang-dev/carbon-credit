import React, { useState } from 'react';
import { createDemo, transitionDemo } from './demo/model';
import { ArchitectureExplorer } from './PortfolioMotion';
import './TastePage.css';

// Every displayed figure comes from the same model as the working simulator.
const reviewed = transitionDemo(createDemo(), { type: 'approve' });
const issued = transitionDemo(reviewed, { type: 'issue', amount: reviewed.cap });
const retired = transitionDemo(issued, { type: 'retire', amount: 10, beneficiary: 'Portfolio Demo' });
const record = retired.certificates[0];
const snapshots = [reviewed, issued, retired, retired];
const words = {
  en: {
    title: <>Carbon credit<br/>records.</>, intro: 'A research prototype connecting project review, issuance limits and retirement records. Explore the complete lifecycle without a wallet.',
    demo: 'Try the simulation', caption: 'Fictional project data. No real assets or environmental certification.',
    record: 'Retirement record', project: 'Demo Forest', benefit: 'Beneficiary', projectId: 'Project', receiptId: 'Record ID',
    scope: 'Browser simulation', retired: 'Retired', balance: 'Balance', cap: 'Issuance cap', issued: 'Issued',
    stages: ['Review', 'Issue', 'Retire', 'Query'], receipt: 'A record to inspect', demoNote: 'Simulated example. Each stage uses the same lifecycle model as the workspace.',
    lifecycle: 'Follow the record', process: 'One project. Four states. Select a stage to see what changes.',
    names: ['A reviewed project', 'Issuance within a cap', 'Credits retired', 'A record retrieved'],
    descriptions: ['Record a review for Demo Forest with a cap of 100 CC.', 'Issue the full cap. A later retirement will not reopen it.', 'Retire 10 CC for Portfolio Demo. The remaining balance is 90 CC.', 'Retrieve SIM-ONLY-0001 with its project, amount and beneficiary.'],
    evidence: 'Open to inspection', evidenceText: 'The prototype is backed by contract tests and query regression checks. The recorded results are reproducible from the repository.',
    contractTests: 'Contract tests', acceptance: 'Query acceptance', regression: 'Additional regressions', report: 'Read the validation report', date: 'Validation snapshot: 1 November 2026.',
    architecture: 'Inside the system', limitations: 'Trust has boundaries', boundaries: 'Review data and collateral values are administrator-managed. Fungible transfers do not preserve per-token project provenance. Multisig and timelock are separate prototypes.',
    question: 'What the records establish', answer: 'An approved project, a recorded issuance limit and a retirement can be linked and inspected. Real-world reductions still depend on evidence and trusted review.',
    pending: 'Sepolia contracts are not configured. Use the browser simulation to explore the project.',
  },
  zh: {
    title: <>碳信用记录，<br/>有据可查。</>, intro: '一个研究原型，关联项目审核、发行额度与核销记录。无需钱包，即可体验完整生命周期。',
    demo: '体验模拟演示', caption: '虚构项目数据，不涉及真实资产或环境认证。',
    record: '核销记录', project: '演示森林', benefit: '受益方', projectId: '关联项目', receiptId: '记录编号',
    scope: '浏览器模拟', retired: '已核销', balance: '剩余余额', cap: '发行上限', issued: '累计发行',
    stages: ['审核', '发行', '核销', '查询'], receipt: '一条可检查的记录', demoNote: '模拟示例，与工作台使用同一个生命周期模型。',
    lifecycle: '跟随一条记录', process: '一个项目，四种状态。选择阶段，查看每次操作带来的变化。',
    names: ['已审核的项目', '额度内发行', '信用核销', '记录查询'],
    descriptions: ['记录演示森林的审核决定，发行上限为 100 CC。', '发行全部额度，之后的核销不会恢复发行容量。', '为 Portfolio Demo 核销 10 CC，剩余余额为 90 CC。', '查询 SIM-ONLY-0001，检查项目、数量与受益方。'],
    evidence: '经得起检查', evidenceText: '用合约测试和查询回归验证关键行为。测试结果可以从仓库复现。',
    contractTests: '合约测试', acceptance: '查询基础验收', regression: '额外回归测试', report: '查看验证报告', date: '验证快照：2026 年 11 月 1 日。',
    architecture: '系统如何工作', limitations: '信任的边界', boundaries: '审核数据和抵押估值仍由管理员管理。同质化代币转账不保留逐枚项目来源。多签与时间锁仍是独立原型。',
    question: '记录能证明什么', answer: '可以关联并检查已审核项目、记录的发行额度与核销行为。现实中的减排真实性仍依赖证据和可信审核。',
    pending: 'Sepolia 合约尚未配置，可以先在浏览器中体验模拟流程。',
  },
};

function RecordSheet({ t, full = false }) {
  return <div className={`trace-sheet${full ? ' is-hero' : ''}`} data-ui>
    <div className="trace-sheet-heading"><strong>{t.record}</strong><span>{t.scope}</span></div>
    <p className="trace-amount">{record.amount}<span> CC</span></p>
    <dl><div><dt>{t.benefit}</dt><dd>{record.beneficiary}</dd></div><div><dt>{t.projectId}</dt><dd>{record.projectId}</dd></div><div><dt>{t.receiptId}</dt><dd>{record.id}</dd></div></dl>
    <p className="trace-sheet-note">{t.caption}</p>
  </div>;
}

function StateFragment({ stage, t }) {
  const state = snapshots[stage];
  if (stage === 2) return <RecordSheet t={t}/>;
  return <div className="trace-state-fragment" data-ui>
    <div className="trace-fragment-heading"><strong>{stage === 3 ? t.record : t.project}</strong><span>{t.scope}</span></div>
    {stage === 0 ? <><p className="trace-state-word">{t.stages[0]}</p><dl><div><dt>{t.projectId}</dt><dd>{record.projectId}</dd></div><div><dt>{t.cap}</dt><dd>{state.cap} CC</dd></div></dl></> : stage === 1 ? <><p className="trace-state-value">{state.issued}<span> / {state.cap} CC</span></p><div className="trace-cap-track" role="meter" aria-label={t.cap} aria-valuemin={0} aria-valuemax={state.cap} aria-valuenow={state.issued}><span style={{width:`${state.issued / state.cap * 100}%`}}/></div><p>{t.balance}: {state.balance} CC</p></> : <><p className="trace-query-id">{record.id}</p><dl><div><dt>{t.retired}</dt><dd>{record.amount} CC</dd></div><div><dt>{t.benefit}</dt><dd>{record.beneficiary}</dd></div><div><dt>{t.projectId}</dt><dd>{record.projectId}</dd></div></dl></>}
  </div>;
}

export default function TastePage({ language, c, onDemo }) {
  const t = words[language];
  const [stage, setStage] = useState(3);
  const selected = snapshots[stage];
  return <div className="taste-page">
    <section className="taste-hero" aria-labelledby="taste-title">
      <div className="taste-hero-copy"><h1 id="taste-title">{t.title}</h1><p className="taste-intro">{t.intro}</p><button className="taste-action" onClick={onDemo}>{t.demo}<span aria-hidden="true">↗</span></button><p className="taste-caption">{t.caption}</p></div>
      <div className="taste-hero-stage"><RecordSheet t={t} full/></div>
    </section>
    <section className="taste-lifecycle" aria-labelledby="lifecycle-title">
      <div className="taste-section-head"><h2 id="lifecycle-title" data-reveal>{t.lifecycle}</h2><p data-reveal>{t.process}</p></div>
      <div className="trace-stage-selector" role="group" aria-label={c.steps}>{t.stages.map((name,i)=><button key={name} aria-pressed={stage===i} aria-controls="trace-live-state" onClick={()=>setStage(i)}>{name}</button>)}</div>
      <div className="trace-live-state" id="trace-live-state" aria-live="polite"><p>{t.names[stage]}</p><p>{t.cap} <strong>{selected.cap} CC</strong></p><p>{t.issued} <strong>{selected.issued} CC</strong></p><p>{t.retired} <strong>{selected.retired} CC</strong></p><p>{t.balance} <strong>{selected.balance} CC</strong></p></div>
      <p className="taste-caption">{t.demoNote}</p>
      <div className="taste-lifecycle-detail">{t.names.map((name,i)=><article key={name}><div className="taste-stage-copy"><h3 data-reveal>{name}</h3><p data-reveal>{t.descriptions[i]}</p></div><div className="taste-fragment-wrap" data-reveal><StateFragment stage={i} t={t}/></div></article>)}</div>
    </section>
    <section className="taste-evidence" aria-labelledby="taste-evidence-title">
      <div><h2 id="taste-evidence-title" data-reveal>{t.evidence}</h2><p data-reveal>{t.evidenceText}</p></div>
      <dl className="taste-proof-values">{[[33,33,t.contractTests],[5,5,t.acceptance],[9,9,t.regression]].map(([n,total,label])=><div key={label} data-reveal><dt>{label}</dt><dd>{n}<span> / {total}</span></dd></div>)}</dl>
      <p className="taste-report-link"><span>{t.date} </span><a href="https://github.com/yehouwang-dev/carbon-credit/blob/main/docs/RELEASE-VALIDATION.md" target="_blank" rel="noreferrer">{t.report}</a></p>
    </section>
    <ArchitectureExplorer language={language} c={{...c,architecture:t.architecture}}/>
    <section className="taste-boundaries" aria-labelledby="taste-boundaries-title"><div><h2 id="taste-boundaries-title" data-reveal>{t.limitations}</h2><p data-reveal>{t.boundaries}</p></div><div><h3 data-reveal>{t.question}</h3><p data-reveal>{t.answer}</p><p className="taste-caption">{t.pending}</p></div></section>
  </div>;
}

import React, { useState } from 'react';
import { AnimatedValue } from './PortfolioMotion';
import { queryDemoCertificate } from './demo/model';

const labels = {
  en: {
    sample: 'ILLUSTRATIVE PROJECT', forest: 'Demo Forest', category: 'Forest conservation · fictional fixture',
    status: 'Sample project', map: 'PROJECT LANDSCAPE / CONCEPT ONLY', cap: 'Recorded issuance cap', reduction: 'Recorded reduction',
    terrainNote: 'Illustrative landscape. No real project location.', snapshot: 'A lifecycle, at a glance.',
    receipt: 'RETIREMENT RECORD', receiptTag: 'SESSION ONLY', receiptEmpty: 'Your next record starts here.',
    receiptHelp: 'Retire credits in the simulation to create an inspectable record.', issuedTo: 'Beneficiary', linked: 'Linked project',
    desk: 'YOUR RESEARCH WORKSPACE', deskIntro: 'Follow one project through its lifecycle. Every action updates the project summary beside you.',
    projectSummary: 'PROJECT SUMMARY', projectId: 'Project identifier', approved: 'Review recorded', pending: 'Awaiting review',
    next: ['Record a reviewer decision for this fictional project.', 'Issue within the project’s cumulative limit.', 'Retire a balance and name a beneficiary.', 'Inspect the record you have just created.'],
    descriptions: ['The sample has a recorded reduction of 100 tCO₂e and an issuance cap of 100 CC. Approval changes its simulated review state.', 'The cap counts all credits issued. Retiring credits does not restore capacity.', 'Retirement removes credits from the simulated balance and creates a session-only record.', 'Use a SIM-ONLY ID from this session. These records are separate from blockchain certificates.'],
    selected: 'CURRENT STEP', total: 'SESSION RECORDS', emptyTitle: 'A record you can inspect.', emptyText: 'Complete review, issuance and retirement to see the resulting record here.',
    nextStep: 'Continue to next step', back: 'Previous step', fresh: 'Start a new walkthrough',
    noEvidence: 'Fictional data · No environmental certification', architecture: 'Explore the architecture',
    sampleRecord: 'Sample record · preview only', simulated: 'Simulated retirement', quantity: 'Retired amount',
    privacy: 'Session data stays in this page. Reloading clears it.', queryHint: 'Tip: choose a saved session record below to fill its ID.',
  },
  zh: {
    sample: '示意项目', forest: '演示森林', category: '森林保护 · 虚构示例',
    status: '示例项目', map: '项目景观 / 仅概念示意', cap: '记录的发行上限', reduction: '记录的减排量',
    terrainNote: '示意景观，不代表真实项目位置。', snapshot: '一眼看清，完整生命周期。',
    receipt: '核销记录', receiptTag: '仅本次会话', receiptEmpty: '下一条记录，从这里开始。',
    receiptHelp: '在模拟中核销信用，生成一条可查询的记录。', issuedTo: '受益方', linked: '关联项目',
    desk: '研究演示工作台', deskIntro: '跟随一个项目走完核心流程。每次操作，都会更新旁边的项目状态。',
    projectSummary: '项目概况', projectId: '项目编号', approved: '已记录模拟审核', pending: '等待模拟审核',
    next: ['为虚构项目记录一次审核决定。', '在项目累计额度内发行信用。', '核销余额，并填写受益方。', '查询刚刚生成的核销记录。'],
    descriptions: ['示例记录的减排量为 100 tCO₂e，发行上限为 100 CC。批准操作只改变模拟审核状态。', '发行上限约束累计发行量，核销不会恢复剩余发行额度。', '核销会扣减模拟余额，并生成仅在本次会话内有效的记录。', '使用本次会话生成的 SIM-ONLY 编号查询，与区块链证书独立。'],
    selected: '当前步骤', total: '本次会话记录', emptyTitle: '让操作留下清晰的记录。', emptyText: '完成审核、发行与核销，即可在这里查看生成的记录。',
    nextStep: '继续下一步', back: '上一步', fresh: '重新开始演示',
    noEvidence: '虚构数据 · 不构成环境认证', architecture: '了解系统架构',
    sampleRecord: '样例记录 · 仅供预览', simulated: '模拟核销', quantity: '核销数量',
    privacy: '数据仅保留在当前页面，刷新后清空。', queryHint: '提示：点击下方会话记录，可自动填入编号。',
  },
};

export function Landscape({ compact = false }) {
  return <div className={`project-landscape${compact ? ' is-compact' : ''}`} aria-hidden="true">
    <svg viewBox="0 0 560 320" fill="none" preserveAspectRatio="xMidYMid slice">
      <defs><linearGradient id={compact ? 'land-small' : 'land-large'} x1="0" y1="0" x2="560" y2="320" gradientUnits="userSpaceOnUse"><stop stopColor="#153c31"/><stop offset="1" stopColor="#3d6950"/></linearGradient></defs>
      <path fill={`url(#${compact ? 'land-small' : 'land-large'})`} d="M0 0h560v320H0z"/>
      <g stroke="#b9cdb1" strokeWidth=".65" opacity=".25">
        {Array.from({ length: 17 }, (_, i) => <path key={i} d={`M-60 ${i * 24 - 130} C80 ${i * 24 + 75} 155 ${i * 24 - 135} 285 ${i * 24 - 25} S445 ${i * 24 + 155} 630 ${i * 24 - 20}`}/>)}
        {Array.from({ length: 12 }, (_, i) => <path key={`b${i}`} d={`M${i * 50 - 160} -20 C${i * 50 + 160} 55 ${i * 50 - 130} 190 ${i * 50 + 100} 350`}/>)}
      </g>
      <path d="M189 77l147-25 67 108-42 97-158-5-64-88z" fill="#c8ddb4" fillOpacity=".1" stroke="#d4e5b9" strokeWidth="1.5" strokeDasharray="5 5"/>
      <path d="M204 84l126-22 60 99-38 84-142-4-58-77z" stroke="#d5e6b7" strokeOpacity=".2"/>
      <g className="landscape-pin"><circle cx="281" cy="155" r="20" fill="#d9eac9" fillOpacity=".12"/><circle cx="281" cy="155" r="7" fill="#e0edce"/><circle cx="281" cy="155" r="3" fill="#385743"/></g>
      <path d="M28 276v17h17M515 293h17v-17M28 44V27h17M515 27h17v17" stroke="#e2ead7" strokeOpacity=".5"/>
    </svg>
    <span className="landscape-coordinates">SIM-PROJECT-1</span><span className="landscape-compass">N ↑</span>
  </div>;
}

export function ProjectPreview({ language, onDemo }) {
  const t = labels[language];
  return <figure className="project-preview">
    <div className="preview-browser"><span><i/><i/><i/></span><span>CARBON / TRACE</span><span>↗</span></div>
    <div className="preview-project"><div><p className="portfolio-eyebrow">{t.sample}</p><h2>{t.forest}<span>↗</span></h2><p>{t.category}</p></div><span className="project-type-mark" aria-hidden="true">♧</span></div>
    <div className="preview-landscape"><Landscape/><span className="landscape-tag">100 tCO₂e <span>· {t.status}</span></span></div>
    <div className="preview-stats"><div><span>{t.cap}</span><strong>100 <small>CC</small></strong></div><div><span>{t.reduction}</span><strong>100 <small>tCO₂e</small></strong></div></div>
    <div className="preview-lifecycle">{(language === 'zh' ? ['审核', '发行', '核销', '查询'] : ['Review', 'Issue', 'Retire', 'Query']).map((name, i) => <span key={name}><i>0{i + 1}</i>{name}{i < 3 && <b aria-hidden="true">→</b>}</span>)}</div>
    <figcaption><span className="preview-note-dot"/>{t.terrainNote}<button onClick={onDemo} aria-label={language === 'zh' ? '打开模拟工作台' : 'Open the simulation workspace'}>↗</button></figcaption>
    <div className="preview-floating-note"><span aria-hidden="true">↗</span><div><strong>{language === 'zh' ? '从审核，到一条可查询记录。' : 'From review to a readable record.'}</strong><span>{language === 'zh' ? '仅研究演示 · 无需钱包' : 'Research prototype · wallet-free'}</span></div></div>
  </figure>;
}

export function CertificateCard({ record, language, empty = false }) {
  const t = labels[language];
  return <div className={`studio-certificate${empty ? ' is-empty' : ''}`}>
    <div className="certificate-topline"><span>{t.receipt}</span><span>{t.receiptTag}</span></div>
    <span className="certificate-seal" aria-hidden="true">{empty ? '◎' : '✓'}</span>
    <p className="certificate-kicker">{empty ? t.receiptEmpty : t.simulated}</p>
    {empty ? <p className="certificate-empty-text">{t.receiptHelp}</p> : <><strong className="certificate-amount">{record.amount}<small> CC</small></strong><p className="certificate-id">{record.id}</p><dl><div><dt>{t.issuedTo}</dt><dd>{record.beneficiary}</dd></div><div><dt>{t.linked}</dt><dd>{record.projectId}</dd></div></dl></>}
    <p className="certificate-footnote">{t.noEvidence}</p>
  </div>;
}

export function SimulationWorkspace({ language, c, state, act, clearFeedback, issueAmount, setIssueAmount, retireAmount, setRetireAmount, beneficiary, setBeneficiary, query, setQuery, result, setResult, queried, setQueried, error, message, feedbackId, completed, animate }) {
  const t = labels[language];
  const [step, setStep] = useState(() => !state.approved ? 0 : !state.issued ? 1 : !state.retired ? 2 : 3);
  const go = next => { clearFeedback(); setStep(next); };
  const submit = action => { if (act(action)) setStep(Math.min(step + 1, 3)); };
  const latest = state.certificates.at(-1);
  return <section className="portfolio-simulation">
    <header className="studio-heading"><div><p className="portfolio-eyebrow">{t.desk}</p><h1>{c.simulation}</h1><p>{t.deskIntro}</p></div><span className="studio-session-badge"><i/>{language === 'zh' ? '浏览器会话' : 'BROWSER SESSION'}</span></header>
    <p className="portfolio-warning"><span aria-hidden="true">ⓘ</span>{c.disclaimer}</p>
    <ol className="simulation-progress" aria-label={c.steps}>{c.stepNames.map((name, i) => <li key={i} data-complete={completed[i]}><button aria-pressed={step === i} aria-controls={`studio-panel-${i}`} aria-current={step === i ? 'step' : undefined} onClick={() => go(i)}><span aria-hidden="true">{completed[i] ? '✓' : `0${i + 1}`}</span><span>{name}<small>{language === 'zh' ? ['审核示例项目', '记录信用发行', '生成核销记录', '查询会话凭证'][i] : ['Review the project', 'Record issuance', 'Create a record', 'Inspect the result'][i]}</small></span><span className="portfolio-sr-only">{completed[i] ? (language === 'zh' ? '已完成' : 'completed') : (language === 'zh' ? '尚未完成' : 'not completed')}</span><b aria-hidden="true">↗</b></button></li>)}</ol>
    <div className="studio-workspace">
      <aside className="studio-project"><p className="studio-aside-label">{t.projectSummary}</p><h2>{t.forest}<span aria-hidden="true">♧</span></h2><p className="studio-project-id">SIM-PROJECT-1</p><Landscape compact/><span className={`studio-review-state${state.approved ? ' is-approved' : ''}`}><i/>{state.approved ? t.approved : t.pending}</span><div className="portfolio-metrics">{[['balance', state.balance], ['issued', state.issued], ['retired', state.retired], ['capacity', state.cap - state.issued]].map(([key, value]) => <div key={key}><span>{c[key]}</span><strong><AnimatedValue value={value} animate={animate}/> <small>CC</small></strong></div>)}</div><p className="studio-privacy">{t.privacy}</p></aside>
      <div className="studio-operation"><div className="studio-panel-top"><span>{t.selected} / 0{step + 1}</span><span>{language === 'zh' ? '仅模拟' : 'SIMULATION ONLY'}</span></div>
        <div className="studio-step-panel" id={`studio-panel-${step}`} aria-labelledby={`studio-title-${step}`}>
          <p className="studio-step-number">0{step + 1}<span>/ 04</span></p><h2 id={`studio-title-${step}`}>{t.next[step]}</h2><p className="studio-description">{t.descriptions[step]}</p>
          {error && <p key={`error-${feedbackId}`} className="portfolio-feedback is-error" role="alert">{c[error] || error}</p>}{message && <p key={`success-${feedbackId}`} className="portfolio-feedback" role="status">{c[message]}</p>}
          {step === 0 && <div className="studio-review-details"><div><span>{t.projectId}</span><strong>SIM-PROJECT-1</strong></div><div><span>{t.reduction}</span><strong>100 tCO₂e</strong></div><div><span>{t.cap}</span><strong>100 CC</strong></div></div>}
          {step === 1 && <label>{c.amount}<div className="studio-input-wrap"><input type="number" min="1" step="1" value={issueAmount} onChange={e => setIssueAmount(e.target.value)} /><span aria-hidden="true">CC</span></div></label>}
          {step === 2 && <><label>{c.amount}<div className="studio-input-wrap"><input type="number" min="1" step="1" value={retireAmount} onChange={e => setRetireAmount(e.target.value)} /><span aria-hidden="true">CC</span></div></label><label>{c.beneficiary}<input maxLength="120" value={beneficiary} onChange={e => setBeneficiary(e.target.value)} /></label></>}
          {step === 3 && <label>{c.query}<input value={query} placeholder="SIM-ONLY-0001" onChange={e => { setQuery(e.target.value); setQueried(false); setResult(null); }} /></label>}
          <button className="portfolio-primary studio-submit" disabled={step === 0 && state.approved} onClick={() => step === 0 ? submit({ type: 'approve' }) : step === 1 ? submit({ type: 'issue', amount: issueAmount }) : step === 2 ? submit({ type: 'retire', amount: retireAmount, beneficiary }) : (setResult(queryDemoCertificate(state, query)), setQueried(true))}>{[c.review, c.issue, c.retire, c.verify][step]}<span aria-hidden="true">↗</span></button>
          {step === 3 && queried && <div className={`portfolio-query-result${result ? '' : ' is-missing'}`} role="status">{result ? <><strong>✓ {c.found}</strong><CertificateCard record={result} language={language}/></> : <><strong>{c.notFound}</strong><p>{t.queryHint}</p></>}</div>}
          <div className="studio-panel-nav"><button disabled={step === 0} onClick={() => go(step - 1)}>← {t.back}</button>{step < 3 && completed[step] && <button onClick={() => go(step + 1)}>{t.nextStep} →</button>}</div>
        </div>
      </div>
      <aside className="studio-result"><p className="portfolio-eyebrow">{t.total} / {String(state.certificates.length).padStart(2, '0')}</p>{latest ? <CertificateCard record={latest} language={language}/> : <CertificateCard empty language={language}/>}<div className="portfolio-records">{state.certificates.map(record => <button key={record.id} onClick={() => { setQuery(record.id); setResult(null); setQueried(false); setStep(3); }}><span>{record.id}</span><strong>{record.amount} CC <span aria-hidden="true">↗</span></strong></button>)}</div></aside>
    </div>
    <div className="studio-bottom"><p>{t.noEvidence}</p><button className="portfolio-reset" onClick={() => { act({ type: 'reset' }); setStep(0); }}>{c.reset} <span aria-hidden="true">↻</span></button></div>
  </section>;
}



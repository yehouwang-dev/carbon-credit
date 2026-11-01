import React, { useEffect, useRef, useState } from 'react';

export function useReducedMotion() {
  const [reduced, setReduced] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReduced(media.matches);
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);
  return reduced;
}

export function useReveal(root, view, disabled) {
  useEffect(() => {
    if (disabled || !('IntersectionObserver' in window)) return;
    const nodes = root.current?.querySelectorAll('[data-reveal]') || [];
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.dataset.motion = 'visible';
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.12 });
    nodes.forEach(node => { node.dataset.motion = 'pending'; observer.observe(node); });
    return () => { observer.disconnect(); nodes.forEach(node => delete node.dataset.motion); };
  }, [root, view, disabled]);
}

export function AnimatedValue({ value, animate }) {
  const [display, setDisplay] = useState(value);
  const previous = useRef(value);
  useEffect(() => {
    const from = previous.current;
    previous.current = value;
    if (!animate || from === value) { setDisplay(value); return; }
    let frame;
    const start = performance.now();
    const tick = now => {
      const progress = Math.min(1, (now - start) / 450);
      setDisplay(Math.round(from + (value - from) * (1 - (1 - progress) ** 3)));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value, animate]);
  return <><span aria-hidden="true">{display}</span><span className="portfolio-sr-only">{value}</span></>;
}

export function CarbonGlobe({ language }) {
  const zh = language === 'zh';
  return <figure className="carbon-scene">
    <div className="carbon-scene-grid" aria-hidden="true" />
    <div className="carbon-scene-topline"><span>CARBON / CYCLE</span><span>01 — 04</span></div>
    <div className="carbon-orbit-space" aria-hidden="true">
      <svg className="carbon-globe" viewBox="0 0 500 500" fill="none">
        <defs>
          <radialGradient id="carbon-surface" cx=".32" cy=".28" r=".72"><stop stopColor="#4d9c65" stopOpacity=".24"/><stop offset=".7" stopColor="#143d2c" stopOpacity=".44"/><stop offset="1" stopColor="#081b14"/></radialGradient>
          <radialGradient id="carbon-aura"><stop offset=".48" stopColor="#9ee7a7" stopOpacity="0"/><stop offset=".7" stopColor="#9ee7a7" stopOpacity=".06"/><stop offset="1" stopColor="#9ee7a7" stopOpacity="0"/></radialGradient>
          <clipPath id="carbon-clip"><circle cx="250" cy="250" r="154"/></clipPath>
        </defs>
        <circle cx="250" cy="250" r="234" fill="url(#carbon-aura)"/>
        <circle cx="250" cy="250" r="154" fill="url(#carbon-surface)" stroke="#84ba8a" strokeOpacity=".5"/>
        <g clipPath="url(#carbon-clip)" stroke="#a7dca3" strokeOpacity=".26" strokeWidth=".8">
          {[36, 78, 119, 148].map(radius => <ellipse key={radius} cx="250" cy="250" rx={radius} ry="154"/>)}
          {[120, 162, 205, 250, 295, 338, 380].map(y => <path key={y} d={`M80 ${y} Q250 ${y + 50} 420 ${y}`}/>)}
          <g className="carbon-terrain" stroke="#a7df9c" strokeOpacity=".65">
            <path d="M110 240C155 188 187 233 213 196S278 146 315 189 371 199 407 163M103 253C155 201 190 248 219 210S279 164 313 203 374 213 413 180M100 266C153 216 192 264 223 225S280 180 315 217 377 228 415 197M100 279C155 230 194 279 227 241S283 195 318 232 379 242 416 214M103 292C155 246 197 293 232 258S286 210 322 247 381 257 416 231M107 305C158 263 201 309 238 276S291 227 327 264 385 274 416 249M113 318C161 280 205 325 246 295S297 246 333 283 389 292 416 268"/>
          </g>
        </g>
        <ellipse cx="250" cy="250" rx="225" ry="61" transform="rotate(-28 250 250)" stroke="#afdb93" strokeOpacity=".55"/>
        <ellipse cx="250" cy="250" rx="203" ry="94" transform="rotate(43 250 250)" stroke="#87ae8e" strokeOpacity=".25" strokeDasharray="3 8"/>
        <g className="carbon-orbit-dot"><circle cx="52" cy="355" r="5" fill="#ddf7b6"/><circle cx="52" cy="355" r="11" stroke="#ddf7b6" strokeOpacity=".35"/></g>
        <circle cx="345" cy="133" r="4" fill="#b4e99f"/><circle cx="182" cy="312" r="3" fill="#c5efb8"/>
      </svg>
      <div className="carbon-floating-label carbon-floating-label-a"><i/> {zh ? '项目记录' : 'PROJECT RECORD'}<strong>SIM-PROJECT-1</strong></div>
      <div className="carbon-floating-label carbon-floating-label-b"><span>↗</span><div>{zh ? '记录 · 关联 · 查询' : 'RECORD · LINK · QUERY'}<strong>{zh ? '可检查的生命周期' : 'An inspectable lifecycle'}</strong></div></div>
    </div>
    <figcaption><span className="carbon-diagram-dot"/>{zh ? '流程示意 · 非实时链上数据' : 'Concept diagram · not live chain data'}<span>↻</span></figcaption>
  </figure>;
}

const stages = {
  en: [
    ['Review', 'Begin with a project record.', 'Record an application and a reviewer decision. Approval is a contract state—not proof of real-world reductions.'],
    ['Issue', 'Give issuance a boundary.', 'Link issuance to an approved project and its recorded cap. Privileged owner minting remains a separate pathway.'],
    ['Retire', 'Record what leaves circulation.', 'Burn a balance and associate its retirement with a project, beneficiary, and purpose.'],
    ['Query', 'Make the record inspectable.', 'Look up a retirement ID. A readable record is not an environmental certification.'],
  ],
  zh: [
    ['审核', '从一条项目记录开始。', '记录项目申请和审核决定。批准是合约状态，不代表现实减排已获认证。'],
    ['发行', '让发行量有明确边界。', '将发行与已审核项目及记录额度关联；管理员通用铸造仍是独立路径。'],
    ['核销', '记录退出流通的信用。', '销毁余额，并将核销与项目、受益方和用途关联。'],
    ['查询', '让生命周期可以检查。', '用凭证 ID 查询核销记录；可查询记录不等于环境认证。'],
  ],
};

export function Lifecycle({ language, onDemo }) {
  const zh = language === 'zh';
  return <section className="portfolio-lifecycle" aria-labelledby="lifecycle-title">
    <div className="portfolio-section-heading" data-reveal><div><p className="portfolio-eyebrow">01 / THE LIFECYCLE</p><h2 id="lifecycle-title">{zh ? '四个阶段，一条可追溯的线。' : 'Four stages. One traceable thread.'}</h2></div><button className="portfolio-text-link" onClick={onDemo}>{zh ? '亲自体验' : 'Walk through it'} ↗</button></div>
    <div className="portfolio-flow">{stages[language].map(([name, title, text], i) => <article className="portfolio-flow-step" data-reveal key={name}><span className="portfolio-flow-marker">0{i + 1}</span><div><p className="portfolio-eyebrow">{name}</p><h3>{title}</h3><p>{text}</p></div><span className="portfolio-flow-arrow" aria-hidden="true">↗</span></article>)}</div>
  </section>;
}

const nodes = {
  en: [
    ['Registry', 'ERC-721', 'CarbonCreditNFT', 'Applications, reviewer decisions and project metadata. Reduction data and reviewer permissions remain administrator-managed.'],
    ['Credits', 'ERC-20', 'CarbonCredit', 'Project-associated issuance and retirement totals, fungible balances and certificate lookup. Transfers do not retain project-specific token lots.'],
    ['Vault', 'COLLATERAL', 'CarbonCreditVault', 'NFT custody, CC borrowing, partial repayment and overdue liquidation. Collateral appraisal is manual; there is no price oracle.'],
    ['Treasury', 'ALLOCATION', 'CarbonCreditTreasury', 'CC funding and owner-controlled allocation. The current dashboard exposes treasury balance.'],
    ['Governance', 'SEPARATE', 'Multisig + Timelock', 'Independent governance prototypes. The deployment does not transfer application ownership to these contracts.'],
  ],
  zh: [
    ['项目登记', 'ERC-721', 'CarbonCreditNFT', '存储申请、审核决定和项目元数据。减排数据与审核权限仍由管理员管理。'],
    ['碳信用', 'ERC-20', 'CarbonCredit', '项目关联发行、核销汇总、混合余额与凭证查询。转账不保留逐枚项目来源。'],
    ['抵押借贷', 'COLLATERAL', 'CarbonCreditVault', 'NFT 托管、CC 借贷、部分还款和逾期清算。采用人工估值，无价格预言机。'],
    ['金库', 'ALLOCATION', 'CarbonCreditTreasury', '接收 CC 并由管理员分配；当前界面展示金库余额。'],
    ['治理原型', 'SEPARATE', 'Multisig + Timelock', '独立的多签和时间锁原型，尚未接管应用合约的管理权限。'],
  ],
};

export function ArchitectureExplorer({ language, c }) {
  const [selected, setSelected] = useState(0);
  const list = nodes[language];
  const zh = language === 'zh';
  return <section id="architecture" className="portfolio-architecture" data-reveal aria-labelledby="architecture-title">
    <p className="portfolio-eyebrow">02 / UNDER THE SURFACE</p><h2 id="architecture-title">{c.architecture}</h2><p>{c.archText}</p>
    <div className="architecture-explorer"><div className="architecture-access"><span>REACT / ETHERS.JS</span><p>{zh ? '前端通过钱包或本地签名器直接访问合约' : 'Direct contract access through a wallet or local signer'}</p></div><div className="architecture-nodes" role="group" aria-label={zh ? '选择合约模块' : 'Select a contract module'}>{list.map(([name, type], i) => <button key={i} aria-pressed={selected === i} aria-controls="architecture-detail" className={i === 4 ? 'architecture-independent' : ''} onClick={() => setSelected(i)}><span>{type}</span><strong>{name}</strong><span aria-hidden="true">↗</span></button>)}</div><div id="architecture-detail" className="architecture-detail" role="status"><span>0{selected + 1} / {list[selected][1]}</span><h3>{list[selected][2]}</h3><p>{list[selected][3]}</p></div></div>
    <details className="architecture-full"><summary>{zh ? '展开完整系统架构图' : 'Open the complete architecture diagram'} <span aria-hidden="true">＋</span></summary><img src="/system-architecture.svg" alt={zh ? '合约调用关系、独立治理原型和链外证据边界' : 'Contract dependencies, independent governance and off-chain trust boundaries'} loading="lazy" /></details>
  </section>;
}

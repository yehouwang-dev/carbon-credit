const { chromium } = require('playwright');
const path = require('node:path');
const fs = require('node:fs');
(async()=>{
  const dir=path.resolve(__dirname,'../docs/media');fs.mkdirSync(dir,{recursive:true});
  const browser=await chromium.launch({headless:true,channel:'chrome'});
  const context=await browser.newContext({viewport:{width:1280,height:800},recordVideo:{dir:'/private/tmp/carbon-demo-recordings',size:{width:1280,height:800}}});
  const p=await context.newPage(); const errors=[];p.on('pageerror',e=>errors.push(e.message));
  try{
    await p.goto(process.env.DEMO_URL || 'http://127.0.0.1:18082/');
    await p.getByRole('heading',{name:'A clearer path from project to retirement.'}).waitFor();
    await p.evaluate(()=>{
      const box=document.createElement('div');box.id='recording-caption';box.style.cssText='position:fixed;left:32px;right:32px;bottom:16px;z-index:10000;background:#07130ff2;border:1px solid #729c76;border-radius:8px;padding:12px 18px;color:#e4f2df;font:15px/1.5 system-ui;box-shadow:0 6px 30px #0008;pointer-events:none';document.body.append(box);
    });
    const start=Date.now();
    const caption=async text=>{console.log(text);await p.locator('#recording-caption').evaluate((e,t)=>{e.textContent='SIMULATION ONLY · '+t},text)};
    const at=async (second,fn)=>{await p.waitForTimeout(Math.max(0,start+second*1000-Date.now()));await fn()};
    await caption('00:00 / 02:00 — A research prototype for project-linked carbon-credit traceability. Fictional data; no real assets.');
    await at(12,async()=>{await p.locator('#lifecycle-title').scrollIntoViewIfNeeded();await caption('00:12 — Review → issue → retire → query. Recorded approval does not establish real-world environmental validity.');});
    await at(26,async()=>{await p.locator('#architecture-title').scrollIntoViewIfNeeded();await p.getByRole('button',{name:/SEPARATE Governance/}).click();await caption('00:26 — Direct frontend-to-contract access. Multisig and timelock are separate primitives, not application owners.');});
    await at(40,async()=>{await p.getByRole('button',{name:'Try the simulation',exact:true}).first().click();await caption('00:40 — Wallet-free browser simulation. No RPC calls, testnet transactions, or blockchain certificates are created here.');});
    await at(50,async()=>{await p.getByRole('button',{name:'1. Approve sample project',exact:true}).click();await caption('00:50 — Approve the fictional sample project. Its recorded cap is 100 CC; this is a teaching fixture.');});
    await at(62,async()=>{await p.getByRole('button',{name:'2. Issue simulated credits',exact:true}).click();await caption('01:02 — Issue 100 simulated CC. Cumulative issuance now reaches the recorded cap.');});
    await at(75,async()=>{await p.getByRole('button',{name:'3. Retire simulated credits',exact:true}).click();await caption('01:15 — Retire 10 simulated CC. The balance falls to 90; retirement does not reopen cumulative issuance capacity.');});
    await at(88,async()=>{await p.getByRole('button',{name:'4. Find simulated record',exact:true}).click();await p.locator('.portfolio-query-result').evaluate(e=>e.scrollIntoView({block:'center'}));await caption('01:28 — Query SIM-ONLY-0001. This record exists only in this browser session, not on Sepolia.');});
    await at(101,async()=>{await p.getByPlaceholder('SIM-ONLY-0001').fill('SIM-ONLY-9999');await p.getByRole('button',{name:'4. Find simulated record',exact:true}).click();await caption('01:41 — An unknown simulation ID returns no record. The chain-query code separately distinguishes network faults and timeouts.');});
    await at(110,async()=>{await p.getByRole('button',{name:'Reset simulation',exact:true}).click();await p.locator('.portfolio-simulation').scrollIntoViewIfNeeded();await caption('01:50 — Reset the session. AI-assisted implementation; authorship, trust assumptions and limitations are documented separately.');});
    await at(120,async()=>{});
    if(errors.length)throw Error(errors.join('; '));
    const video=p.video();await context.close();const file=path.join(dir,'carbon-credit-demo-2026-10-27.webm');await video.saveAs(file);
    console.log(JSON.stringify({status:'PASS',file,bytes:fs.statSync(file).size,scope:'120-second captioned browser simulation; NOT Sepolia evidence'}));
  }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});

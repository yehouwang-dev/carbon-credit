import React, { useEffect, useRef, useState } from 'react';
import { ethers } from 'ethers';
import { useLanguage } from './i18n/useLanguage';
import { createContracts, deployment, isDeploymentConfigured } from './contracts/contracts';
import { createCertificateQuery } from './contracts/certificateQuery';
import { escapeHtml } from './contracts/escapeHtml';
import './App.css';

const EMPTY_STATS = {
  balance: '0',
  totalSupply: '0',
  totalMinted: '0',
  totalBurned: '0',
  maxSupply: '0',
  projectCount: 0,
  totalStaked: 0,
  treasuryBalance: '0',
  vaultLiquidity: '0',
  signers: 0,
  confirmations: 0,
  tokenPaused: false,
  nftPaused: false,
  vaultPaused: false,
};

function formatCC(value, digits = 2) {
  const number = Number(ethers.formatUnits(value || 0, 18));
  return new Intl.NumberFormat(undefined, { maximumFractionDigits: digits }).format(number);
}

function shortAddress(address) {
  return address ? `${address.slice(0, 6)}…${address.slice(-4)}` : '';
}

async function queryEventsInChunks(contract, filter, fromBlock, toBlock, chunkSize = 2000) {
  const events = [];
  for (let start = fromBlock; start <= toBlock; start += chunkSize) {
    const end = Math.min(start + chunkSize - 1, toBlock);
    events.push(...await contract.queryFilter(filter, start, end));
  }
  return events;
}

function App() {
  const { t, language, toggleLanguage } = useLanguage();
  const [provider, setProvider] = useState(null);
  const [contracts, setContracts] = useState(null);
  const [account, setAccount] = useState(null);
  const [network, setNetwork] = useState(null);
  const [walletMode, setWalletMode] = useState(null);
  const [isOwner, setIsOwner] = useState(false);
  const [roles, setRoles] = useState({ issuer: false, reviewer: false });
  const [stats, setStats] = useState(EMPTY_STATS);
  const [projects, setProjects] = useState([]);
  const [applications, setApplications] = useState([]);
  const [stakes, setStakes] = useState([]);
  const [retirements, setRetirements] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [txMessage, setTxMessage] = useState('');
  const [copied, setCopied] = useState(false);
  const [certificateQuery, setCertificateQuery] = useState(() => new URLSearchParams(window.location.search).get('certificate') || '');
  const [certificateRecord, setCertificateRecord] = useState(null);
  const [certificateLoading, setCertificateLoading] = useState(false);
  const translate = useRef(t);
  translate.current = t;
  const certificateLookup = useRef(null);
  if (!certificateLookup.current) certificateLookup.current = createCertificateQuery({
    onRecord: setCertificateRecord,
    onError: key => setErrorMessage(key ? translate.current(key) : ''),
    onLoading: setCertificateLoading,
  });
  useEffect(() => () => certificateLookup.current.cancel(), []);
  const [tokenForm, setTokenForm] = useState({ amount: '100', reason: '', recipient: '', projectId: '1', beneficiary: '' });
  const [projectForm, setProjectForm] = useState({
    name: '', type: 'Solar', reduction: '100', location: '', verifier: '', standard: 'VCS',
    vintage: '2026', documentHash: '', uri: '',
  });
  const [stakeForm, setStakeForm] = useState({ tokenId: '1', amount: '100', collateralValue: '10000', repayment: '10' });
  const [estimatedMaxLoan, setEstimatedMaxLoan] = useState('0');
  const [roleForm, setRoleForm] = useState({ address: '', role: 'reviewer' });

  const refreshData = async (activeContracts = contracts, activeAccount = account) => {
    if (!activeContracts || !activeAccount) return;
    setRefreshing(true);
    try {
      const token = activeContracts.CarbonCredit;
      const nft = activeContracts.CarbonCreditNFT;
      const vault = activeContracts.CarbonCreditVault;
      const [
        balance, totalSupply, totalMinted, totalBurned, maxSupply, owner,
        projectCount, totalStaked, treasuryBalance, vaultLiquidity,
        signers, confirmations, userStakes, issuer, reviewer, applicationCount,
        tokenPaused, nftPaused, vaultPaused,
      ] = await Promise.all([
        token.balanceOf(activeAccount), token.totalSupply(), token.totalMinted(), token.totalBurned(),
        token.maxTotalSupply(), token.owner(), nft.projectCount(), vault.totalStaked(),
        activeContracts.CarbonCreditTreasury.getBalance(),
        token.balanceOf(deployment.contracts.CarbonCreditVault),
        activeContracts.CarbonMultiSig.totalSigners(),
        activeContracts.CarbonMultiSig.requiredConfirmations(),
        vault.getUserStakes(activeAccount),
        token.issuers(activeAccount), nft.reviewers(activeAccount), nft.applicationCount(),
        token.paused(), nft.paused(), vault.paused(),
      ]);

      setIsOwner(owner.toLowerCase() === activeAccount.toLowerCase());
      setRoles({ issuer, reviewer });
      setStats({
        balance: formatCC(balance), totalSupply: formatCC(totalSupply),
        totalMinted: formatCC(totalMinted), totalBurned: formatCC(totalBurned),
        maxSupply: formatCC(maxSupply, 0), projectCount: Number(projectCount),
        totalStaked: Number(totalStaked), treasuryBalance: formatCC(treasuryBalance),
        vaultLiquidity: formatCC(vaultLiquidity), signers: Number(signers),
        confirmations: Number(confirmations),
        tokenPaused, nftPaused, vaultPaused,
      });

      const visibleProjects = [];
      for (let id = 1; id <= Number(projectCount); id += 1) {
        try {
          const projectOwner = await nft.ownerOf(id);
          const project = await nft.getProject(id);
          const [issued, retired, remaining] = await Promise.all([
            token.projectIssued(id), token.projectRetired(id), token.remainingProjectCapacity(id),
          ]);
          if (projectOwner.toLowerCase() === activeAccount.toLowerCase() || issuer || reviewer) {
            visibleProjects.push({
              tokenId: id, owner: projectOwner, name: project.projectName, type: project.projectType,
              reduction: (Number(project.emissionReduction) / 100).toLocaleString(),
              location: project.location, verifier: project.verifier, active: project.isActive,
              standard: project.standard, vintage: project.vintage, documentHash: project.documentHash,
              issued: formatCC(issued), retired: formatCC(retired), remaining: formatCC(remaining),
            });
          }
        } catch (error) {
          console.warn(`Unable to read project ${id}`, error);
        }
      }
      setProjects(visibleProjects);
      const visibleApplications = [];
      for (let id = 1; id <= Number(applicationCount); id += 1) {
        const application = await nft.getApplication(id);
        if (reviewer || application.applicant.toLowerCase() === activeAccount.toLowerCase()) {
          visibleApplications.push({
            id, applicant: application.applicant, name: application.projectName,
            type: application.projectType, reduction: Number(application.emissionReduction) / 100,
            standard: application.standard, vintage: application.vintage,
            documentHash: application.documentHash, status: Number(application.status),
            reviewReason: application.reviewReason, tokenId: Number(application.tokenId),
          });
        }
      }
      setApplications(visibleApplications.reverse());
      const stakeStatuses = await Promise.all(
        userStakes.map((stake) => vault.activeStakes(stake.tokenId))
      );
      setStakes(userStakes.filter((stake, index) =>
        stake.staker !== ethers.ZeroAddress && stakeStatuses[index]
      ));

      // Read an uncached head after writes; ethers' short getBlockNumber cache
      // can otherwise omit a just-confirmed retirement from the event window.
      const latestBlock = Number(await activeContracts.CarbonCredit.runner.provider.send('eth_blockNumber', []));
      const burnEvents = await queryEventsInChunks(
        token,
        token.filters.CarbonRetired(null, activeAccount),
        deployment.deploymentBlock || 0,
        latestBlock,
      );
      setRetirements(burnEvents.slice(-10).reverse().map((event) => ({
        hash: event.transactionHash,
        certificateId: event.args.certificateId,
        projectId: Number(event.args.projectTokenId),
        amount: formatCC(event.args.amount),
        beneficiary: event.args.beneficiary,
        reason: event.args.reason,
        timestamp: new Date(Number(event.args.timestamp) * 1000).toLocaleString(),
      })));
      setErrorMessage('');
    } catch (error) {
      console.error(error);
      setErrorMessage(t('readDataFailed'));
    } finally {
      setRefreshing(false);
    }
  };

  const attachConnection = async (nextProvider, nextSigner, mode) => {
    certificateLookup.current.reset();
    const nextAccount = await nextSigner.getAddress();
    const nextNetwork = await nextProvider.getNetwork();
    if (Number(nextNetwork.chainId) !== deployment.chainId) {
      throw new Error(`${t('wrongNetwork')} ${deployment.chainId}`);
    }
    const nextContracts = createContracts(nextSigner);
    setProvider(nextProvider);
    setContracts(nextContracts);
    setAccount(nextAccount);
    setNetwork(nextNetwork);
    setWalletMode(mode);
    await refreshData(nextContracts, nextAccount);
  };

  const connectMetaMask = async () => {
    if (!isDeploymentConfigured) {
      setErrorMessage(t('deploymentNotConfigured'));
      return;
    }
    if (!window.ethereum) {
      setErrorMessage(t('pleaseInstallMetaMask'));
      return;
    }
    setLoading(true);
    try {
      await window.ethereum.request({ method: 'eth_requestAccounts' });
      const targetChainId = `0x${deployment.chainId.toString(16)}`;
      const currentChainId = await window.ethereum.request({ method: 'eth_chainId' });
      if (currentChainId.toLowerCase() !== targetChainId.toLowerCase()) {
        try {
          await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: targetChainId }],
          });
        } catch (switchError) {
          if (switchError.code !== 4902) throw switchError;
          const isSepolia = deployment.chainId === 11155111;
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: targetChainId,
              chainName: isSepolia ? 'Sepolia' : 'Hardhat Local',
              nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
              rpcUrls: [isSepolia
                ? (import.meta.env.VITE_PUBLIC_RPC_URL || 'https://ethereum-sepolia-rpc.publicnode.com')
                : (import.meta.env.VITE_LOCAL_RPC_URL || 'http://127.0.0.1:8545')],
              blockExplorerUrls: isSepolia ? ['https://sepolia.etherscan.io'] : [],
            }],
          });
        }
      }
      const nextProvider = new ethers.BrowserProvider(window.ethereum);
      await attachConnection(nextProvider, await nextProvider.getSigner(), 'metamask');
    } catch (error) {
      setErrorMessage(error?.message || t('walletConnectionFailed'));
    } finally {
      setLoading(false);
    }
  };

  const connectLocalDemo = async () => {
    if (deployment.network !== 'localhost' || !isDeploymentConfigured) {
      setErrorMessage(t('localDemoUnavailable'));
      return;
    }
    setLoading(true);
    try {
      const rpcUrl = import.meta.env.VITE_LOCAL_RPC_URL || 'http://127.0.0.1:8545';
      const nextProvider = new ethers.JsonRpcProvider(rpcUrl);
      await attachConnection(nextProvider, await nextProvider.getSigner(0), 'demo');
    } catch (error) {
      console.error(error);
      setErrorMessage(t('localNodeUnavailable'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!window.ethereum) return undefined;
    const handleChange = () => {
      if (walletMode === 'metamask') connectMetaMask();
    };
    window.ethereum.on('accountsChanged', handleChange);
    window.ethereum.on('chainChanged', handleChange);
    return () => {
      window.ethereum.removeListener('accountsChanged', handleChange);
      window.ethereum.removeListener('chainChanged', handleChange);
    };
  }, [walletMode]);

  useEffect(() => {
    if (!contracts || !stakeForm.tokenId) return;
    contracts.CarbonCreditVault.maxLoanFor(Number(stakeForm.tokenId))
      .then((value) => setEstimatedMaxLoan(formatCC(value)))
      .catch(() => setEstimatedMaxLoan('0'));
  }, [contracts, stakeForm.tokenId]);

  const disconnect = () => {
    certificateLookup.current.reset();
    setProvider(null); setContracts(null); setAccount(null); setNetwork(null);
    setWalletMode(null); setIsOwner(false); setStats(EMPTY_STATS);
    setRoles({ issuer: false, reviewer: false });
    setProjects([]); setApplications([]); setStakes([]); setRetirements([]); setTxMessage('');
  };

  const runTransaction = async (label, action) => {
    if (!contracts) return;
    setLoading(true); setErrorMessage(''); setTxMessage(`${label}: ${t('waitingConfirmation')}`);
    try {
      const transaction = await action();
      setTxMessage(`${label}: ${t('transactionPending')}`);
      await transaction.wait();
      setTxMessage(`${label}: ${t('transactionSuccess')}`);
      await refreshData();
    } catch (error) {
      console.error(error);
      const reason = error?.error?.message || error?.data?.message || error?.message || t('transactionFailed');
      setErrorMessage(reason.replace('execution reverted: ', ''));
      setTxMessage('');
    } finally {
      setLoading(false);
    }
  };

  const amountInWei = () => ethers.parseUnits(tokenForm.amount || '0', 18);
  const handleMint = () => runTransaction(t('mint'), () =>
    contracts.CarbonCredit.mintFromProject(
      Number(tokenForm.projectId),
      ethers.isAddress(tokenForm.recipient) ? tokenForm.recipient : account,
      amountInWei(),
      tokenForm.reason || 'Verified project issuance'
    )
  );
  const handleBurn = () => runTransaction(t('burn'), () =>
    contracts.CarbonCredit.retireFromProject(
      Number(tokenForm.projectId), amountInWei(),
      tokenForm.beneficiary || shortAddress(account),
      tokenForm.reason || 'Carbon retirement'
    )
  );
  const handleTransfer = () => runTransaction(t('transfer'), () =>
    contracts.CarbonCredit.transfer(tokenForm.recipient, amountInWei())
  );
  const handleCreateProject = () => runTransaction(t('submitProject'), () =>
    contracts.CarbonCreditNFT.submitProject(
      projectForm.name, projectForm.type,
      Math.round(Number(projectForm.reduction) * 100), projectForm.location,
      projectForm.verifier, projectForm.standard, projectForm.vintage,
      projectForm.documentHash,
      projectForm.uri || `ipfs://local-${Date.now()}`
    )
  );
  const handleReview = (applicationId, approved) => runTransaction(
    approved ? t('approve') : t('reject'),
    () => contracts.CarbonCreditNFT.reviewApplication(
      applicationId, approved, approved ? 'Documents verified' : 'Application requires revision'
    )
  );
  const handleRoleUpdate = (allowed) => runTransaction(
    allowed ? t('grantRole') : t('revokeRole'),
    () => roleForm.role === 'reviewer'
      ? contracts.CarbonCreditNFT.setReviewer(roleForm.address, allowed)
      : contracts.CarbonCredit.setIssuer(roleForm.address, allowed)
  );
  const handleSetCollateralValue = () => runTransaction(
    t('setAppraisal'),
    () => contracts.CarbonCreditVault.setCollateralValue(
      Number(stakeForm.tokenId), ethers.parseUnits(stakeForm.collateralValue || '0', 18)
    )
  );
  const handlePause = (contractName, shouldPause) => runTransaction(
    shouldPause ? t('pause') : t('resume'),
    () => {
      if (contractName === 'CarbonCredit') return contracts.CarbonCredit[shouldPause ? 'pause' : 'unpause']();
      if (contractName === 'CarbonCreditNFT') return contracts.CarbonCreditNFT[shouldPause ? 'pause' : 'unpause']();
      return contracts.CarbonCreditVault[shouldPause ? 'pauseNewStakes' : 'resumeNewStakes']();
    }
  );
  const handlePartialRepayment = (stake) => runTransaction(t('partialRepayment'), async () => {
    const amount = ethers.parseUnits(stakeForm.repayment || '0', 18);
    const approval = await contracts.CarbonCredit.approve(deployment.contracts.CarbonCreditVault, amount);
    await approval.wait();
    return contracts.CarbonCreditVault.repayLoan(stake.tokenId, amount);
  });
  const handleStake = () => runTransaction(t('stake'), async () => {
    const tokenId = Number(stakeForm.tokenId);
    const amount = ethers.parseUnits(stakeForm.amount || '0', 18);
    const approval = await contracts.CarbonCreditNFT.approve(deployment.contracts.CarbonCreditVault, tokenId);
    await approval.wait();
    return contracts.CarbonCreditVault.stakeNFT(tokenId, amount);
  });
  const handleUnstake = (stake) => runTransaction(t('unstake'), async () => {
    const repayment = stake.ccLocked;
    if (repayment !== 0n) {
      const approval = await contracts.CarbonCredit.approve(deployment.contracts.CarbonCreditVault, repayment);
      await approval.wait();
    }
    return contracts.CarbonCreditVault.unstakeNFT(stake.tokenId);
  });

  const copyAddress = async () => {
    if (!account) return;
    await navigator.clipboard.writeText(account);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  };

  const verifyCertificate = async () => {
    await certificateLookup.current.run(contracts?.CarbonCredit, certificateQuery);
  };

  const downloadCertificate = (item) => {
    const verificationUrl = `${window.location.origin}/?certificate=${item.certificateId}`;
    const html = `<!doctype html><html><head><meta charset="utf-8"><title>Carbon Retirement Certificate</title><style>body{font-family:Arial,sans-serif;background:#f4f7f4;padding:48px;color:#243328}.certificate{max-width:760px;margin:auto;background:white;border:10px solid #294f2f;padding:52px;text-align:center}.eyebrow{letter-spacing:.2em;color:#6b796e}.amount{font-size:54px;color:#294f2f;margin:24px 0}.details{text-align:left;margin-top:36px;border-top:1px solid #ccd6ce;padding-top:20px}.details p{overflow-wrap:anywhere}.seal{width:76px;height:76px;border:3px solid #b8913e;border-radius:50%;display:grid;place-items:center;margin:34px auto 0;color:#8a681f;font-weight:bold}</style></head><body><main class="certificate"><p class="eyebrow">CARBON CREDIT RETIREMENT</p><h1>Certificate of Retirement</h1><p>This certifies that the following carbon credits were permanently retired on-chain.</p><div class="amount">${escapeHtml(item.amount)} CC</div><div class="details"><p><strong>Certificate ID:</strong> ${escapeHtml(item.certificateId)}</p><p><strong>Beneficiary:</strong> ${escapeHtml(item.beneficiary)}</p><p><strong>Account:</strong> ${escapeHtml(account)}</p><p><strong>Project NFT:</strong> #${escapeHtml(item.projectId)}</p><p><strong>Purpose:</strong> ${escapeHtml(item.reason)}</p><p><strong>Time:</strong> ${escapeHtml(item.timestamp)}</p><p><strong>Transaction:</strong> ${escapeHtml(item.hash)}</p><p><strong>Chain ID:</strong> ${escapeHtml(network?.chainId)}</p><p><strong>Verification:</strong> ${escapeHtml(verificationUrl)}</p></div><div class="seal">VERIFIED</div></main></body></html>`;
    const url = URL.createObjectURL(new Blob([html], { type: 'text/html' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `carbon-retirement-${item.certificateId.slice(2, 12)}.html`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="App">
      <header className="header">
        <div><h1>{t('appTitle')}</h1><p>{t('appSubtitle')}</p></div>
        <div className="header-actions">
          <button className="lang-toggle" onClick={toggleLanguage}>{language === 'en' ? '中文' : 'English'}</button>
          {!account ? <>
            {deployment.network === 'localhost' && <button className="demo-btn" onClick={connectLocalDemo} disabled={loading || !isDeploymentConfigured}>{t('localDemo')}</button>}
            <button className="connect-btn" onClick={connectMetaMask} disabled={loading || !isDeploymentConfigured}>{t('connectWallet')}</button>
          </> : <button className="logout-btn" onClick={disconnect}>{t('disconnect')}</button>}
        </div>
      </header>

      <div className="status-bar">
        <span className={account ? 'connected' : 'disconnected'}>{account ? t('connected') : t('notConnected')}</span>
        {account && <>
          <span className="status-separator">•</span>
          <button className="address-button" onClick={copyAddress} title={account}>{shortAddress(account)}</button>
          <span className="network-badge">{walletMode === 'demo' ? t('localDemo') : network?.name}</span>
          {isOwner && <span className="owner-badge">{t('administrator')}</span>}
          {roles.reviewer && <span className="role-badge">{t('reviewerRole')}</span>}
          {roles.issuer && <span className="role-badge">{t('issuerRole')}</span>}
          {stats.tokenPaused && <span className="owner-badge">{t('creditsPaused')}</span>}
          {copied && <span className="copied-message">{t('copied')}</span>}
          <button className="refresh-button" onClick={() => refreshData()} disabled={refreshing}>{refreshing ? '…' : '↻'}</button>
        </>}
      </div>

      {errorMessage && <div className="error-banner" role="alert"><strong>{t('error')}:</strong> {errorMessage}<button onClick={() => setErrorMessage('')}>×</button></div>}
      {txMessage && <div className="success-banner">{txMessage}</div>}

      {!account ? (
        <main className="welcome">
          <div className="welcome-icon">◎</div>
          <h2>{t('welcomeTitle')}</h2>
          <p>{t('welcomeText')}</p>
          {deployment.network === 'sepolia' && <p className="network-notice">{t('sepoliaTestnetNotice')}</p>}
          {!isDeploymentConfigured ? (
            <p className="configuration-notice" role="status">{t('deploymentNotConfigured')}</p>
          ) : deployment.network === 'localhost' ? (
            <>
              <button className="demo-hero-button" onClick={connectLocalDemo} disabled={loading}>{loading ? t('loading') : t('enterDemo')}</button>
              <small>{t('demoHint')}</small>
            </>
          ) : (
            <>
              <button className="demo-hero-button" onClick={connectMetaMask} disabled={loading}>{loading ? t('loading') : t('connectWallet')}</button>
              <small>{t('sepoliaWalletHint')}</small>
            </>
          )}
        </main>
      ) : (
        <main className="content">
          <section className="metric-grid">
            <div className="metric-card"><span>{t('myBalance')}</span><strong>{stats.balance} CC</strong></div>
            <div className="metric-card"><span>{t('circulatingSupply')}</span><strong>{stats.totalSupply} CC</strong></div>
            <div className="metric-card"><span>{t('retiredTotal')}</span><strong>{stats.totalBurned} CC</strong></div>
            <div className="metric-card"><span>{t('verifiedProjects')}</span><strong>{stats.projectCount}</strong></div>
          </section>

          <section className="dashboard">
            <div className="card action-card">
              <h2>{t('tokenOperations')}</h2>
              <div className="form-grid">
                <label>{t('projectTokenId')}<input type="number" min="1" value={tokenForm.projectId} onChange={(e) => setTokenForm({...tokenForm, projectId: e.target.value})} /></label>
                <label>{t('amount')}<input type="number" min="0" value={tokenForm.amount} onChange={(e) => setTokenForm({...tokenForm, amount: e.target.value})} /></label>
                <label>{t('reason')}<input value={tokenForm.reason} onChange={(e) => setTokenForm({...tokenForm, reason: e.target.value})} placeholder={t('reasonPlaceholder')} /></label>
                <label>{t('beneficiary')}<input value={tokenForm.beneficiary} onChange={(e) => setTokenForm({...tokenForm, beneficiary: e.target.value})} placeholder={t('beneficiaryPlaceholder')} /></label>
                <label className="full-width">{t('recipient')}<input value={tokenForm.recipient} onChange={(e) => setTokenForm({...tokenForm, recipient: e.target.value})} placeholder={`${t('optional')} 0x…`} /></label>
              </div>
              <div className="actions">
                {roles.issuer && <button className="btn-primary" onClick={handleMint} disabled={loading}>{t('mint')}</button>}
                <button className="btn-danger" onClick={handleBurn} disabled={loading}>{t('burn')}</button>
                <button className="btn-secondary" onClick={handleTransfer} disabled={loading || !ethers.isAddress(tokenForm.recipient)}>{t('transfer')}</button>
              </div>
            </div>

            <div className="card action-card">
              <h2>{t('createProject')}</h2>
              <>
                <div className="form-grid compact">
                  <label>{t('projectName')}<input value={projectForm.name} onChange={(e) => setProjectForm({...projectForm, name: e.target.value})} /></label>
                  <label>{t('projectType')}<select value={projectForm.type} onChange={(e) => setProjectForm({...projectForm, type: e.target.value})}><option>Solar</option><option>Wind</option><option>Forestry</option><option>Carbon Capture</option></select></label>
                  <label>{t('reductionTons')}<input type="number" min="0" value={projectForm.reduction} onChange={(e) => setProjectForm({...projectForm, reduction: e.target.value})} /></label>
                  <label>{t('location')}<input value={projectForm.location} onChange={(e) => setProjectForm({...projectForm, location: e.target.value})} /></label>
                  <label>{t('verifier')}<input value={projectForm.verifier} onChange={(e) => setProjectForm({...projectForm, verifier: e.target.value})} /></label>
                  <label>{t('standard')}<select value={projectForm.standard} onChange={(e) => setProjectForm({...projectForm, standard: e.target.value})}><option>VCS</option><option>Gold Standard</option><option>CCER</option></select></label>
                  <label>{t('vintage')}<input value={projectForm.vintage} onChange={(e) => setProjectForm({...projectForm, vintage: e.target.value})} /></label>
                  <label>{t('documentHash')}<input value={projectForm.documentHash} onChange={(e) => setProjectForm({...projectForm, documentHash: e.target.value})} placeholder="ipfs:// or SHA-256" /></label>
                </div>
                <button className="btn-primary full-button" onClick={handleCreateProject} disabled={loading || !projectForm.name || !projectForm.location || !projectForm.verifier || !projectForm.documentHash}>{t('submitForReview')}</button>
              </>
            </div>
          </section>

          <section className="card applications-card">
            <h2>{roles.reviewer ? t('reviewQueue') : t('myApplications')}</h2>
            {applications.length ? <div className="application-list">{applications.map((application) => (
              <article className="application-item" key={application.id}>
                <div>
                  <span className={`status-pill status-${application.status}`}>{t(['pending', 'approved', 'rejected'][application.status])}</span>
                  <h3>#{application.id} {application.name}</h3>
                  <p>{application.type} · {application.standard} {application.vintage} · {application.reduction.toLocaleString()} tCO₂e</p>
                  <small>{t('applicant')}: {shortAddress(application.applicant)} · {application.documentHash}</small>
                  {application.reviewReason && <small>{t('reviewNote')}: {application.reviewReason}</small>}
                </div>
                {roles.reviewer && application.status === 0 && <div className="review-actions">
                  <button className="approve-button" onClick={() => handleReview(application.id, true)} disabled={loading}>{t('approve')}</button>
                  <button className="reject-button" onClick={() => handleReview(application.id, false)} disabled={loading}>{t('reject')}</button>
                </div>}
              </article>
            ))}</div> : <div className="empty-state">{t('noApplications')}</div>}
          </section>

          {isOwner && <section className="card role-card">
            <h2>{t('roleManagement')}</h2>
            <p>{t('roleManagementHint')}</p>
            <div className="role-form">
              <input value={roleForm.address} onChange={(e) => setRoleForm({...roleForm, address: e.target.value})} placeholder="0x…" />
              <select value={roleForm.role} onChange={(e) => setRoleForm({...roleForm, role: e.target.value})}>
                <option value="reviewer">{t('reviewerRole')}</option>
                <option value="issuer">{t('issuerRole')}</option>
              </select>
              <button className="approve-button" onClick={() => handleRoleUpdate(true)} disabled={loading || !ethers.isAddress(roleForm.address)}>{t('grantRole')}</button>
              <button className="reject-button" onClick={() => handleRoleUpdate(false)} disabled={loading || !ethers.isAddress(roleForm.address)}>{t('revokeRole')}</button>
            </div>
          </section>}

          <section className="two-column">
            <div className="card">
              <h2>{t('myProjects')}</h2>
              {projects.length ? <div className="project-list">{projects.map((project) => (
                <article className="project-item" key={project.tokenId}>
                  <div><span className="token-id">NFT #{project.tokenId} · {project.standard} {project.vintage}</span><h3>{project.name}</h3><p>{project.type} · {project.location} · {shortAddress(project.owner)}</p><small>{t('issued')}: {project.issued} CC · {t('retired')}: {project.retired} CC</small></div>
                  <div className="project-meta"><strong>{project.reduction} tCO₂e</strong><span>{t('remaining')}: {project.remaining} CC</span><span>{project.verifier}</span></div>
                </article>
              ))}</div> : <div className="empty-state">{t('noProjects')}</div>}
            </div>

            <div className="card">
              <h2>{t('nftFinance')}</h2>
              <div className="form-grid compact">
                <label>Token ID<input type="number" value={stakeForm.tokenId} onChange={(e) => setStakeForm({...stakeForm, tokenId: e.target.value})} /></label>
                <label>{t('loanAmount')}<input type="number" value={stakeForm.amount} onChange={(e) => setStakeForm({...stakeForm, amount: e.target.value})} /></label>
                <label>{t('collateralAppraisalCC')}<input type="number" min="1" value={stakeForm.collateralValue} onChange={(e) => setStakeForm({...stakeForm, collateralValue: e.target.value})} /></label>
              </div>
              {isOwner && <button className="btn-secondary full-button" onClick={handleSetCollateralValue} disabled={loading}>{t('saveAppraisal')}</button>}
              <small className="loan-hint">{t('maxLoanHint')} {estimatedMaxLoan} CC</small>
              <button className="btn-primary full-button" onClick={handleStake} disabled={loading || stats.vaultPaused || Number(stakeForm.amount) > Number(estimatedMaxLoan)}>{t('approveAndStake')}</button>
              <div className="stake-list">{stakes.map((stake) => (
                <div className="stake-item" key={stake.tokenId.toString()}><span>NFT #{stake.tokenId.toString()} · {formatCC(stake.ccLocked)} CC</span><div className="stake-actions"><input type="number" min="0" max={formatCC(stake.ccLocked)} aria-label={t('repaymentAmount')} value={stakeForm.repayment} onChange={(e) => setStakeForm({...stakeForm, repayment: e.target.value})} /><button onClick={() => handlePartialRepayment(stake)} disabled={loading || Number(stakeForm.repayment) <= 0 || Number(stakeForm.repayment) > Number(formatCC(stake.ccLocked))}>{t('partialRepayment')}</button><button onClick={() => handleUnstake(stake)} disabled={loading}>{t('repayAndUnstake')}</button></div></div>
              ))}</div>
            </div>
          </section>

          <section className="two-column">
            <div className="card">
              <h2>{t('retirementRecords')}</h2>
              {retirements.length ? retirements.map((item) => <div className="retirement-item" key={item.certificateId}><strong>{item.amount} CC</strong><div><span>{item.beneficiary} · NFT #{item.projectId}</span><small>{item.reason} · {item.timestamp}</small><small>{shortAddress(item.certificateId)}</small></div><button className="certificate-button" onClick={() => downloadCertificate(item)}>{t('downloadCertificate')}</button></div>) : <div className="empty-state">{t('noRetirements')}</div>}
            </div>
            <div className="card info-card">
              <h2>{t('systemStatus')}</h2>
              <div className="info-item"><span>{t('network')}</span><strong>{network?.chainId}</strong></div>
              <div className="info-item"><span>{t('vaultLiquidity')}</span><strong>{stats.vaultLiquidity} CC</strong></div>
              <div className="info-item"><span>{t('treasuryBalance')}</span><strong>{stats.treasuryBalance} CC</strong></div>
              <div className="info-item"><span>{t('activeStakes')}</span><strong>{stats.totalStaked}</strong></div>
              <div className="info-item"><span>{t('multisig')}</span><strong>{stats.confirmations}/{stats.signers}</strong></div>
              <div className="info-item"><span>{t('maxSupplyLabel')}</span><strong>{stats.maxSupply} CC</strong></div>
              <div className="info-item"><span>{t('creditIssuance')}</span><strong>{stats.tokenPaused ? t('paused') : t('active')}</strong></div>
            </div>
          </section>

          {isOwner && <section className="card emergency-card">
            <h2>{t('emergencyControls')}</h2>
            <p>{t('pauseExplanation')}</p>
            <div className="emergency-controls">
              {[
                ['CarbonCredit', t('creditIssuance'), stats.tokenPaused],
                ['CarbonCreditNFT', t('projectNFTs'), stats.nftPaused],
                ['CarbonCreditVault', t('newStakes'), stats.vaultPaused],
              ].map(([contractName, label, paused]) => <div className="emergency-row" key={contractName}>
                <span>{label}: <strong>{paused ? t('paused') : t('active')}</strong></span>
                <button className={paused ? 'approve-button' : 'reject-button'} onClick={() => handlePause(contractName, !paused)} disabled={loading}>{paused ? t('resume') : t('pause')}</button>
              </div>)}
            </div>
          </section>}

          <section className="card verifier-card">
            <h2>{t('verifyCertificate')}</h2>
            <div className="verify-row"><input aria-label={t('verifyCertificate')} value={certificateQuery} onChange={(e) => { certificateLookup.current.reset(); setCertificateQuery(e.target.value); }} placeholder="0x…" /><button className="btn-primary" onClick={verifyCertificate} disabled={certificateLoading}>{certificateLoading ? t('certificateQuerying') : t('verify')}</button></div>
            {certificateRecord && <div className="verified-record"><strong>✓ {t('certificateValid')}</strong><span>{certificateRecord.amount} CC · NFT #{certificateRecord.projectId}</span><span>{certificateRecord.beneficiary}</span><small>{certificateRecord.certificateId}</small></div>}
          </section>
        </main>
      )}
      <footer>{t('footerText')} · {deployment.network} · {deployment.deployedAt.slice(0, 10)}</footer>
    </div>
  );
}

export default App;

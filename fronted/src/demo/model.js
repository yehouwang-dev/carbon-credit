// A browser-only teaching model. No RPC, wallet, assets, or transactions.
export function createDemo() {
  return { approved: false, cap: 100, issued: 0, retired: 0, balance: 0, certificates: [] };
}

export function transitionDemo(state, action) {
  if (action.type === 'reset') return createDemo();
  if (action.type === 'approve') {
    if (state.approved) throw new Error('alreadyApproved');
    return { ...state, approved: true };
  }
  const amount = Number(action.amount);
  if (!Number.isSafeInteger(amount) || amount <= 0) throw new Error('invalidAmount');
  if (action.type === 'issue') {
    if (!state.approved) throw new Error('reviewFirst');
    if (state.issued + amount > state.cap) throw new Error('capExceeded');
    return { ...state, issued: state.issued + amount, balance: state.balance + amount };
  }
  if (action.type === 'retire') {
    if (amount > state.balance || state.retired + amount > state.issued) throw new Error('insufficientBalance');
    const beneficiary = String(action.beneficiary || '').trim();
    if (!beneficiary || beneficiary.length > 120) throw new Error('beneficiaryRequired');
    const certificate = { id: `SIM-ONLY-${String(state.certificates.length + 1).padStart(4, '0')}`, amount, beneficiary, projectId: 'SIM-PROJECT-1' };
    return { ...state, retired: state.retired + amount, balance: state.balance - amount, certificates: [...state.certificates, certificate] };
  }
  throw new Error('unknownAction');
}

export function queryDemoCertificate(state, id) {
  return state.certificates.find(c => c.id === String(id).trim()) || null;
}

import { formatUnits } from 'ethers';

const internalError = Symbol('certificate-query-error');
const failure = code => Object.assign(new Error(code), { code, [internalError]: true });
export const CERTIFICATE_TIMEOUT_MS = 10_000;

export function classifyCertificateError(error) {
  if (error?.[internalError]) return error.code;
  const codes = new Set();
  const reasons = [];
  const seen = new Set();
  function visit(value, depth = 0) {
    if (!value || typeof value !== 'object' || seen.has(value) || depth > 4) return;
    seen.add(value);
    codes.add(value.code);
    if (typeof value.reason === 'string') reasons.push(value.reason);
    if (value.revert?.name === 'Error' && typeof value.revert.args?.[0] === 'string') reasons.push(value.revert.args[0]);
    for (const key of ['error', 'cause', 'info', 'data']) visit(value[key], depth + 1);
  }
  visit(error);
  if (codes.has('TIMEOUT')) return 'certificateLookupTimeout';
  if (codes.has('NETWORK_ERROR') || codes.has('OFFCHAIN_FAULT')) return 'certificateSourceUnavailable';
  // Only an explicit contract revert establishes absence. An empty revert,
  // server failure, or message containing the words is not sufficient evidence.
  if (codes.has('CALL_EXCEPTION') && reasons.includes('CarbonCredit: certificate not found')) return 'certificateNotFound';
  if (codes.has('SERVER_ERROR') || codes.has('BAD_DATA') || codes.has('UNKNOWN_ERROR')) return 'certificateSourceUnavailable';
  return 'certificateLookupFailed';
}

function normalizeRecord(record, id) {
  if (!record || record.certificateId?.toLowerCase() !== id.toLowerCase() ||
      !/^0x[0-9a-f]{40}$/i.test(record.account || '') || /^0x0{40}$/i.test(record.account) ||
      typeof record.beneficiary !== 'string' || !record.beneficiary.trim()) throw failure('certificateSourceUnavailable');
  const projectId = Number(record.projectTokenId);
  const timestamp = Number(record.timestamp);
  const amount = BigInt(record.amount);
  if (!Number.isSafeInteger(projectId) || projectId < 1 || !Number.isSafeInteger(timestamp) || timestamp < 1 || amount <= 0n) throw failure('certificateSourceUnavailable');
  return {
    certificateId: record.certificateId, account: record.account, beneficiary: record.beneficiary,
    projectId, amount: new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 }).format(Number(formatUnits(amount, 18))),
    reason: String(record.reason || ''), timestamp: new Date(timestamp * 1000).toLocaleString(),
  };
}

export function lookupCertificate(contract, id, { timeoutMs = CERTIFICATE_TIMEOUT_MS, signal } = {}) {
  if (!/^0x[0-9a-f]{64}$/i.test(id || '')) return Promise.reject(failure('invalidCertificateId'));
  if (!contract?.getRetirement) return Promise.reject(failure('certificateSourceUnavailable'));
  if (!Number.isFinite(timeoutMs) || timeoutMs <= 0) return Promise.reject(failure('certificateLookupFailed'));
  if (signal?.aborted) return Promise.reject(failure('certificateQueryCancelled'));
  return new Promise((resolve, reject) => {
    let done = false;
    let timer;
    const finish = (error, value) => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      signal?.removeEventListener('abort', abort);
      error ? reject(error) : resolve(value);
    };
    const abort = () => finish(failure('certificateQueryCancelled'));
    signal?.addEventListener('abort', abort, { once: true });
    timer = setTimeout(() => finish(failure('certificateLookupTimeout')), timeoutMs);
    Promise.resolve().then(() => contract.getRetirement(id)).then(record => {
      if (done) return;
      try { finish(null, normalizeRecord(record, id)); } catch (error) { finish(failure(classifyCertificateError(error))); }
    }, error => finish(failure(classifyCertificateError(error))));
  });
}

export function createCertificateQuery({ onRecord, onError, onLoading, timeoutMs = CERTIFICATE_TIMEOUT_MS }) {
  let serial = 0;
  let active;
  const invalidate = () => { serial += 1; active?.abort(); active = undefined; };
  return {
    cancel() { invalidate(); },
    reset() { invalidate(); onRecord(null); onError(''); onLoading(false); },
    async run(contract, id) {
      invalidate();
      const request = serial;
      const controller = new AbortController();
      active = controller;
      onRecord(null); onError(''); onLoading(true);
      try {
        const record = await lookupCertificate(contract, id, { timeoutMs, signal: controller.signal });
        if (request === serial) onRecord(record);
      } catch (error) {
        if (request === serial && error.code !== 'certificateQueryCancelled') onError(classifyCertificateError(error));
      } finally {
        if (request === serial) { active = undefined; onLoading(false); }
      }
    },
  };
}

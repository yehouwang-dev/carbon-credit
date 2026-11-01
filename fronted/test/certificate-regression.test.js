import test from 'node:test';
import assert from 'node:assert/strict';
import { createCertificateQuery, lookupCertificate, classifyCertificateError } from '../src/contracts/certificateQuery.js';
import { escapeHtml } from '../src/contracts/escapeHtml.js';
const ID = `0x${'12'.repeat(32)}`;
const OTHER = `0x${'34'.repeat(32)}`;
const record = { certificateId: ID, account: `0x${'11'.repeat(20)}`, beneficiary: 'Demo', projectTokenId: 1n, amount: 10n ** 18n, timestamp: 1791331200n };
const defer = () => { let resolve, reject; const promise = new Promise((r, j) => { resolve = r; reject = j; }); return { promise, resolve, reject }; };
const tick = () => new Promise(resolve => setTimeout(resolve, 0));
test('downloaded certificates escape user-provided HTML', () => {
  assert.equal(escapeHtml('<script>"x" & \'y\'</script>'), '&lt;script&gt;&quot;x&quot; &amp; &#39;y&#39;&lt;/script&gt;');
  assert.equal(escapeHtml(null), '');
});
function setup(timeoutMs = 1000) {
  const observed = { record: null, error: '', loading: false };
  const query = createCertificateQuery({ timeoutMs, onRecord: x => { observed.record = x; }, onError: x => { observed.error = x; }, onLoading: x => { observed.loading = x; } });
  return { observed, query };
}
test('late success after timeout cannot replace timeout result', async () => {
  const d = defer(); const { query, observed } = setup(15);
  await query.run({ getRetirement: () => d.promise }, ID);
  d.resolve(record); await tick();
  assert.equal(observed.record, null); assert.equal(observed.error, 'certificateLookupTimeout');
});
test('new request wins even when an old request returns later', async () => {
  const d = defer(); const { query, observed } = setup();
  const a = query.run({ getRetirement: () => d.promise }, ID); await tick();
  await query.run({ getRetirement: async () => ({ ...record, certificateId: OTHER }) }, OTHER);
  d.resolve(record); await a; await tick();
  assert.equal(observed.record.certificateId, OTHER); assert.equal(observed.loading, false);
});
test('input reset/disconnect cancels and clears visible state', async () => {
  const d = defer(); const { query, observed } = setup();
  const pending = query.run({ getRetirement: () => d.promise }, ID); await tick();
  query.reset(); d.resolve(record); await pending; await tick();
  assert.deepEqual(observed, { record: null, error: '', loading: false });
});
test('invalid input clears a previous success without contacting source', async () => {
  const { query, observed } = setup(); let calls = 0;
  const contract = { getRetirement: async () => { calls++; return record; } };
  await query.run(contract, ID); await query.run(contract, 'invalid');
  assert.equal(calls, 1); assert.equal(observed.record, null); assert.equal(observed.error, 'invalidCertificateId');
});
test('unknown/empty reverts and fabricated error codes do not establish absence', () => {
  for (const error of [{ code: 'CALL_EXCEPTION', reason: null }, { code: 'certificateNotFound' }, new Error('certificate not found')]) assert.notEqual(classifyCertificateError(error), 'certificateNotFound');
});
test('network fault has priority over misleading absence text', () => {
  assert.equal(classifyCertificateError({ code: 'NETWORK_ERROR', error: { code: 'CALL_EXCEPTION', reason: 'CarbonCredit: certificate not found' } }), 'certificateSourceUnavailable');
  assert.equal(classifyCertificateError({ code: 'CALL_EXCEPTION', revert: { name: 'Error', args: ['CarbonCredit: certificate not found'] } }), 'certificateNotFound');
});
test('mismatched or incomplete source data is not shown as verified', async () => {
  for (const value of [{ ...record, certificateId: OTHER }, { ...record, account: `0x${'00'.repeat(20)}` }, { ...record, amount: 0n }, null]) {
    await assert.rejects(lookupCertificate({ getRetirement: async () => value }, ID), { code: 'certificateSourceUnavailable' });
  }
});
test('missing source and aborted query have distinct outcomes', async () => {
  await assert.rejects(lookupCertificate(null, ID), { code: 'certificateSourceUnavailable' });
  const abort = new AbortController(); abort.abort();
  await assert.rejects(lookupCertificate({ getRetirement: async () => record }, ID, { signal: abort.signal }), { code: 'certificateQueryCancelled' });
});

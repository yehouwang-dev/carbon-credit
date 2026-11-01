import test from 'node:test';
import assert from 'node:assert/strict';
import { createCertificateQuery } from '../src/contracts/certificateQuery.js';

export const ID = `0x${'12'.repeat(32)}`;
export const UNKNOWN_ID = `0x${'34'.repeat(32)}`;
export const record = { certificateId: ID, account: `0x${'11'.repeat(20)}`, beneficiary: 'Portfolio Demo', projectTokenId: 1n, amount: 10n * 10n ** 18n, reason: 'Fictional test fixture', timestamp: 1791331200n };

function harness(getRetirement, timeoutMs = 25) {
  const observed = { record: null, error: '', loading: false, calls: [] };
  const controller = createCertificateQuery({
    timeoutMs,
    onRecord: value => { observed.record = value; },
    onError: value => { observed.error = value; },
    onLoading: value => { observed.loading = value; },
  });
  const contract = { getRetirement: id => { observed.calls.push(id); return getRetirement(id); } };
  return { observed, run: id => controller.run(contract, id) };
}

test('A01 正常查询：返回来源提供的匹配记录', async () => {
  const h = harness(async () => record);
  await h.run(ID);
  assert.deepEqual(h.observed.calls, [ID]);
  assert.equal(h.observed.record.certificateId, ID);
  assert.equal(h.observed.record.projectId, 1);
  assert.equal(h.observed.record.amount, '10');
  assert.equal(h.observed.record.beneficiary, 'Portfolio Demo');
  assert.equal(h.observed.error, '');
  assert.equal(h.observed.loading, false);
});

test('A02 无结果：仅明确的合约不存在错误才返回不存在', async () => {
  const h = harness(async () => { throw Object.assign(new Error('revert'), { code: 'CALL_EXCEPTION', reason: 'CarbonCredit: certificate not found' }); });
  await h.run(UNKNOWN_ID);
  assert.equal(h.observed.record, null);
  assert.equal(h.observed.error, 'certificateNotFound');
});

test('A03 工具超时：挂起请求达到可配置截止后结束', { timeout: 1000 }, async () => {
  const h = harness(() => new Promise(() => {}));
  await h.run(ID);
  assert.equal(h.observed.record, null);
  assert.equal(h.observed.error, 'certificateLookupTimeout');
  assert.equal(h.observed.loading, false);
});

test('A04 参数错误：拒绝无效ID，且不调用来源', async () => {
  for (const id of ['', 'hello', '0x1234', `0x${'zz'.repeat(32)}`]) {
    const h = harness(async () => record);
    await h.run(id);
    assert.equal(h.observed.calls.length, 0);
    assert.equal(h.observed.record, null);
    assert.equal(h.observed.error, 'invalidCertificateId');
  }
});

test('A05 来源不足：网络故障说明无法核实，不断言不存在', async () => {
  const h = harness(async () => { throw Object.assign(new Error('RPC unavailable'), { code: 'NETWORK_ERROR' }); });
  await h.run(ID);
  assert.equal(h.observed.record, null);
  assert.equal(h.observed.error, 'certificateSourceUnavailable');
  assert.equal(h.observed.loading, false);
});

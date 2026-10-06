import test from 'node:test';
import assert from 'node:assert/strict';
import { createDemo, transitionDemo, queryDemoCertificate } from './model.js';

test('review, issue, retire, and query a clearly simulated certificate', () => {
  let s = createDemo();
  s = transitionDemo(s, { type: 'approve' });
  s = transitionDemo(s, { type: 'issue', amount: 100 });
  s = transitionDemo(s, { type: 'retire', amount: 10, beneficiary: '<Demo reviewer>' });
  assert.equal(s.balance, 90);
  assert.equal(s.retired, 10);
  assert.equal(s.issued, 100);
  assert.equal(queryDemoCertificate(s, 'SIM-ONLY-0001').beneficiary, '<Demo reviewer>');
  assert.equal(queryDemoCertificate(s, '0xreal-looking'), null);
});
test('reject issuance before approval without mutating state', () => {
  const s = createDemo();
  assert.throws(() => transitionDemo(s, { type: 'issue', amount: 1 }), /reviewFirst/);
  assert.deepEqual(s, createDemo());
});
test('cumulative issuance cap is not replenished by retirement', () => {
  let s = transitionDemo(createDemo(), { type: 'approve' });
  s = transitionDemo(s, { type: 'issue', amount: 100 });
  s = transitionDemo(s, { type: 'retire', amount: 100, beneficiary: 'Demo' });
  assert.throws(() => transitionDemo(s, { type: 'issue', amount: 1 }), /capExceeded/);
});
test('reject invalid amounts, overspending and missing beneficiary', () => {
  let s = transitionDemo(createDemo(), { type: 'approve' });
  for (const amount of [0, -1, 1.5, NaN, Infinity, 'abc', Number.MAX_SAFE_INTEGER + 1]) {
    assert.throws(() => transitionDemo(s, { type: 'issue', amount }), /invalidAmount/);
  }
  s = transitionDemo(s, { type: 'issue', amount: 20 });
  assert.throws(() => transitionDemo(s, { type: 'retire', amount: 21, beneficiary: 'Demo' }), /insufficientBalance/);
  assert.throws(() => transitionDemo(s, { type: 'retire', amount: 1, beneficiary: ' ' }), /beneficiaryRequired/);
});
test('unique session IDs, repeat approval guard, and reset', () => {
  let s = transitionDemo(createDemo(), { type: 'approve' });
  assert.throws(() => transitionDemo(s, { type: 'approve' }), /alreadyApproved/);
  s = transitionDemo(s, { type: 'issue', amount: 2 });
  s = transitionDemo(s, { type: 'retire', amount: 1, beneficiary: 'A' });
  s = transitionDemo(s, { type: 'retire', amount: 1, beneficiary: 'B' });
  assert.notEqual(s.certificates[0].id, s.certificates[1].id);
  assert.deepEqual(transitionDemo(s, { type: 'reset' }), createDemo());
});

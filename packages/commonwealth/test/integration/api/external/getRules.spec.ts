import chai from 'chai';
import chaiHttp from 'chai-http';
import 'chai/register-should';
import type { GetRulesReq } from 'common-common/src/api/extApiTypes';
import { OrderByOptions } from 'common-common/src/api/extApiTypes';
import type { RuleAttributes } from 'server/models/rule';
import { get } from 'test/integration/api/external/appHook.spec';
import { testRules } from 'test/integration/api/external/dbEntityHooks.spec';

chai.use(chaiHttp);

describe('getRules Tests', () => {
  it('should return rules with specified community_id correctly', async () => {
    const r: GetRulesReq = {
      community_id: testRules[0].chain_id,
      count_only: false,
    };
    const resp = await get('/api/rules', r);

    chai.assert.lengthOf(resp.result.rules, 2);
  });

  it('should return count only when specified correctly', async () => {
    const r: GetRulesReq = {
      community_id: testRules[0].chain_id,
      count_only: true,
    };
    const resp = await get('/api/rules', r);

    chai.assert.equal(resp.result.count, 2);
    chai.assert.isUndefined(resp.result.rules);
  });

  it('should return rules with specified id correctly', async () => {
    const r: GetRulesReq = {
      community_id: testRules[0].chain_id,
      ids: [testRules[0].id],
    };

    let resp = await get('/api/rules', r);

    chai.assert.lengthOf(resp.result.rules, 1);

    r.ids.push(testRules[1].id);
    resp = await get('/api/rules', r);

    chai.assert.lengthOf(resp.result.rules, 2);
  });

  it('should paginate correctly', async () => {
    const r: GetRulesReq = { community_id: testRules[0].chain_id, limit: 1 };
    let resp = await get('/api/rules', r);

    chai.assert.lengthOf(resp.result.rules, 1);

    const first = resp.result.rules[0];
    const second = resp.result.rules[0];

    r.page = 2;
    resp = await get('/api/rules', r);

    chai.assert.lengthOf(resp.result.rules, 1);
    chai.assert.notDeepEqual(first, resp.result.rules);
    chai.assert.notDeepEqual(second, resp.result.rules);
  });

  it('should order correctly', async () => {
    const r: GetRulesReq = {
      community_id: testRules[0].chain_id,
      ids: [testRules[0].id],
      sort: OrderByOptions.CREATED,
    };
    let resp = await get('/api/rules', r);

    chai.assert.lengthOf(resp.result.rules, 1);
    chai.assert.deepEqual(
      resp.result.rules,
      ([...resp.result.rules] as RuleAttributes[]).sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )
    );

    r.sort = OrderByOptions.UPDATED;
    resp = await get('/api/rules', r);

    chai.assert.lengthOf(resp.result.rules, 1);
    chai.assert.deepEqual(
      resp.result.rules,
      ([...resp.result.rules] as RuleAttributes[]).sort(
        (a, b) =>
          new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
      )
    );
  });

  it('should handle errors correctly', async () => {
    let resp = await get('/api/rules', {}, true);

    chai.assert.lengthOf(resp.result, 1);
    chai.assert.equal(resp.result[0].msg, 'Invalid value(s)');

    resp = await get(
      '/api/rules',
      { community_id: testRules[0].chain_id, count_only: 3 },
      true
    );

    chai.assert.lengthOf(resp.result, 1);
    chai.assert.equal(resp.result[0].msg, 'Invalid value');
    chai.assert.equal(resp.result[0].param, 'count_only');
  });
});

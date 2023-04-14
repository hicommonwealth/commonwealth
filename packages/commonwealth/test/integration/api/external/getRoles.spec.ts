import chai from 'chai';
import chaiHttp from 'chai-http';
import 'chai/register-should';
import type { GetRolesReq } from 'common-common/src/api/extApiTypes';
import { OrderByOptions } from 'common-common/src/api/extApiTypes';
import type { RoleAttributes } from 'server/models/role';
import { get } from 'test/integration/api/external/appHook.spec';
import { testRoles } from 'test/integration/api/external/dbEntityHooks.spec';

chai.use(chaiHttp);

describe('getRoles Tests', () => {
  it('should return roles with specified community_id correctly', async () => {
    const r: GetRolesReq = {
      community_id: testRoles[0].chain_id,
      count_only: false,
    };
    const resp = await get('/api/roles', r);

    chai.assert.lengthOf(resp.result.roles, 2);
  });

  it('should return count only when specified correctly', async () => {
    const r: GetRolesReq = {
      community_id: testRoles[0].chain_id,
      count_only: true,
    };
    const resp = await get('/api/roles', r);

    chai.assert.equal(resp.result.count, 2);
    chai.assert.isUndefined(resp.result.roles);
  });

  it('should return roles with specified addresses correctly', async () => {
    const r: GetRolesReq = {
      community_id: testRoles[0].chain_id,
      addresses: ['testAddress-1'],
    };

    let resp = await get('/api/roles', r);

    chai.assert.lengthOf(resp.result.roles, 1);

    r.addresses.push('testAddress-2');
    resp = await get('/api/roles', r);

    chai.assert.lengthOf(resp.result.roles, 2);
  });

  it('should paginate correctly', async () => {
    const r: GetRolesReq = { community_id: testRoles[0].chain_id, limit: 1 };
    let resp = await get('/api/roles', r);

    chai.assert.lengthOf(resp.result.roles, 1);

    const first = resp.result.roles[0];
    const second = resp.result.roles[0];

    r.page = 2;
    resp = await get('/api/roles', r);

    chai.assert.lengthOf(resp.result.roles, 1);
    chai.assert.notDeepEqual(first, resp.result.roles);
    chai.assert.notDeepEqual(second, resp.result.roles);
  });

  it('should order correctly', async () => {
    const r: GetRolesReq = {
      community_id: testRoles[0].chain_id,
      addresses: ['testAddress-2'],
      sort: OrderByOptions.CREATED,
    };
    let resp = await get('/api/roles', r);

    chai.assert.lengthOf(resp.result.roles, 1);
    chai.assert.deepEqual(
      resp.result.roles,
      ([...resp.result.roles] as RoleAttributes[]).sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )
    );

    r.sort = OrderByOptions.UPDATED;
    resp = await get('/api/roles', r);

    chai.assert.lengthOf(resp.result.roles, 1);
    chai.assert.deepEqual(
      resp.result.roles,
      ([...resp.result.roles] as RoleAttributes[]).sort(
        (a, b) =>
          new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
      )
    );
  });

  it('should handle errors correctly', async () => {
    let resp = await get('/api/roles', {}, true);

    chai.assert.lengthOf(resp.result, 1);
    chai.assert.equal(resp.result[0].msg, 'Invalid value');
    chai.assert.equal(resp.result[0].param, 'community_id');

    resp = await get(
      '/api/roles',
      { community_id: testRoles[0].chain_id, count_only: 3 },
      true
    );

    chai.assert.lengthOf(resp.result, 1);
    chai.assert.equal(resp.result[0].msg, 'Invalid value');
    chai.assert.equal(resp.result[0].param, 'count_only');
  });
});

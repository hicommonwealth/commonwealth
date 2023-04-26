require('dotenv').config();
import chai from 'chai';
import 'chai/register-should';
import chaiHttp from 'chai-http';
chai.use(chaiHttp);
const expect = chai.expect;

import { RedisCache } from 'common-common/src/redisCache';
import { RedisNamespaces } from 'common-common/src/types';
import { cacheDecorator } from 'common-common/src/cacheDecorator';
import app, { resetDatabase } from '../../../server-test';
import { connectToRedis } from '../../util/redisUtils';

describe('Cache Decorator', () => {
  const redisCache: RedisCache = new RedisCache();
  const route_namespace: RedisNamespaces = RedisNamespaces.Route_Response;

  before(async () => {
    await resetDatabase();
    await connectToRedis(redisCache);
    cacheDecorator.setCache(redisCache);
  });

  after(async () => {
    await redisCache.deleteNamespaceKeys(route_namespace);
    await redisCache.closeClient();
  });

  it('should call the /api/status route', async () => {
    const res = await chai
      .request(app)
      .get('/api/status')
      .set('Accept', 'application/json');
    expect(res.body).to.not.be.null;
    expect(res).to.have.status(200);
    expect(res.body).to.have.property('status', 'Success');
    expect(res).to.not.have.header('X-Cache', 'HIT');

    const res2 = await chai
      .request(app)
      .get('/api/status')
      .set('Accept', 'application/json');

    expect(res2).to.have.status(200);
    expect(res2).to.have.header('X-Cache', 'HIT');
    const valFromRedis = await redisCache.getKey(
      route_namespace,
      '/api/status'
    );
    expect(valFromRedis).to.not.be.null;
    expect(JSON.parse(valFromRedis)).to.be.deep.equal(res2.body);
    expect(res2.body).to.have.property('status', 'Success');
    expect(res2.body).to.be.deep.equal(res.body);
  });

  it('dont cache broken route /api/statusBroken route', async () => {
    const res = await chai
      .request(app)
      .get('/api/statusBroken')
      .set('Accept', 'application/json');
    expect(res.body).to.not.be.null;
    expect(res).to.have.status(500);
    expect(res).to.not.have.header('X-Cache', 'HIT');

    const res2 = await chai
      .request(app)
      .get('/api/statusBroken')
      .set('Accept', 'application/json');

    // check redis - no key should be set
    const valFromRedis = await redisCache.getKey(
      route_namespace,
      '/api/statusBroken'
    );
    expect(valFromRedis).to.be.null;
    expect(res).to.have.status(500);
    expect(res).to.not.have.header('X-Cache', 'HIT');
  });
});

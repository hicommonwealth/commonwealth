/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable global-require */
/* eslint-disable no-unused-expressions */
import chai from 'chai';
import chaiHttp from 'chai-http';
import 'chai/register-should';
import jwt from 'jsonwebtoken';
import { ApiEndpoints } from 'state/api/config';
import app, { resetDatabase } from '../../../server-test';
import { JWT_SECRET } from '../../../server/config';
import models from '../../../server/database';
import * as modelUtils from '../../util/modelUtils';

chai.use(chaiHttp);
const { expect } = chai;

let adminJWT;
let adminAddress;
let userJWT;
let userAddress;

describe('Topic Tests', () => {
  const chain = 'ethereum';
  const title = 'test title';
  const body = 'test body';
  const kind = 'discussion';
  const stage = 'discussion';

  before('reset database', async () => {
    await resetDatabase();
    let res = await modelUtils.createAndVerifyAddress({ chain });
    adminAddress = res.address;
    adminJWT = jwt.sign({ id: res.user_id, email: res.email }, JWT_SECRET);
    const isAdmin = await modelUtils.updateRole({
      address_id: res.address_id,
      chainOrCommObj: { chain_id: chain },
      role: 'admin',
    });
    expect(adminAddress).to.not.be.null;
    expect(adminJWT).to.not.be.null;
    expect(isAdmin).to.not.be.null;

    res = await modelUtils.createAndVerifyAddress({ chain });
    userAddress = res.address;
    userJWT = jwt.sign({ id: res.user_id, email: res.email }, JWT_SECRET);
    expect(userAddress).to.not.be.null;
    expect(userJWT).to.not.be.null;
  });

  describe('Bulk Topics', () => {
    before(async () => {
      const res = await modelUtils.createAndVerifyAddress({ chain });
      adminAddress = res.address;

      adminJWT = jwt.sign({ id: res.user_id, email: res.email }, JWT_SECRET);
      const isAdmin = await modelUtils.updateRole({
        address_id: res.address_id,
        chainOrCommObj: { chain_id: chain },
        role: 'admin',
      });
      expect(adminAddress).to.not.be.null;
      expect(adminJWT).to.not.be.null;
      expect(isAdmin).to.not.be.null;

      const topicInstance = await models.Topic.findOne({
        where: {
          community_id: chain,
          group_ids: [],
        },
      });

      const res2 = await modelUtils.createThread({
        chainId: chain,
        address: adminAddress,
        jwt: adminJWT,
        title,
        body,
        topicId: topicInstance.id,
        kind,
        stage,
        session: res.session,
        sign: res.sign,
      });
      expect(res2.status).to.be.equal('Success');
      expect(res2.result).to.not.be.null;
      expect(res2.result.Address).to.not.be.null;
      expect(res2.result.Address.address).to.equal(adminAddress);
    });

    it('Should pass /bulkTopics', async () => {
      const res = await chai.request
        .agent(app)
        .get(`/api${ApiEndpoints.BULK_TOPICS}`)
        .set('Accept', 'application/json')
        .query({
          chain,
          jwt: adminJWT,
        });
      expect(res.body).to.not.be.null;
      expect(res.body.status).to.be.equal('Success');
      expect(res.body.result).to.not.be.null;
      expect(res.body.result.length).to.be.equal(1);
    });
  });
});

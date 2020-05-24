/* eslint-disable no-unused-expressions */

import chai from 'chai';
import chaiHttp from 'chai-http';
import 'chai/register-should';
import jwt from 'jsonwebtoken';
import { NotificationCategories } from 'types';
import { NotificationSubscription } from 'models';
import app, { resetDatabase } from '../../../server-test';
import { JWT_SECRET } from '../../../server/config';
import * as modelUtils from '../../util/modelUtils';

import { Errors as createErrors } from '../../../server/routes/createRole';

chai.use(chaiHttp);
const { expect } = chai;

describe('Roles Test', () => {
  let jwtToken;
  let loggedInAddr;
  let loggedInAddrId;
  let adminUserId;
  const chain = 'ethereum';
  const community = 'staking';

  before('reset database', async () => {
    await resetDatabase();
    const res = await modelUtils.createAndVerifyAddress({ chain });
    loggedInAddr = res.address;
    loggedInAddrId = res.address_id;
    jwtToken = jwt.sign({ id: res.user_id, email: res.email }, JWT_SECRET);
    adminUserId = res.user_id;
  });

  describe('createRole tests', () => {
    it('should pass on joining public community', async () => {
      const res = await chai.request(app)
        .post('/api/createRole')
        .set('Accept', 'application/json')
        .send({
          jwt: jwtToken,
          community,
          address_id: loggedInAddrId,
        });
      expect(res.body.status).to.be.equal('Success');
      expect(res.body.result.address_id).to.be.equal(loggedInAddrId);
      expect(res.body.result.offchain_community_id).to.be.equal(community);
    });

    it('should fail on joining public community a second time', async () => {
      const res = await chai.request(app)
        .post('/api/createRole')
        .set('Accept', 'application/json')
        .send({
          jwt: jwtToken,
          community,
          address_id: loggedInAddrId,
        });
      expect(res.body.error).to.not.be.null;
      expect(res.body.error).to.be.equal(createErrors.RoleAlreadyExists);
    });

    it('should fail with invalid address_id', async () => {
      const res = await chai.request(app)
        .post('/api/createRole')
        .set('Accept', 'application/json')
        .send({
          jwt: jwtToken,
          community,
          address_id: 'loggedInAddrId',
        });
      expect(res.body.error).to.not.be.null;
      expect(res.body.error).to.be.equal(createErrors.InvalidAddress);
    });
  });
});

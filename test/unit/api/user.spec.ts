/* eslint-disable no-unused-expressions */
import chai from 'chai';
import chaiHttp from 'chai-http';
import 'chai/register-should';
import jwt from 'jsonwebtoken';
import app, { resetDatabase } from '../../../server-test';
import { JWT_SECRET } from '../../../server/config';
import * as modelUtils from '../../util/modelUtils';
import { Errors as emailErrors } from '../../../server/routes/updateUserEmailInterval';

const ethUtil = require('ethereumjs-util');
chai.use(chaiHttp);
const { expect } = chai;
const markdownThread = require('../../util/fixtures/markdownThread');

describe('User Model Routes', () => {
  before('reset database', async () => {
    await resetDatabase();
  });

  describe('/updateUserEmailInterval', () => {
    const community = 'staking';
    const chain = 'ethereum';
    let jwtToken;
    let userAddress;
    let userEmail;

    beforeEach('create new user', async () => {
      const res = await modelUtils.createAndVerifyAddress({ chain });
      userAddress = res.address;
      userEmail = res.email;
      jwtToken = jwt.sign({ id: res.user_id, email: userEmail }, JWT_SECRET);
      const isAdmin = await modelUtils.assignRole({
        address_id: res.address_id,
        chainOrCommObj: { offchain_community_id: community },
        role: 'admin',
      });
      expect(userAddress).to.not.be.null;
      expect(jwtToken).to.not.be.null;
      expect(isAdmin).to.not.be.null;
    });

    it.skip('should update user\'s email interval', async () => {
      // not sure how to initialize the user model with an email, or add one later
    });

    it('should fail when no new interval is passed in', async () => {
      const res = await chai.request(app)
        .post('/api/updateUserEmailInterval')
        .set('Accept', 'application/json')
        .send({
          jwt: jwtToken,
        });
      expect(res.body.error).to.not.be.null;
      expect(res.body.error).to.be.equal(emailErrors.NoInterval);
    });

    it('should fail when invalid interval is passed in', async () => {
      const interval = 'every other day';
      const res = await chai.request(app)
        .post('/api/updateUserEmailInterval')
        .set('Accept', 'application/json')
        .send({
          jwt: jwtToken,
          interval,
        });
      expect(res.body.error).to.not.be.null;
      expect(res.body.error).to.be.equal(emailErrors.InvalidInterval);
    });

    it('should fail when user doesn\'t have an email associated', async () => {
      const interval = 'weekly';
      const res = await chai.request(app)
        .post('/api/updateUserEmailInterval')
        .set('Accept', 'application/json')
        .send({
          jwt: jwtToken,
          interval,
        });
      expect(res.body.error).to.not.be.null;
      expect(res.body.error).to.be.equal(emailErrors.NoEmail);
    });
  });

  describe('/updateEmail', () => {
    const community = 'staking';
    const chain = 'ethereum';
    let jwtToken;
    let userAddress;
    let userEmail;

    beforeEach('create new user', async () => {
      const res = await modelUtils.createAndVerifyAddress({ chain });
      userAddress = res.address;
      userEmail = res.email;
      jwtToken = jwt.sign({ id: res.user_id, email: userEmail }, JWT_SECRET);
      const isAdmin = await modelUtils.assignRole({
        address_id: res.address_id,
        chainOrCommObj: { offchain_community_id: community },
        role: 'admin',
      });
      expect(userAddress).to.not.be.null;
      expect(jwtToken).to.not.be.null;
      expect(isAdmin).to.not.be.null;
    });

    it('should add an email to user with just an address', async () => {
      const email = 'test@commonwealth.im';
      const res = await chai.request(app)
        .post('/api/updateEmail')
        .set('Accept', 'application/json')
        .send({
          jwt: jwtToken,
          email,
        });
      console.dir(res.body);
      expect(res.body.error).to.be.null;
    });
  });
});

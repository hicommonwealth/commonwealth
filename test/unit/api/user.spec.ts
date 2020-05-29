/* eslint-disable no-unused-expressions */
import chai from 'chai';
import chaiHttp from 'chai-http';
import 'chai/register-should';
import jwt from 'jsonwebtoken';
import app, { resetDatabase } from '../../../server-test';
import { JWT_SECRET } from '../../../server/config';
import * as modelUtils from '../../util/modelUtils';

const ethUtil = require('ethereumjs-util');
chai.use(chaiHttp);
const { expect } = chai;
const markdownThread = require('../../util/fixtures/markdownThread');

describe('Tag Tests', () => {
  before('reset database', async () => {
    await resetDatabase();
  });

  describe('User Model Routes', () => {
    const community = 'staking';
    const chain = 'ethereum';
    let adminJWT;
    let adminAddress;

    describe('/updateUserEmailInterval', () => {

      beforeEach('create new user', async () => {
        const res = await modelUtils.createAndVerifyAddress({ chain });
        adminAddress = res.address;
        adminJWT = jwt.sign({ id: res.user_id, email: res.email }, JWT_SECRET);
        const isAdmin = await modelUtils.assignRole({
          address_id: res.address_id,
          chainOrCommObj: { offchain_community_id: community },
          role: 'admin',
        });
        console.dir(res.email);
        expect(adminAddress).to.not.be.null;
        expect(adminJWT).to.not.be.null;
        expect(isAdmin).to.not.be.null;
      });

      it('should update user\'s email interval', async () => {

      });

      it('should fail when no new interval is passed in', async () => {

      });

      it('should fail when user doesn\'t have an email associated', async () => {

      });
    });
  });
});

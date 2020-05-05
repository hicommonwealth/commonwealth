/* eslint-disable no-unused-expressions */

import chai from 'chai';
import chaiHttp from 'chai-http';
import 'chai/register-should';
import wallet from 'ethereumjs-wallet';
import jwt from 'jsonwebtoken';
import app, { resetDatabase } from '../../../server-test';
import { JWT_SECRET } from '../../../server/config';
import * as modelUtils from '../../util/modelUtils';

const ethUtil = require('ethereumjs-util');
chai.use(chaiHttp);
const { expect } = chai;

describe('API Tests', () => {
  before('reset database', async () => {
    await resetDatabase();
  });

  describe('address tests', () => {
    it('should call the /api/status route', async () => {
      const res = await chai.request(app)
        .get('/api/status')
        .set('Accept', 'application/json');
      expect(res.body).to.not.be.null;
    });

    it('should create an address', async () => {
      const keypair = wallet.generate();
      const address = `0x${keypair.getAddress().toString('hex')}`;
      const chain = 'ethereum';
      const res = await chai.request(app)
        .post('/api/createAddress')
        .set('Accept', 'application/json')
        .send({ address, chain });
      expect(res.body).to.not.be.null;
      expect(res.body.status).to.equal('Success');
      expect(res.body.result).to.be.not.null;
      expect(res.body.result.address).to.be.equal(address);
      expect(res.body.result.chain).to.equal(chain);
      expect(res.body.result.verification_token).to.be.not.null;
    });

    it('should verify an address', async () => {
      const keypair = wallet.generate();
      const address = `0x${keypair.getAddress().toString('hex')}`;
      const chain = 'ethereum';
      let res = await chai.request(app)
        .post('/api/createAddress')
        .set('Accept', 'application/json')
        .send({ address, chain });
      const token = res.body.result.verification_token;
      const msgHash = ethUtil.hashPersonalMessage(Buffer.from(token));
      const sig = ethUtil.ecsign(msgHash, Buffer.from(keypair.getPrivateKey(), 'hex'));
      const signature = ethUtil.toRpcSig(sig.v, sig.r, sig.s);
      res = await chai.request(app)
        .post('/api/verifyAddress')
        .set('Accept', 'application/json')
        .send({ address, chain, signature });
      expect(res.body).to.not.be.null;
      expect(res.body.status).to.equal('Success');
      expect(res.body.result).to.be.not.null;
      expect(res.body.result.user).to.be.not.null;
      expect(res.body.result.message).to.be.equal('Logged in');
    });
  });
});

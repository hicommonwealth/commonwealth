/* eslint-disable no-unused-expressions */

import chai from 'chai';
import chaiHttp from 'chai-http';
import 'chai/register-should';
import wallet from 'ethereumjs-wallet';
import jwt from 'jsonwebtoken';
import sleep from 'sleep-promise';
import moment from 'moment';
import app, { resetDatabase, closeServer } from '../../../server-test';
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

  describe('thread route tests', () => {
    let jwtToken;
    let loggedInAddr;
    const chain = 'ethereum';
    const community = 'staking';

    beforeEach(async () => {
      // get logged in address/user with JWT
      const result = await modelUtils.createAndVerifyAddress({ chain });
      loggedInAddr = result.address;
      jwtToken = jwt.sign({ id: result.user_id, email: result.email }, JWT_SECRET);
    });

    describe('/createThread', () => {
      it('should create a discussion thread', async () => {
        const title = 'test title';
        const body = 'test body';
        const res = await modelUtils.createThread({
          chain,
          address: loggedInAddr,
          jwt: jwtToken,
          title,
          body,
        });
        expect(res.status).to.equal('Success');
        expect(res.result).to.not.be.null;
        expect(res.result.title).to.equal(encodeURIComponent(title));
        expect(res.result.body).to.equal(encodeURIComponent(body));
        expect(res.result.Address).to.not.be.null;
        expect(res.result.Address.address).to.equal(loggedInAddr);
      });
    });

    describe('/viewCount', () => {
      it('should track views on chain', async () => {
        let res = await modelUtils.createThread({
          chain,
          address: loggedInAddr,
          jwt: jwtToken,
          title: 't',
          body: 't',
        });
        const object_id = res.result.id;

        // should track first view
        res = await chai.request(app)
          .post('/api/viewCount')
          .set('Accept', 'application/json')
          .send({ chain, object_id });
        expect(res.status).to.equal(200);
        expect(res.body).to.not.be.null;
        expect(res.body.status).to.equal('Success');
        expect(res.body.result).to.not.be.null;
        expect(res.body.result.view_count).to.equal(1);

        // should ignore second view, same IP
        res = await chai.request(app)
          .post('/api/viewCount')
          .set('Accept', 'application/json')
          .send({ chain, object_id });
        expect(res.status).to.equal(200);
        expect(res.body).to.not.be.null;
        expect(res.body.status).to.equal('Success');
        expect(res.body.result).to.not.be.null;
        expect(res.body.result.view_count).to.equal(1);

        // sleep a second and verify cache invalidation
        await sleep(1000);
        res = await chai.request(app)
          .post('/api/viewCount')
          .set('Accept', 'application/json')
          .send({ chain, object_id });
        expect(res.status).to.equal(200);
        expect(res.body).to.not.be.null;
        expect(res.body.status).to.equal('Success');
        expect(res.body.result).to.not.be.null;
        expect(res.body.result.view_count).to.equal(2);
      });

      it('should track views on community', async () => {
        let res = await modelUtils.createThread({
          chain,
          community,
          address: loggedInAddr,
          jwt: jwtToken,
          title: 't',
          body: 't'
        });
        const object_id = res.result.id;

        // should track first view
        res = await chai.request(app)
          .post('/api/viewCount')
          .set('Accept', 'application/json')
          .send({ community, object_id });
        expect(res.status).to.equal(200);
        expect(res.body).to.not.be.null;
        expect(res.body.status).to.equal('Success');
        expect(res.body.result).to.not.be.null;
        expect(res.body.result.view_count).to.equal(1);
      });

      it('should not track views without object_id', async () => {
        const res = await chai.request(app)
          .post('/api/viewCount')
          .set('Accept', 'application/json')
          .send({ chain });
        expect(res.status).to.equal(500);
        expect(res.body).to.not.be.null;
        expect(res.body.error).to.equal('Must provide object_id');
      });

      it('should not track views without chain or community', async () => {
        const res = await chai.request(app)
          .post('/api/viewCount')
          .set('Accept', 'application/json')
          .send({ object_id: '9999' });
        expect(res.status).to.equal(500);
        expect(res.body).to.not.be.null;
        expect(res.body.error).to.equal('Must provide chain or community');
      });

      it('should not track views with invalid chain or community', async () => {
        const res = await chai.request(app)
          .post('/api/viewCount')
          .set('Accept', 'application/json')
          .send({ chain: 'adkgjkjgda', object_id: '9999' });
        expect(res.status).to.equal(500);
        expect(res.body).to.not.be.null;
        expect(res.body.error).to.equal('Invalid community or chain');
      });

      it('should not track views with invalid object_id', async () => {
        const res = await chai.request(app)
          .post('/api/viewCount')
          .set('Accept', 'application/json')
          .send({ chain, object_id: '9999' });
        expect(res.status).to.equal(500);
        expect(res.body).to.not.be.null;
        expect(res.body.error).to.equal('Invalid offchain thread');
      });
    });
  });
});

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

chai.use(chaiHttp);
const { expect } = chai;

describe('Update Community/Chain Tests', () => {
  let jwtToken;
  let loggedInAddr;
  const chain = 'ethereum';
  let offchainCommunity;

  before('reset database', async () => {
    await resetDatabase();
    // get logged in address/user with JWT
    const result = await modelUtils.createAndVerifyAddress({ chain });
    loggedInAddr = result.address;
    jwtToken = jwt.sign({ id: result.user_id, email: result.email }, JWT_SECRET);
    const isAdmin = await modelUtils.assignRole({
      address_id: result.address_id,
      chainOrCommObj: { chain_id: chain },
      role: 'admin',
    });

    // create community for test
    const communityArgs: modelUtils.CommunityArgs = {
      jwt: jwtToken,
      isAuthenticatedForum: 'false',
      privacyEnabled: 'false',
      invitesEnabled: 'false',
      id: 'tester',
      name: 'tester community',
      creator_id: result.user_id,
      creator_address: loggedInAddr,
      creator_chain: chain,
      description: 'Tester community community',
      default_chain: chain,
    };

    offchainCommunity = await modelUtils.createCommunity(communityArgs);
  });

  describe('/updateChain route tests', () => {
    it('should update chain name', async () => {
      const name = 'commonwealtheum';
      const res = await chai.request(app)
        .post('/api/updateChain')
        .set('Accept', 'application/json')
        .send({ jwt: jwtToken, id: chain, name, });
      expect(res.body.status).to.be.equal('Success');
      expect(res.body.result.name).to.be.equal(name);
    });

    it('should update description', async () => {
      const description = 'hello this the new chain';
      const res = await chai.request(app)
        .post('/api/updateChain')
        .set('Accept', 'application/json')
        .send({ jwt: jwtToken, id: chain, description, });
      expect(res.body.status).to.be.equal('Success');
      expect(res.body.result.description).to.be.equal(description);
    });

    it('should update symbol', async () => {
      const symbol = 'CWL';
      const res = await chai.request(app)
        .post('/api/updateChain')
        .set('Accept', 'application/json')
        .send({ jwt: jwtToken, id: chain, symbol, });
      expect(res.body.status).to.be.equal('Success');
      expect(res.body.result.symbol).to.be.equal(symbol);
    });

    it('should update icon_url', async () => {
      const icon_url = '/static/img/protocols/cwl.png';
      const res = await chai.request(app)
        .post('/api/updateChain')
        .set('Accept', 'application/json')
        .send({ jwt: jwtToken, id: chain, icon_url, });
      expect(res.body.status).to.be.equal('Success');
      expect(res.body.result.icon_url).to.be.equal(icon_url);
    });

    it('should update active', async () => {
      const active = false;
      const res = await chai.request(app)
        .post('/api/updateChain')
        .set('Accept', 'application/json')
        .send({ jwt: jwtToken, id: chain, active, });
      expect(res.body.status).to.be.equal('Success');
      expect(res.body.result.active).to.be.equal(active);
    });

    it('should update type', async () => {
      const type = 'parachain';
      const res = await chai.request(app)
        .post('/api/updateChain')
        .set('Accept', 'application/json')
        .send({ jwt: jwtToken, id: chain, type, });
      expect(res.body.status).to.be.equal('Success');
      expect(res.body.result.type).to.be.equal(type);
    });

    it('should fail to update network', async () => {
      const network = 'ethereum-testnet';
      const res = await chai.request(app)
        .post('/api/updateChain')
        .set('Accept', 'application/json')
        .send({ jwt: jwtToken, id: chain, network, });
      expect(res.body.error).to.not.be.null;
      expect(res.body.error).to.be.equal('Cannot change chain network');
    });
  });

  describe('/updateCommunity route tests', () => {
    it('should update community name', async () => {
      const name = 'commonwealth tester community';
      const res = await chai.request(app)
        .post('/api/updateCommunity')
        .set('Accept', 'application/json')
        .send({ jwt: jwtToken, id: offchainCommunity.id, name, });
      expect(res.body.status).to.be.equal('Success');
      expect(res.body.result.name).to.be.equal(name);
    });

    it('should update community description', async () => {
      const description = 'for me! and the tester community';
      const res = await chai.request(app)
        .post('/api/updateCommunity')
        .set('Accept', 'application/json')
        .send({ jwt: jwtToken, id: offchainCommunity.id, description, });
      expect(res.body.status).to.be.equal('Success');
      expect(res.body.result.description).to.be.equal(description);
    });
  });
});

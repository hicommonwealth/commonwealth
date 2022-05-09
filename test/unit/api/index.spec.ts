/* eslint-disable no-unused-expressions */

import chai from 'chai';
import chaiHttp from 'chai-http';
import 'chai/register-should';
import wallet from 'ethereumjs-wallet';
import { signTypedData, SignTypedDataVersion } from '@metamask/eth-sig-util';
import app, { resetDatabase } from '../../../server-test';
import * as modelUtils from '../../util/modelUtils';
import { constructTypedMessage } from '../../../shared/adapters/chain/ethereum/keys';

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
      const wallet_id = 'metamask';
      const res = await chai.request(app)
        .post('/api/createAddress')
        .set('Accept', 'application/json')
        .send({ address, chain, wallet_id });
      expect(res.body).to.not.be.null;
      expect(res.body.status).to.equal('Success');
      expect(res.body.result).to.be.not.null;
      expect(res.body.result.address).to.be.equal(address);
      expect(res.body.result.chain).to.equal(chain);
      expect(res.body.result.verification_token).to.be.not.null;
    });

    it('should verify an address', async () => {
      const { keypair, address } = modelUtils.generateEthAddress();
      const chain = 'ethereum';
      const wallet_id = 'metamask';
      let res = await chai.request(app)
        .post('/api/createAddress')
        .set('Accept', 'application/json')
        .send({ address, chain, wallet_id });
      const token = res.body.result.verification_token;
      const chain_id = 1;   // use ETH mainnet for testing
      const data = constructTypedMessage(chain_id, token);
      const privateKey = keypair.getPrivateKey();
      const signature = signTypedData({ privateKey, data, version: SignTypedDataVersion.V4 });
      res = await chai.request(app)
        .post('/api/verifyAddress')
        .set('Accept', 'application/json')
        .send({ address, chain, signature, wallet_id });
      expect(res.body).to.not.be.null;
      expect(res.body.status).to.equal('Success');
      expect(res.body.result).to.be.not.null;
      expect(res.body.result.user).to.be.not.null;
      expect(res.body.result.message).to.be.equal('Logged in');
    });
  });
});

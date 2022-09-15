/* eslint-disable no-unused-expressions */
import { ethers } from 'ethers';
import chai from 'chai';
import chaiHttp from 'chai-http';
import 'chai/register-should';
import wallet from 'ethereumjs-wallet';
import { signTypedData, SignTypedDataVersion } from '@metamask/eth-sig-util';
import app, { resetDatabase } from '../../../server-test';
import * as modelUtils from '../../util/modelUtils';
import { constructTypedMessage, TEST_BLOCK_INFO_STRING } from '../../../shared/adapters/chain/ethereum/keys';

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
        .send({ address, chain, wallet_id, block_info: TEST_BLOCK_INFO_STRING });
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
        .send({ address, chain, wallet_id, block_info: TEST_BLOCK_INFO_STRING });
      const token = res.body.result.verification_token;
      const chain_id = 1;   // use ETH mainnet for testing
      const sessionWallet = ethers.Wallet.createRandom()
      const { msgParams, sessionPayload } = await constructTypedMessage(address, chain_id, sessionWallet.address, TEST_BLOCK_INFO_STRING);
      const privateKey = keypair.getPrivateKey();
      const signature = signTypedData({ privateKey, data: msgParams, version: SignTypedDataVersion.V4 });
      res = await chai.request(app)
        .post('/api/verifyAddress')
        .set('Accept', 'application/json')
        .send({
          address,
          chain,
          signature,
          wallet_id,
          session_public_address: sessionWallet.address,
          session_block_data: TEST_BLOCK_INFO_STRING,
        });
      expect(res.body).to.not.be.null;
      expect(res.body.status).to.equal('Success');
      expect(res.body.result).to.be.not.null;
      expect(res.body.result.user).to.be.not.null;
      expect(res.body.result.message).to.be.equal('Logged in');
    });
  });
});

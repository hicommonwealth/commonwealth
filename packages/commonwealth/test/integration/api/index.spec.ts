/* eslint-disable no-unused-expressions */
import { ChainBase } from '@hicommonwealth/core';
import { personalSign } from '@metamask/eth-sig-util';
import chai from 'chai';
import chaiHttp from 'chai-http';

import wallet from 'ethereumjs-wallet';
import { ethers } from 'ethers';
import { bech32ToHex } from 'shared/utils';
import * as siwe from 'siwe';
import app, { resetDatabase } from '../../../server-test';
import {
  TEST_BLOCK_INFO_BLOCKHASH,
  TEST_BLOCK_INFO_STRING,
  createSiweMessage,
} from '../../../shared/adapters/chain/ethereum/keys';
import { createCanvasSessionPayload } from '../../../shared/canvas';
import * as modelUtils from '../../util/modelUtils';

chai.use(chaiHttp);
const { expect } = chai;

describe('API Tests', () => {
  before('reset database', async () => {
    await resetDatabase();
  });

  describe('address tests', () => {
    it('should call the /api/status route', async () => {
      const res = await chai
        .request(app)
        .get('/api/status')
        .set('Accept', 'application/json');
      expect(res.body).to.not.be.null;
    });

    it('should create an ETH address', async () => {
      const keypair = wallet.generate();
      const address = `0x${keypair.getAddress().toString('hex')}`;
      const chain = 'ethereum';
      const wallet_id = 'metamask';
      const res = await chai
        .request(app)
        .post('/api/createAddress')
        .set('Accept', 'application/json')
        .send({
          address,
          chain,
          wallet_id,
          block_info: TEST_BLOCK_INFO_STRING,
        });
      expect(res.body).to.not.be.null;
      expect(res.body.status).to.equal('Success');
      expect(res.body.result).to.be.not.null;
      expect(res.body.result.address).to.be.equal(address);
      expect(res.body.result.community_id).to.equal(chain);
      expect(res.body.result.verification_token).to.be.not.null;
    });

    it('should create a Cosmos address', async () => {
      const address = 'osmo18q3tlnx8vguv2fadqslm7x59ejauvsmnhltgq6';
      const expectedHex = await bech32ToHex(address);
      const community_id = 'osmosis';
      const wallet_id = 'keplr';
      const res = await chai
        .request(app)
        .post('/api/createAddress')
        .set('Accept', 'application/json')
        .send({
          address,
          chain: community_id,
          wallet_id,
          block_info: TEST_BLOCK_INFO_STRING,
        });
      expect(res.body).to.not.be.null;
      expect(res.body.status).to.equal('Success');
      expect(res.body.result).to.be.not.null;
      expect(res.body.result.address).to.be.equal(address);
      expect(res.body.result.hex).to.be.equal(expectedHex);
      expect(res.body.result.community_id).to.equal(community_id);
      expect(res.body.result.verification_token).to.be.not.null;
    });

    it('should verify an ETH address', async () => {
      const { keypair, address } = modelUtils.generateEthAddress();
      const community_id = 'ethereum';
      const wallet_id = 'metamask';
      let res = await chai
        .request(app)
        .post('/api/createAddress')
        .set('Accept', 'application/json')
        .send({
          address,
          chain: community_id,
          wallet_id,
          block_info: TEST_BLOCK_INFO_STRING,
        });
      const chain_id = '1'; // use ETH mainnet for testing
      const sessionWallet = ethers.Wallet.createRandom();
      const timestamp = 1665083987891;
      const message = createCanvasSessionPayload(
        'ethereum' as ChainBase,
        chain_id,
        address,
        sessionWallet.address,
        timestamp,
        TEST_BLOCK_INFO_BLOCKHASH,
      );
      // const data = getEIP712SignableSession(message);
      const nonce = siwe.generateNonce();
      const domain = 'https://commonwealth.test';
      const siweMessage = createSiweMessage(message, domain, nonce);
      const privateKey = keypair.getPrivateKey();
      const signatureData = personalSign({ privateKey, data: siweMessage });
      const signature = `${domain}/${nonce}/${signatureData}`;
      res = await chai
        .request(app)
        .post('/api/verifyAddress')
        .set('Accept', 'application/json')
        .send({
          address,
          chain: community_id,
          chain_id,
          signature,
          wallet_id,
          session_public_address: sessionWallet.address,
          session_timestamp: timestamp,
          session_block_data: TEST_BLOCK_INFO_STRING,
        });
      expect(res.body).to.not.be.null;
      expect(res.body.status).to.equal('Success');
      expect(res.body.result).to.be.not.null;
      expect(res.body.result.user).to.be.not.null;
      expect(res.body.result.message).to.be.equal('Signed in');
    });
  });
});

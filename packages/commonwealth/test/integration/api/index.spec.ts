/* eslint-disable no-unused-expressions */
import { SIWESigner } from '@canvas-js/chain-ethereum';
import { dispose } from '@hicommonwealth/core';
import {
  CANVAS_TOPIC,
  bech32ToHex,
  serializeCanvas,
} from '@hicommonwealth/shared';
import chai from 'chai';
import chaiHttp from 'chai-http';
import { afterAll, beforeAll, describe, expect, test } from 'vitest';
import { TestServer, testServer } from '../../../server-test';
import { TEST_BLOCK_INFO_STRING } from '../../util/keys';

chai.use(chaiHttp);

describe('API Tests', () => {
  let server: TestServer;

  beforeAll(async () => {
    server = await testServer(import.meta);
  });

  afterAll(async () => {
    await dispose()();
  });

  describe('address tests', () => {
    test('should call the /api/status route', async () => {
      const res = await chai
        .request(server.app)
        .get('/api/status')
        .set('Accept', 'application/json');
      expect(res.body).to.not.be.null;
    });

    test('should create an ETH address', async () => {
      const wallet = new SIWESigner({ chainId: 1 });
      const { payload: session } = await wallet.newSession(CANVAS_TOPIC);
      const address = session.did.split(':')[4];

      const chain = 'ethereum';
      const wallet_id = 'metamask';
      const res = await chai
        .request(server.app)
        .post('/api/createAddress')
        .set('Accept', 'application/json')
        .send({
          address,
          community_id: chain,
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

    test('should create a Cosmos address', async () => {
      const address = 'osmo18q3tlnx8vguv2fadqslm7x59ejauvsmnhltgq6';
      const expectedHex = await bech32ToHex(address);
      const community_id = 'osmosis';
      const wallet_id = 'keplr';
      const res = await chai
        .request(server.app)
        .post('/api/createAddress')
        .set('Accept', 'application/json')
        .send({
          address,
          community_id,
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

    test('should verify an ETH address', async () => {
      const chainId = '1'; // use ETH mainnet for testing

      const sessionSigner = new SIWESigner({ chainId: parseInt(chainId) });
      const { payload: session } = await sessionSigner.newSession(CANVAS_TOPIC);
      const address = session.did.split(':')[4];

      const community_id = 'ethereum';
      const wallet_id = 'metamask';
      let res = await chai
        .request(server.app)
        .post('/api/createAddress')
        .set('Accept', 'application/json')
        .send({
          address,
          community_id,
          wallet_id,
          block_info: TEST_BLOCK_INFO_STRING,
        });
      res = await chai
        .request(server.app)
        .post('/api/verifyAddress')
        .set('Accept', 'application/json')
        .send({
          address,
          community_id,
          wallet_id,
          session: serializeCanvas(session),
        });
      expect(res.body).to.not.be.null;
      expect(res.body.status).to.equal('Success');
      expect(res.body.result).to.be.not.null;
      expect(res.body.result.user).to.be.not.null;
      expect(res.body.result.message).to.be.equal('Signed in');
    });
  });
});

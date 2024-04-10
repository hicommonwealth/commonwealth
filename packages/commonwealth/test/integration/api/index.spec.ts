/* eslint-disable no-unused-expressions */
import { SIWESigner } from '@canvas-js/chain-ethereum';
import { dispose } from '@hicommonwealth/core';
import { encode, stringify } from '@ipld/dag-json';
import chai from 'chai';
import chaiHttp from 'chai-http';
import { bech32ToHex } from 'shared/utils';
import { TestServer, testServer } from '../../../server-test';
import { TEST_BLOCK_INFO_STRING } from '../../../shared/adapters/chain/ethereum/keys';
import { CANVAS_TOPIC } from '../../../shared/canvas';

chai.use(chaiHttp);
const { expect } = chai;

describe('API Tests', () => {
  let server: TestServer;

  before('reset database', async () => {
    server = await testServer();
  });

  after(async () => {
    await dispose()();
  });

  describe('address tests', () => {
    it('should call the /api/status route', async () => {
      const res = await chai
        .request(server.app)
        .get('/api/status')
        .set('Accept', 'application/json');
      expect(res.body).to.not.be.null;
    });

    it('should create an ETH address', async () => {
      const wallet = new SIWESigner({ chainId: 1 });
      const session = await wallet.getSession(CANVAS_TOPIC);

      const chain = 'ethereum';
      const wallet_id = 'metamask';
      const res = await chai
        .request(server.app)
        .post('/api/createAddress')
        .set('Accept', 'application/json')
        .send({
          address: session.address,
          community_id: chain,
          wallet_id,
          block_info: TEST_BLOCK_INFO_STRING,
        });
      expect(res.body).to.not.be.null;
      expect(res.body.status).to.equal('Success');
      expect(res.body.result).to.be.not.null;
      expect(res.body.result.address).to.be.equal(session.address);
      expect(res.body.result.community_id).to.equal(chain);
      expect(res.body.result.verification_token).to.be.not.null;
    });

    it('should create a Cosmos address', async () => {
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

    it('should verify an ETH address', async () => {
      const chainId = '1'; // use ETH mainnet for testing

      const sessionSigner = new SIWESigner({ chainId: parseInt(chainId) });
      const timestamp = 1665083987891;
      const session = await sessionSigner.getSession(CANVAS_TOPIC, {
        timestamp,
      });

      const community_id = 'ethereum';
      const wallet_id = 'metamask';
      let res = await chai
        .request(server.app)
        .post('/api/createAddress')
        .set('Accept', 'application/json')
        .send({
          address: session.address,
          community_id,
          wallet_id,
          block_info: TEST_BLOCK_INFO_STRING,
        });

      res = await chai
        .request(server.app)
        .post('/api/verifyAddress')
        .set('Accept', 'application/json')
        .send({
          address: session.address,
          community_id,
          wallet_id,
          session: stringify(encode(session)),
        });
      expect(res.body).to.not.be.null;
      expect(res.body.status).to.equal('Success');
      expect(res.body.result).to.be.not.null;
      expect(res.body.result.user).to.be.not.null;
      expect(res.body.result.message).to.be.equal('Signed in');
    });
  });
});

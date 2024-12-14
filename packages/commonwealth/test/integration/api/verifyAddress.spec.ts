import { SIWESigner } from '@canvas-js/chain-ethereum';
import { dispose } from '@hicommonwealth/core';
import { CANVAS_TOPIC, serializeCanvas } from '@hicommonwealth/shared';
import chai from 'chai';
import chaiHttp from 'chai-http';
import { Wallet } from 'ethers';
import { afterAll, beforeAll, describe, test } from 'vitest';
import { TestServer, testServer } from '../../../server-test';
import { TEST_BLOCK_INFO_STRING } from '../../util/keys';

chai.use(chaiHttp);
const { expect } = chai;

describe('Verify Address Routes', () => {
  let server: TestServer;
  let sessionSigner;
  let session;
  let walletAddress;

  const chain = 'ethereum';
  const wallet_id = 'metamask';
  const chain_id = '1';

  beforeAll(async () => {
    server = await testServer();

    sessionSigner = new SIWESigner({ chainId: parseInt(chain_id) });
    const { payload } = await sessionSigner.newSession(CANVAS_TOPIC);
    session = payload;
    walletAddress = session.did.split(':')[4];

    const res = await chai.request
      .agent(server.app)
      .post('/api/internal/SignIn')
      .set('Accept', 'application/json')
      .send({
        address: walletAddress,
        community_id: chain,
        wallet_id,
        block_info: TEST_BLOCK_INFO_STRING,
        session: serializeCanvas(session),
      });

    expect(res.body.role).to.be.equal('member');

    expect(res.body.address).to.be.equal(walletAddress);
    expect(res.body.community_id).to.be.equal(chain);
    expect(res.body.wallet_id).to.be.equal(wallet_id);
    expect(res.body.verification_token).to.not.be.equal(null);

    // TODO: fix this (not sure about these rules)
    // expect(res.body.verification_token_expires).to.not.be.equal(null);
    // expect(res.body.verified).to.be.equal(null);
  });

  afterAll(async () => {
    await dispose()();
  });

  describe('/signIn', () => {
    test('should create a new user with signIn', async () => {
      const res = await chai.request
        .agent(server.app)
        .post('/api/internal/SignIn')
        .set('Accept', 'application/json')
        .send({
          address: walletAddress,
          community_id: chain,
          chain_id,
          wallet_id,
          session: serializeCanvas(session),
        });

      expect(res.body.User.profile.email).to.be.undefined;
      expect(res.body.User.emailVerified).to.be.undefined;
      expect(res.body.address).to.be.equal(walletAddress);
    });

    test('should fail to create a new user if session is for wrong address', async () => {
      const altSessionSigner = new SIWESigner({
        chainId: parseInt(chain_id),
        signer: Wallet.createRandom(),
      });
      const { payload } = await altSessionSigner.newSession(CANVAS_TOPIC);
      const altSession = payload;

      const res = await chai.request
        .agent(server.app)
        .post('/api/internal/SignIn')
        .set('Accept', 'application/json')
        .send({
          address: walletAddress,
          community_id: chain,
          chain_id,
          wallet_id,
          session: serializeCanvas(altSession),
        });

      expect(res.body.code).to.be.equal('INTERNAL_SERVER_ERROR');
      expect(res.body.message).to.contain(
        'does not match addressModel.address',
      );
    });

    test('should fail to create a new user if session is for wrong topic', async () => {
      const { payload } = await sessionSigner.newSession('FAKE_TOPIC');
      const altSession = payload;

      const res = await chai.request
        .agent(server.app)
        .post('/api/internal/SignIn')
        .set('Accept', 'application/json')
        .send({
          address: walletAddress,
          community_id: chain,
          chain_id,
          wallet_id,
          session: serializeCanvas(altSession),
        });
      console.log(res.body);

      expect(res.body.code).to.be.equal('INTERNAL_SERVER_ERROR');
      expect(res.body.message).to.contain(' invalid SIWE signature');
    });
  });
});

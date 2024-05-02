import { models, tester } from '@hicommonwealth/model';
import { BalanceType } from '@hicommonwealth/shared';
import chai, { expect } from 'chai';
import chaiHttp from 'chai-http';
import * as dotenv from 'dotenv';
import { app } from '../src';

dotenv.config();

chai.use(chaiHttp);

describe('Snapshot Listener API', () => {
  before(async () => {
    await tester.bootstrap_testing(true);
    const [chainNode] = await tester.seed(
      'ChainNode',
      {
        url: 'https://ethereum-sepolia.publicnode.com',
        name: 'Sepolia Testnet',
        eth_chain_id: 11155111,
        balance_type: BalanceType.Ethereum,
        contracts: [],
      },
      { mock: false },
    );

    await tester.seed('Community', {
      chain_node_id: chainNode?.id,
      Addresses: [],
      CommunityStakes: [],
      snapshot_spaces: ['6969888.eth'],
    });
  });

  afterEach('Clean outbox', async () => {
    await models.Outbox.truncate();
  });

  const testSnapshotProposal = {
    id: 'proposal/0x7dc75736a57689459c73f8540586c2d1c8927dbe6a9da42f6fbc2f37c020a907',
    event: 'proposal/start',
    title: '1',
    body: '1',
    choices: ['21', '21'],
    space: '6969888.eth',
    start: 1710467951,
    expire: 1710727151,
    token: 'a88a91630b95e5e7ae9cd8610aff862d2b70383926b7236c973eedec46e0de65',
    secret: 'a88a91630b95e5e7ae9cd8610aff862d2b70383926b7236c973eedec46e0de65',
  };

  it('/ should return OK', async () => {
    const res = await chai.request(app).get('/');
    expect(res).to.have.status(200);
    expect(res.text).to.equal('OK!');
  });

  it('/snapshot should return 200 when valid JSON is sent', async () => {
    const res = await chai
      .request(app)
      .post('/snapshot')
      .send(testSnapshotProposal);
    expect(res).to.have.status(200);

    const outboxData = await models.Outbox.findAll({
      where: {
        event_name: 'SnapshotProposalCreated',
      },
    });

    expect(outboxData.length).to.equal(1);
    expect(outboxData[0].event_payload).to.deep.equal({
      ...testSnapshotProposal,
      id: '0x7dc75736a57689459c73f8540586c2d1c8927dbe6a9da42f6fbc2f37c020a907',
    });
  });

  it('/snapshot should return 400 with invalid data', async () => {
    const res = await chai.request(app).post('/snapshot').send(undefined);
    expect(res).to.have.status(400);
  });
}).timeout(5000);

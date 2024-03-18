import chai, { expect } from 'chai';
import * as dotenv from 'dotenv';
import { app } from '../src';
import chaiHttp = require('chai-http');

dotenv.config();

chai.use(chaiHttp);

describe('Snapshot Listener API', () => {
  const testSnapshotProposal = {
    id: 'proposal/0x7dc75736a57689459c73f8540586c2d1c8927dbe6a9da42f6fbc2f37c020a907',
    event: 'proposal/start',
    space: '6969888.eth',
    expire: 1710467951,
    token: 'a88a91630b95e5e7ae9cd8610aff862d2b70383926b7236c973eedec46e0de65',
    secret: 'a88a91630b95e5e7ae9cd8610aff862d2b70383926b7236c973eedec46e0de65',
  };
  const returnedPayload = {
    id: '0x7dc75736a57689459c73f8540586c2d1c8927dbe6a9da42f6fbc2f37c020a907',
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
    expect(res.body).to.deep.equal({
      message: 'Snapshot event received',
      event: {
        name: 'SnapshotProposalCreated',
        payload: returnedPayload,
      },
    });
  });

  it('/snapshot should return 400 with invalid data', async () => {
    const res = await chai.request(app).post('/snapshot').send(undefined);
    expect(res).to.have.status(400);
  });
});

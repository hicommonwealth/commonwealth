import { ActionArgument } from '@canvas-js/interfaces';
import chai from 'chai';
import chaiHttp from 'chai-http';
import 'chai/register-should';
import jwt from 'jsonwebtoken';
import * as modelUtils from 'test/util/modelUtils';
import app, { resetDatabase } from '../../../server-test';
import { JWT_SECRET } from '../../../server/config';

chai.use(chaiHttp);
const { expect } = chai;

describe('Polls', () => {
  const chain = 'ethereum';

  let userJWT;
  let userId;
  let userAddress;
  let userAddressId;

  let topicId;
  let threadId = 0;
  let pollId = 0;

  before(async () => {
    await resetDatabase();

    topicId = await modelUtils.getTopicId({ chain });
    const userRes = await modelUtils.createAndVerifyAddress({ chain });
    userAddress = userRes.address;
    userId = userRes.user_id;
    userAddressId = userRes.address_id;
    userJWT = jwt.sign(
      { id: userRes.user_id, email: userRes.email },
      JWT_SECRET,
    );
    expect(userAddress).to.not.be.null;
    expect(userJWT).to.not.be.null;
  });

  it('should create a poll for a thread', async () => {
    const { result: thread } = await modelUtils.createThread({
      chainId: 'ethereum',
      address: userAddress,
      jwt: userJWT,
      title: 'test1',
      body: 'body1',
      kind: 'discussion',
      stage: 'discussion',
      topicId,
      session: {
        type: 'session',
        signature: '',
        payload: {
          app: '',
          chain: '',
          from: '',
          sessionAddress: '',
          sessionDuration: 0,
          sessionIssued: 0,
          block: '',
        },
      },
      sign: function (actionPayload: {
        app: string;
        chain: string;
        from: string;
        call: string;
        callArgs: Record<string, ActionArgument>;
        timestamp: number;
        block: string;
      }): string {
        return '';
      },
    });

    const data = {
      prompt: 'hello',
      options: ['optionA', 'optionB'],
    };

    const res = await chai.request
      .agent(app)
      .post(`/api/threads/${thread.id}/polls`)
      .set('Accept', 'application/json')
      .send({
        author_chain: thread.community_id,
        chain: thread.community_id,
        address: userAddress,
        jwt: userJWT,
        ...data,
      });

    expect(res.status, JSON.stringify(res)).to.equal(200);
    expect(res.body.result).to.contain({
      prompt: data.prompt,
      options: JSON.stringify(data.options),
    });

    threadId = thread.id;
    pollId = res.body.result.id;
  });

  it('should fail to cast a vote with invalid option', async () => {
    const data = {
      option: 'optionC',
    };

    const res = await chai.request
      .agent(app)
      .put(`/api/polls/${pollId}/votes`)
      .set('Accept', 'application/json')
      .send({
        author_chain: chain,
        chain: chain,
        address: userAddress,
        jwt: userJWT,
        ...data,
      });

    expect(res.status).to.equal(400);
  });

  it('should cast a vote', async () => {
    const data = {
      option: 'optionA',
    };

    const res = await chai.request
      .agent(app)
      .put(`/api/polls/${pollId}/votes`)
      .set('Accept', 'application/json')
      .send({
        author_chain: chain,
        chain: chain,
        address: userAddress,
        jwt: userJWT,
        ...data,
      });

    expect(res.status).to.equal(200);
    expect(res.body.result).to.contain({
      option: data.option,
    });
  });

  it('should get thread polls, response shows poll and vote', async () => {
    const res = await chai.request
      .agent(app)
      .get(`/api/threads/${threadId}/polls`)
      .set('Accept', 'application/json')
      .query({
        chain: chain,
      });

    expect(res.status).to.equal(200);
    expect(res.body.result[0]).to.have.property('votes').with.length(1);
    expect(res.body.result[0].votes).to.have.length(1);
    expect(res.body.result[0].votes[0]).to.have.property('option', 'optionA');
    expect(res.body.result[0].votes[0]).to.have.property(
      'address',
      userAddress,
    );
  });

  it('should recast vote', async () => {
    const data = {
      option: 'optionB',
    };

    const res = await chai.request
      .agent(app)
      .put(`/api/polls/${pollId}/votes`)
      .set('Accept', 'application/json')
      .send({
        author_chain: chain,
        chain: chain,
        address: userAddress,
        jwt: userJWT,
        ...data,
      });

    expect(res.status).to.equal(200);
    expect(res.body.result).to.contain({
      option: data.option,
    });
  });

  it('should get thread polls, response shows updated poll and vote', async () => {
    const res = await chai.request
      .agent(app)
      .get(`/api/threads/${threadId}/polls`)
      .set('Accept', 'application/json')
      .query({
        chain: chain,
      });

    expect(res.status).to.equal(200);
    expect(res.body.result[0].votes[0]).to.have.property('option', 'optionB');
    expect(res.body.result[0].votes[0]).to.have.property(
      'address',
      userAddress,
    );
  });

  it('should get thread poll votes', async () => {
    const res = await chai.request
      .agent(app)
      .get(`/api/polls/${pollId}/votes`)
      .set('Accept', 'application/json')
      .query({
        chain: chain,
      });

    expect(res.status).to.equal(200);
    expect(res.body.result[0]).to.have.property('option', 'optionB');
    expect(res.body.result[0]).to.have.property('address', userAddress);
  });

  it('should delete poll', async () => {
    const res = await chai.request
      .agent(app)
      .delete(`/api/polls/${pollId}`)
      .set('Accept', 'application/json')
      .send({
        author_chain: chain,
        chain: chain,
        address: userAddress,
        jwt: userJWT,
      });

    expect(res.status).to.equal(200);
  });

  it('should get thread polls, response shows no results', async () => {
    const res = await chai.request
      .agent(app)
      .get(`/api/threads/${threadId}/polls`)
      .set('Accept', 'application/json')
      .query({
        chain: chain,
      });

    expect(res.status).to.equal(200);
    expect(Array.isArray(res.body.result)).to.be.true;
    expect(res.body.result).to.have.length(0);
  });
});

import type {
  Action,
  Awaitable,
  Message,
  Session,
  Signature,
} from '@canvas-js/interfaces';
import { command, dispose } from '@hicommonwealth/core';
import { Poll } from '@hicommonwealth/model';
import chai from 'chai';
import chaiHttp from 'chai-http';
import jwt from 'jsonwebtoken';
import { afterAll, beforeAll, describe, test } from 'vitest';
import { TestServer, testServer } from '../../../server-test';
import { config } from '../../../server/config';

chai.use(chaiHttp);
const { expect } = chai;

describe('Polls', () => {
  const chain = 'ethereum';

  let userJWT: string;
  let userId: number;
  let userAddress: string;
  let userDid: `did:${string}`;
  let userSession: {
    session: Session;
    sign: (payload: Message<Action | Session>) => Awaitable<Signature>;
  };

  let topicId;
  let threadId = 0;
  let pollId = 0;

  let server: TestServer;

  beforeAll(async () => {
    server = await testServer();

    const topic = await server.models.Topic.findOne({
      where: {
        community_id: chain,
        group_ids: [],
      },
    });
    // @ts-expect-error StrictNullChecks
    topicId = topic.id;

    const userRes = await server.seeder.createAndVerifyAddress(
      { chain },
      'Alice',
    );
    userAddress = userRes.address;
    userId = parseInt(userRes.user_id);
    userDid = userRes.did;
    userJWT = jwt.sign(
      { id: userRes.user_id, email: userRes.email },
      config.AUTH.JWT_SECRET,
    );
    userSession = {
      session: userRes.session,
      sign: userRes.sign,
    };
    expect(userAddress).to.not.be.null;
    expect(userDid).to.not.be.null;
    expect(userJWT).to.not.be.null;
  });

  afterAll(async () => {
    await dispose()();
  });

  test('should create a poll for a thread', async () => {
    const { result: thread } = await server.seeder.createThread({
      chainId: 'ethereum',
      address: userAddress,
      did: userDid,
      jwt: userJWT,
      title: 'test1',
      body: 'body1',
      kind: 'discussion',
      stage: 'discussion',
      topicId,
      session: userSession.session,
      sign: userSession.sign,
    });

    const data = {
      prompt: 'hello',
      options: ['optionA', 'optionB'],
    };

    const res = await chai.request
      .agent(server.app)
      // @ts-expect-error StrictNullChecks
      .post(`/api/threads/${thread.id}/polls`)
      .set('Accept', 'application/json')
      .send({
        // @ts-expect-error StrictNullChecks
        author_chain: thread.community_id,
        // @ts-expect-error StrictNullChecks
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

    // @ts-expect-error StrictNullChecks
    threadId = thread.id;
    pollId = res.body.result.id;
  });

  test('should fail to cast a vote with invalid option', async () => {
    try {
      await command(Poll.CreatePollVote(), {
        actor: {
          user: {
            id: userId,
            email: 'test@common.xyz',
          },
          address: userAddress,
        },
        payload: {
          poll_id: pollId,
          thread_id: threadId,
          option: 'optionC',
        },
      });
      expect.fail();
      // eslint-disable-next-line no-empty
    } catch (e) {}
  });

  test('should cast a vote', async () => {
    const res = await command(Poll.CreatePollVote(), {
      actor: {
        user: {
          id: userId,
          email: 'test@common.xyz',
        },
        address: userAddress,
      },
      payload: {
        poll_id: pollId,
        thread_id: threadId,
        option: 'optionA',
      },
    });
    expect(res).to.not.be.undefined;
    expect(res?.id).to.not.be.undefined;
  });

  test('should get thread polls, response shows poll and vote', async () => {
    const res = await chai.request
      .agent(server.app)
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

  test('should get thread poll votes', async () => {
    const res = await chai.request
      .agent(server.app)
      .get(`/api/polls/${pollId}/votes`)
      .set('Accept', 'application/json')
      .query({
        chain: chain,
      });

    expect(res.status).to.equal(200);
    expect(res.body.result[0]).to.have.property('option', 'optionA');
    expect(res.body.result[0]).to.have.property('address', userAddress);
  });

  test('should delete poll', async () => {
    const res = await chai.request
      .agent(server.app)
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

  test('should get thread polls, response shows no results', async () => {
    const res = await chai.request
      .agent(server.app)
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

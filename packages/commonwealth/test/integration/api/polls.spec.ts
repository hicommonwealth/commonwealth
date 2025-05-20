import type {
  Action,
  Awaitable,
  Message,
  Session,
  Signature,
} from '@canvas-js/interfaces';
import { command, dispose, query } from '@hicommonwealth/core';
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
      where: { community_id: chain },
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

    const res = await command(Poll.CreatePoll(), {
      actor: {
        user: {
          id: userId,
          email: 'test@common.xyz',
        },
        address: userAddress,
      },
      payload: {
        thread_id: thread!.id!,
        duration: null,
        ...data,
      },
    });
    expect(res).to.not.be.undefined;
    expect(res?.id).to.not.be.undefined;
    expect(res?.prompt).to.equal(data.prompt);
    expect(res?.options).to.deep.equal(data.options);

    threadId = thread!.id!;
    pollId = res!.id!;
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
    const res = await query(Poll.GetPolls(), {
      actor: {
        user: {
          id: userId,
          email: 'test@common.xyz',
        },
        address: userAddress,
      },
      payload: {
        thread_id: threadId,
      },
    });

    expect(res![0]).to.have.property('votes').with.length(1);
    expect(res![0].votes).to.have.length(1);
    expect(res![0].votes![0]).to.have.property('option', 'optionA');
    expect(res![0].votes![0]).to.have.property('address', userAddress);
  });

  test('should get thread poll votes', async () => {
    const res = await query(Poll.GetPollVotes(), {
      actor: {
        user: {
          id: userId,
          email: 'test@common.xyz',
        },
        address: userAddress,
      },
      payload: {
        poll_id: pollId,
      },
    });

    expect(res![0]).to.have.property('option', 'optionA');
    expect(res![0]).to.have.property('address', userAddress);
  });

  test('should delete poll', async () => {
    const res = await command(Poll.DeletePoll(), {
      actor: {
        user: {
          id: userId,
          email: 'test@common.xyz',
        },
        address: userAddress,
      },
      payload: {
        thread_id: threadId,
        poll_id: pollId,
      },
    });

    expect(res).to.be.true;
  });

  test('should get thread polls, response shows no results', async () => {
    const res = await query(Poll.GetPolls(), {
      actor: {
        user: {
          id: userId,
          email: 'test@common.xyz',
        },
        address: userAddress,
      },
      payload: {
        thread_id: threadId,
      },
    });

    expect(Array.isArray(res)).to.be.true;
    expect(res).to.have.length(0);
  });
});

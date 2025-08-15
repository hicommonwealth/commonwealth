import type {
  Action,
  Awaitable,
  Message,
  Session,
  Signature,
} from '@canvas-js/interfaces';
import { command, dispose, query } from '@hicommonwealth/core';
import { Poll } from '@hicommonwealth/model';
import { models } from '@hicommonwealth/model/db';
import jwt from 'jsonwebtoken';
import { afterAll, beforeAll, describe, expect, test } from 'vitest';
import { TestServer, testServer } from '../../../server-test';
import { config } from '../../../server/config';

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

    const topic = await models.Topic.findOne({
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
      allow_revotes: false,
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

  // Revotable polls tests
  describe('Revotable Polls', () => {
    let revotableThreadId = 0;
    let revotablePollId = 0;

    test('should create a revotable poll', async () => {
      const { result: thread } = await server.seeder.createThread({
        chainId: 'ethereum',
        address: userAddress,
        did: userDid,
        jwt: userJWT,
        title: 'revotable poll thread',
        body: 'test thread for revotable poll',
        kind: 'discussion',
        stage: 'discussion',
        topicId,
        session: userSession.session,
        sign: userSession.sign,
      });

      const data = {
        prompt: 'Should we allow revotes?',
        options: ['Yes', 'No', 'Maybe'],
        allow_revotes: true,
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
      expect(res?.allow_revotes).to.be.true;

      revotableThreadId = thread!.id!;
      revotablePollId = res!.id!;
    });

    test('should cast initial vote in revotable poll', async () => {
      const res = await command(Poll.CreatePollVote(), {
        actor: {
          user: {
            id: userId,
            email: 'test@common.xyz',
          },
          address: userAddress,
        },
        payload: {
          poll_id: revotablePollId,
          thread_id: revotableThreadId,
          option: 'Yes',
        },
      });

      expect(res).to.not.be.undefined;
      expect(res?.id).to.not.be.undefined;
      expect(res?.option).to.equal('Yes');
    });

    test('should verify initial vote in polls query', async () => {
      const res = await query(Poll.GetPolls(), {
        actor: {
          user: {
            id: userId,
            email: 'test@common.xyz',
          },
          address: userAddress,
        },
        payload: {
          thread_id: revotableThreadId,
        },
      });

      expect(res![0]).to.have.property('votes').with.length(1);
      expect(res![0].votes![0]).to.have.property('option', 'Yes');
      expect(res![0].votes![0]).to.have.property('address', userAddress);
    });

    test('should allow revoting and change vote option', async () => {
      const res = await command(Poll.CreatePollVote(), {
        actor: {
          user: {
            id: userId,
            email: 'test@common.xyz',
          },
          address: userAddress,
        },
        payload: {
          poll_id: revotablePollId,
          thread_id: revotableThreadId,
          option: 'No',
        },
      });

      expect(res).to.not.be.undefined;
      expect(res?.option).to.equal('No');
    });

    test('should verify updated vote in polls query after revoting', async () => {
      const res = await query(Poll.GetPolls(), {
        actor: {
          user: {
            id: userId,
            email: 'test@common.xyz',
          },
          address: userAddress,
        },
        payload: {
          thread_id: revotableThreadId,
        },
      });

      expect(res![0]).to.have.property('votes').with.length(1);
      expect(res![0].votes![0]).to.have.property('option', 'No');
      expect(res![0].votes![0]).to.have.property('address', userAddress);
    });

    test('should allow multiple revotes', async () => {
      // Change vote to third option
      const res = await command(Poll.CreatePollVote(), {
        actor: {
          user: {
            id: userId,
            email: 'test@common.xyz',
          },
          address: userAddress,
        },
        payload: {
          poll_id: revotablePollId,
          thread_id: revotableThreadId,
          option: 'Maybe',
        },
      });

      expect(res).to.not.be.undefined;
      expect(res?.option).to.equal('Maybe');

      // Verify the vote was updated
      const pollsRes = await query(Poll.GetPolls(), {
        actor: {
          user: {
            id: userId,
            email: 'test@common.xyz',
          },
          address: userAddress,
        },
        payload: {
          thread_id: revotableThreadId,
        },
      });

      expect(pollsRes![0].votes![0]).to.have.property('option', 'Maybe');
    });

    test('should verify vote count remains 1 after multiple revotes', async () => {
      const res = await query(Poll.GetPollVotes(), {
        actor: {
          user: {
            id: userId,
            email: 'test@common.xyz',
          },
          address: userAddress,
        },
        payload: {
          poll_id: revotablePollId,
        },
      });

      // Should still have only 1 vote (the latest one)
      expect(res).to.have.length(1);
      expect(res![0]).to.have.property('option', 'Maybe');
      expect(res![0]).to.have.property('address', userAddress);
    });
  });

  describe('Non-Revotable Polls', () => {
    let nonRevotableThreadId = 0;
    let nonRevotablePollId = 0;

    test('should create a non-revotable poll (default behavior)', async () => {
      const { result: thread } = await server.seeder.createThread({
        chainId: 'ethereum',
        address: userAddress,
        did: userDid,
        jwt: userJWT,
        title: 'non-revotable poll thread',
        body: 'test thread for non-revotable poll',
        kind: 'discussion',
        stage: 'discussion',
        topicId,
        session: userSession.session,
        sign: userSession.sign,
      });

      const data = {
        prompt: 'Final decision poll',
        options: ['Accept', 'Reject'],
        allow_revotes: false,
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
      expect(res?.allow_revotes).to.be.false;

      nonRevotableThreadId = thread!.id!;
      nonRevotablePollId = res!.id!;
    });

    test('should cast vote in non-revotable poll', async () => {
      const res = await command(Poll.CreatePollVote(), {
        actor: {
          user: {
            id: userId,
            email: 'test@common.xyz',
          },
          address: userAddress,
        },
        payload: {
          poll_id: nonRevotablePollId,
          thread_id: nonRevotableThreadId,
          option: 'Accept',
        },
      });

      expect(res).to.not.be.undefined;
      expect(res?.option).to.equal('Accept');
    });

    test('should fail to revote in non-revotable poll', async () => {
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
            poll_id: nonRevotablePollId,
            thread_id: nonRevotableThreadId,
            option: 'Reject',
          },
        });
        expect.fail(
          'Should have thrown an error for revoting in non-revotable poll',
        );
      } catch (e) {
        expect(e.message).to.include('User has already voted in this poll');
      }
    });

    test('should maintain original vote in non-revotable poll', async () => {
      const res = await query(Poll.GetPollVotes(), {
        actor: {
          user: {
            id: userId,
            email: 'test@common.xyz',
          },
          address: userAddress,
        },
        payload: {
          poll_id: nonRevotablePollId,
        },
      });

      expect(res).to.have.length(1);
      expect(res![0]).to.have.property('option', 'Accept');
      expect(res![0]).to.have.property('address', userAddress);
    });
  });
});

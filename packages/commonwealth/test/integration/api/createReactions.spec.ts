import { ActionPayload, Session } from '@canvas-js/interfaces';
import chai from 'chai';
import chaiHttp from 'chai-http';
import jwt from 'jsonwebtoken';
import app from '../../../server-test';
import { JWT_SECRET } from '../../../server/config';
import { CommentInstance } from '../../../server/models/comment';
import { ThreadInstance } from '../../../server/models/thread';
import {
  getTestAddress,
  getTestComment,
  getTestUserSession,
} from '../../util/getTestingRecords';
import * as modelUtils from '../../util/modelUtils';
import { del } from './external/appHook.spec';

chai.use(chaiHttp);

const deleteReaction = async (
  reactionId: number,
  jwtToken: string,
  userAddress: string,
  communityId: string,
) => {
  const validRequest = {
    jwt: jwtToken,
    address: userAddress,
    author_chain: communityId,
    chain: communityId,
  };

  const response = await del(
    `/api/reactions/${reactionId}`,
    validRequest,
    false,
    app,
  );

  return response;
};

describe('createReaction Integration Tests', () => {
  let userAddress: string;
  let userJWT: string;
  let userSession: {
    session: Session;
    sign: (payload: ActionPayload) => string;
  };
  let comment: CommentInstance;
  let thread: ThreadInstance;

  before(async () => {
    const { user, address, wallet } = await getTestAddress();
    userJWT = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET);
    userAddress = address.address;
    userSession = await getTestUserSession(address, wallet);

    const result = await getTestComment();
    comment = result.comment;
    thread = result.thread;
  });

  it('should create comment reactions and verify comment reaction count', async () => {
    const beforeReactionCount = comment.reaction_count;

    chai.assert.isNotNull(comment);

    const createReactionResponse = await modelUtils.createReaction({
      chain: comment.chain,
      address: userAddress,
      jwt: userJWT,
      reaction: 'like',
      comment_id: comment.id,
      author_chain: comment.chain,
      session: userSession.session,
      sign: userSession.sign,
    });

    chai.assert.equal(createReactionResponse.status, 'Success');

    await comment.reload();
    chai.assert.equal(comment.reaction_count, beforeReactionCount + 1);

    const reactionId = createReactionResponse.result.id;
    const deleteReactionResponse = await deleteReaction(
      reactionId,
      userJWT,
      userAddress,
      comment.chain,
    );
    chai.assert.equal(deleteReactionResponse.status, 'Success');

    await comment.reload();
    chai.assert.equal(comment.reaction_count, beforeReactionCount);
  });

  it('should create thread reactions and verify thread reaction count', async () => {
    chai.assert.isNotNull(thread);
    const beforeReactionCount = thread.reaction_count;

    const createReactionResponse = await modelUtils.createThreadReaction({
      chain: thread.chain,
      address: userAddress,
      jwt: userJWT,
      reaction: 'like',
      thread_id: thread.id,
      author_chain: thread.chain,
      session: userSession.session,
      sign: userSession.sign,
    });

    chai.assert.equal(createReactionResponse.status, 'Success');

    await thread.reload();
    chai.assert.equal(thread.reaction_count, beforeReactionCount + 1);

    const reactionId = createReactionResponse.result.id;
    const deleteReactionResponse = await deleteReaction(
      reactionId,
      userJWT,
      userAddress,
      thread.chain,
    );

    chai.assert.equal(deleteReactionResponse.status, 'Success');

    await thread.reload();
    chai.assert.equal(thread.reaction_count, beforeReactionCount);
  });
});

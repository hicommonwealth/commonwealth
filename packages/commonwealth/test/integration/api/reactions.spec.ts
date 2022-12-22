/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable global-require */
/* eslint-disable no-unused-expressions */
import chai from 'chai';
import chaiHttp from 'chai-http';
import 'chai/register-should';
import jwt from 'jsonwebtoken';
import sleep from 'sleep-promise';
import moment from 'moment';
import { Errors as CreateCommentErrors } from 'server/routes/createComment';
import app, { resetDatabase } from 'commonwealth/server-test';
import { JWT_SECRET } from 'commonwealth/server/config';
import * as modelUtils from 'commonwealth/test/util/modelUtils';
import { addAllowDenyPermissionsForCommunityRole, removeAllowDenyPermissionsForCommunityRole } from 'commonwealth/test/util/modelUtils';
import { Action, addAllowImplicitPermissions } from 'common-common/src/permissions';

chai.use(chaiHttp);
const { expect } = chai;
const markdownComment = require('../../util/fixtures/markdownComment');

export const Errors = {
  InvalidUser: 'Invalid user',
  NotPermitted: 'Action not permitted',
};

describe('Thread Tests', () => {
  const chain = 'ethereum';
  const chain2 = 'alex';
  // The createThread util uses the chainId parameter to determine
  // author_chain, which is required for authorship lookup.
  // Therefore, a valid chain MUST be included alongside
  // communityId, unlike in non-test thread creation
  const title = 'test title';
  const body = 'test body';
  const bodyWithMentions = 'test body [@Tagged Member](/edgeware/npRis4Nb)';
  const topicName = 'test topic';
  const topicId = undefined;
  const kind = 'discussion';
  const stage = 'discussion';

  const markdownThread = require('../../util/fixtures/markdownThread');
  let adminJWT;
  let adminAddress;
  let adminAddressId;
  let userJWT;
  let userId;
  let userAddress;
  let userAddressId;
  let userJWT2;
  let userId2;
  let userAddress2;
  let userAddressId2;
  let thread;
  let comment;

  before(async () => {
    await resetDatabase();
    let res = await modelUtils.createAndVerifyAddress({ chain });
    adminAddress = res.address;
    adminAddressId = res.address_id;
    adminJWT = jwt.sign({ id: res.user_id, email: res.email }, JWT_SECRET);
    const isAdmin = await modelUtils.updateRole({
      address_id: res.address_id,
      chainOrCommObj: { chain_id: chain },
      role: 'admin',
    });
    expect(adminAddress).to.not.be.null;
    expect(adminJWT).to.not.be.null;
    expect(isAdmin).to.not.be.null;

    res = await modelUtils.createAndVerifyAddress({ chain });
    userAddress = res.address;
    userId = res.user_id;
    userAddressId = res.address_id;
    userJWT = jwt.sign({ id: res.user_id, email: res.email }, JWT_SECRET);
    expect(userAddress).to.not.be.null;
    expect(userJWT).to.not.be.null;

    res = await modelUtils.createAndVerifyAddress({ chain: chain2 });
    userAddress2 = res.address;
    userId2 = res.user_id;
    userAddressId2 = res.address_id;
    userJWT2 = jwt.sign({ id: res.user_id, email: res.email }, JWT_SECRET);
    expect(userAddress2).to.not.be.null;
    expect(userJWT2).to.not.be.null;

    addAllowDenyPermissionsForCommunityRole('member', chain2, 0, Action.CREATE_THREAD);
  });

  describe('/createReaction', () => {
    beforeEach(async () => {
      const res2 = await modelUtils.createThread({
        address: userAddress,
        kind,
        stage,
        chainId: chain,
        title,
        topicName,
        topicId,
        body,
        jwt: userJWT,
      });
      expect(res2.status).to.be.equal('Success');
      expect(res2.result).to.not.be.null;
      thread = res2.result;

      const cRes = await modelUtils.createComment({
        chain,
        address: userAddress,
        jwt: userJWT,
        text: markdownComment.text,
        root_id: `discussion_${thread.id}`,
      });

      expect(cRes.status).to.equal('Success');
      expect(cRes.result).to.not.be.null;
      comment = cRes.result;
    });

    it('should create a comment and reaction for a thread', async () => {
      const rRes = await modelUtils.createReaction({
        chain,
        address: userAddress,
        jwt: userJWT,
        comment_id: comment.id,
        reaction: 'like',
        author_chain: chain,
      });

      expect(rRes.status).to.equal('Success');
      expect(rRes.result).to.not.be.null;
      expect(rRes.result.chain).to.equal(chain);
    });

    it('middelware should fail to create a reaction because user is not the author', async () => {
      const rRes = await modelUtils.createReaction({
        chain,
        address: userAddress2,
        jwt: userJWT2,
        comment_id: comment.id,
        reaction: 'like',
        author_chain: chain,
      });

      expect(rRes.status).to.equal(400);
      expect(rRes.error).to.not.be.null;
      expect(rRes.error).to.equal(Errors.InvalidUser);
    });

    it('should fail to create a reaction because user is not permitted to create a reaction', async () => {

      addAllowDenyPermissionsForCommunityRole('member', chain, undefined, Action.CREATE_REACTION);

      const rRes = await modelUtils.createReaction({
        chain,
        address: userAddress,
        jwt: userJWT,
        comment_id: comment.id,
        reaction: 'like',
        author_chain: chain,
      });

      expect(rRes.status).to.equal(400);
      expect(rRes.error).to.not.be.null;
      expect(rRes.error).to.equal(Errors.NotPermitted);

      // Set permissions back to default
      removeAllowDenyPermissionsForCommunityRole('member', chain, undefined, Action.CREATE_REACTION);
    });
  });

  describe('/viewReactions', () => {
    beforeEach(async () => {
      addAllowDenyPermissionsForCommunityRole('member', chain, Action.CREATE_THREAD, undefined);

      const res2 = await modelUtils.createThread({
        address: userAddress,
        kind,
        stage,
        chainId: chain,
        title,
        topicName,
        topicId,
        body,
        jwt: userJWT,
      });
      expect(res2.status).to.be.equal('Success');
      expect(res2.result).to.not.be.null;
      thread = res2.result;

      const cRes = await modelUtils.createComment({
        chain,
        address: userAddress,
        jwt: userJWT,
        text: markdownComment.text,
        root_id: `discussion_${thread.id}`,
      });

      expect(cRes.status).to.equal('Success');
      expect(cRes.result).to.not.be.null;
      comment = cRes.result;

      const rRes = await modelUtils.createReaction({
        chain,
        address: userAddress,
        jwt: userJWT,
        comment_id: comment.id,
        reaction: 'like',
        author_chain: chain,
      });

      expect(rRes.status).to.equal('Success');
      expect(rRes.result).to.not.be.null;
      expect(rRes.result.chain).to.equal(chain);
    });

    it('should fetch reactions for a comment', async () => {
      const rRes = await modelUtils.viewReactions({
        chain,
        jwt: userJWT,
        comment_id: comment.id,
      });

      console.log('rRes: ', rRes.error)
      expect(rRes.status).to.equal('Success');
      expect(rRes.result).to.not.be.null;
    });

    it('should still view reactions if user is denied viewReaction because this user is not logged in', async () => {
      removeAllowDenyPermissionsForCommunityRole('member', chain, Action.VIEW_REACTIONS, undefined);
      addAllowDenyPermissionsForCommunityRole('member', chain, undefined, Action.VIEW_REACTIONS);

      const rRes = await modelUtils.viewReactions({
        chain,
        jwt: userJWT,
        comment_id: comment.id,
      });

      expect(rRes.status).to.equal('Success');
      expect(rRes.result).to.not.be.null;
    });
  });
});

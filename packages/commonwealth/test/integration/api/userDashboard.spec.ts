import chai from 'chai';
import chaiHttp from 'chai-http';
import app, {resetDatabase} from "../../../server-test";
import * as modelUtils from "../../util/modelUtils";
import jwt from "jsonwebtoken";
import {JWT_SECRET} from "../../../server/config";
import models from '../../../server/database';
import {Op} from "sequelize";
import { JoinCommunityArgs, ThreadArgs } from "../../util/modelUtils";

chai.use(chaiHttp);
const { expect } = chai;

describe.only('User Dashboard API', () => {
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

  before('Reset database', async () => {
    await resetDatabase();

    // creates 2 ethereum users
    let res: any = await modelUtils.createAndVerifyAddress({ chain });
    userId = res.user_id;
    userAddress = res.address;
    userAddressId = res.address_id;
    userJWT = jwt.sign(
      { id: userId, email: res.email },
      JWT_SECRET
    );
    expect(userId).to.not.be.null;
    expect(userAddress).to.not.be.null;
    expect(userAddressId).to.not.be.null;
    expect(userJWT).to.not.be.null;

    res = await modelUtils.createAndVerifyAddress({ chain: chain2 });
    userId2 = res.user_id;
    userAddress2 = res.address;
    userAddressId2 = res.address_id;
    userJWT2 = jwt.sign({ id: userId2, email: res.email }, JWT_SECRET);
    expect(userId2).to.not.be.null;
    expect(userAddress2).to.not.be.null;
    expect(userAddressId2).to.not.be.null;
    expect(userJWT2).to.not.be.null;

    // make second user join alex community
    const communityArgs: JoinCommunityArgs = {
      jwt: userJWT2,
      address_id: userAddressId2,
      address: userAddress2,
      chain,
      originChain: chain2
    }
    res = await modelUtils.joinCommunity(communityArgs);
    expect(res).to.equal(true);

    // sets user-2 to be admin of the alex community
    let isAdmin = await modelUtils.updateRole({
      address_id: userAddressId2,
      chainOrCommObj: { chain_id: chain2 },
      role: 'admin',
    });
    expect(isAdmin).to.not.be.null;

    const threadOneArgs: ThreadArgs = {
      chainId: chain,
      address: userAddress2,
      jwt: userJWT2,
      title,
      body,
      readOnly: false,
      kind,
      topicName
    }
    //
    // // create a thread in both 'ethereum' and 'alex' communities
    res = await modelUtils.createThread(threadOneArgs);
    expect(res.status).to.equal('Success');
    expect(res.result).to.not.be.null;

    const threadTwoArgs: ThreadArgs = {
      chainId: chain2,
      address: userAddress2,
      jwt: userJWT2,
      title,
      body,
      readOnly: false,
      kind,
      topicName
    }
    res = await modelUtils.createThread(threadTwoArgs);
    expect(res.status).to.equal('Success');
    expect(res.result).to.not.be.null;
  });

  describe('/viewUserActivity', () => {
    before('create threads', async () => {

    });

    it('should fail without JWT', async () => {
      const res = await chai.request
        .agent(app)
        .post('/api/viewUserActivity')
        .set('Accept', 'application/json')
        .send({ chain });
      expect(res).to.not.be.null;
      expect(res.error).to.not.be.null;
    });

    it('should return ethereum only user activity', async () => {
      const res = await chai.request
        .agent(app)
        .post('/api/viewUserActivity')
        .set('Accept', 'application/json')
        .send({ chain, jwt: userJWT });

      expect(res.status).to.be.equal(200);
      expect(res.body.status).to.be.equal('Success');
      expect(res.body).to.not.be.null;
      expect(res.body.result).to.not.be.null;

      const threadIds = res.body.result.map(a => a.thread_id);
      const chains = await models.Thread.findAll({
        attributes: ['chain'],
        where: {
          id: {
            [Op.in]: threadIds
          }
        },
        raw: true
      });
      expect(chains).to.deep.equal([{chain: 'ethereum'}]);
    });

    it('should return user activity for newly joined communities', async () => {
      // make second user join alex community
      const communityArgs: JoinCommunityArgs = {
        jwt: userJWT,
        address_id: userAddressId,
        address: userAddress,
        chain: chain2,
        originChain: chain
      }
      const communityCreated = await modelUtils.joinCommunity(communityArgs);
      expect(communityCreated).to.equal(true);

      const res = await chai.request
        .agent(app)
        .post('/api/viewUserActivity')
        .set('Accept', 'application/json')
        .send({ chain, jwt: userJWT });

      expect(res.status).to.be.equal(200);
      expect(res.body.status).to.be.equal('Success');
      expect(res.body).to.not.be.null;
      expect(res.body.result).to.not.be.null;

      const threadIds = res.body.result.map(a => a.thread_id);
      const chains = await models.Thread.findAll({
        attributes: ['chain'],
        where: {
          id: {
            [Op.in]: threadIds
          }
        },
        raw: true
      });
      expect(chains).to.deep.equal([{chain: 'ethereum'}, {chain: 'alex'}]);
    });
  });
});

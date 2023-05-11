import chai from "chai";
import chaiHttp from "chai-http";
import app, {resetDatabase} from "../../server-test";
import * as modelUtils from "../util/modelUtils";
import jwt from "jsonwebtoken";
import {JWT_SECRET} from "../../server/config";
import {JoinCommunityArgs} from "../util/modelUtils";

chai.use(chaiHttp);
const { expect } = chai;

describe('emitNotifications tests', () => {
  const chain = 'ethereum';
  const chain2 = 'alex';
  // The createThread util uses the chainId parameter to determine
  // author_chain, which is required for authorship lookup.
  // Therefore, a valid chain MUST be included alongside
  // communityId, unlike in non-test thread creation
  const title = 'test title';
  const body = 'test body';
  const topicName = 'test topic';
  const kind = 'discussion';

  let userJWT;
  let userId;
  let userAddress;
  let userAddressId;
  let userJWT2;
  let userId2;
  let userAddress2;
  let userAddressId2;
  let threadOne;

  before('Reset database', async () => {
    await resetDatabase();

    // creates 2 ethereum users
    const firstUser = await modelUtils.createAndVerifyAddress({ chain });
    userId = firstUser.user_id;
    userAddress = firstUser.address;
    userAddressId = firstUser.address_id;
    userJWT = jwt.sign(
      { id: userId, email: firstUser.email },
      JWT_SECRET
    );
    expect(userId).to.not.be.null;
    expect(userAddress).to.not.be.null;
    expect(userAddressId).to.not.be.null;
    expect(userJWT).to.not.be.null;

    const secondUser = await modelUtils.createAndVerifyAddress({ chain: chain2 });
    userId2 = secondUser.user_id;
    userAddress2 = secondUser.address;
    userAddressId2 = secondUser.address_id;
    userJWT2 = jwt.sign({ id: userId2, email: secondUser.email }, JWT_SECRET);
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
    const res = await modelUtils.joinCommunity(communityArgs);
    expect(res).to.equal(true);

    // sets user-2 to be admin of the alex community
    let isAdmin = await modelUtils.updateRole({
      address_id: userAddressId2,
      chainOrCommObj: { chain_id: chain2 },
      role: 'admin',
    });
    expect(isAdmin).to.not.be.null;
  });

  describe('PostNotificationData', () => {
    it('should generate a notification for a post', () => {

    });
  });
});

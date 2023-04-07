/* eslint-disable global-require */
import BN from 'bn.js';
/* eslint-disable no-unused-expressions */
import chai from 'chai';
import chaiHttp from 'chai-http';
import 'chai/register-should';
import jwt from 'jsonwebtoken';
import type { TokenBalanceCache } from 'token-balance-cache/src/index';
import {
  getMockBalanceProvider,
  getTokenBalanceCache,
  resetDatabase,
} from '../../../server-test';
import { JWT_SECRET } from '../../../server/config';
import { markdownComment } from '../../util/fixtures/markdownComment';
import * as modelUtils from '../../util/modelUtils';

chai.use(chaiHttp);
const { expect } = chai;

describe('Token Forum tests', () => {
  const chain = 'alex';
  // The createThread util uses the chainId parameter to determine
  // author_chain, which is required for authorship lookup.
  // Therefore, a valid chain MUST be included alongside
  // communityId, unlike in non-test thread creation
  const title = 'test title';
  const body = 'test body';
  const topicName = 'test topic';
  const topicId = undefined;
  const kind = 'discussion';
  const stage = 'discussion';

  let adminJWT;
  let adminAddress;
  let adminAddressId;
  let adminSession;

  let userJWT;
  let userId;
  let userAddress;
  let userAddressId;
  let userSession;

  let thread;
  let tbc: TokenBalanceCache;
  let tokenProvider: modelUtils.MockTokenBalanceProvider;

  before(async () => {
    await resetDatabase();
    let res = await modelUtils.createAndVerifyAddress({ chain });
    adminAddress = res.address;
    adminAddressId = res.address_id;
    adminJWT = jwt.sign({ id: res.user_id, email: res.email }, JWT_SECRET);
    adminSession = { session: res.session, sign: res.sign };
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
    userSession = { session: res.session, sign: res.sign };
    expect(userAddress).to.not.be.null;
    expect(userJWT).to.not.be.null;

    tbc = getTokenBalanceCache();
    tokenProvider = getMockBalanceProvider();
  });

  beforeEach(async () => {
    await tbc.reset();
  });

  it('should permit token-holder to take actions on token forum', async () => {
    // everyone is a token holder
    tokenProvider.balanceFn = async () => new BN(1);

    // create a thread
    const res = await modelUtils.createThread({
      address: userAddress,
      kind,
      stage,
      chainId: chain,
      title,
      topicName,
      topicId,
      body,
      jwt: userJWT,
      session: userSession.session,
      sign: userSession.sign,
    });
    expect(res.status).to.equal('Success');
    expect(res.result).to.not.be.null;
    expect(res.result.title).to.equal(encodeURIComponent(title));
    expect(res.result.body).to.equal(encodeURIComponent(body));
    expect(res.result.Address).to.not.be.null;
    expect(res.result.Address.address).to.equal(userAddress);

    // create a comment
    const cRes = await modelUtils.createComment({
      chain,
      address: userAddress,
      jwt: userJWT,
      text: markdownComment.text,
      thread_id: res.result.id,
      session: userSession.session,
      sign: userSession.sign,
  });

    expect(cRes.status).to.equal('Success');
    expect(cRes.result).to.not.be.null;
    expect(cRes.result.thread_id).to.equal(res.result.id);
    expect(cRes.result.text).to.equal(markdownComment.text);
    expect(cRes.result.Address).to.not.be.null;
    expect(cRes.result.Address.address).to.equal(userAddress);
  });

  xit('should not permit non-token-holder to take actions on token forum', async () => {
    // nobody is a token holder
    tokenProvider.balanceFn = async () => new BN(0);

    // fail to create a thread
    const res = await modelUtils.createThread({
      address: userAddress,
      kind,
      stage,
      chainId: chain,
      title,
      topicName,
      topicId,
      body,
      jwt: userJWT,
      session: userSession.session,
      sign: userSession.sign,
    });
    expect(res).not.to.be.null;
    expect(res.error).not.to.be.null;
  });

  xit('should gracefully deny actions on token forum on balance fetch failure', async () => {
    // nobody is a token holder
    tokenProvider.balanceFn = null;

    // fail to create a thread
    const res = await modelUtils.createThread({
      address: userAddress,
      kind,
      stage,
      chainId: chain,
      title,
      topicName,
      topicId,
      body,
      jwt: userJWT,
      session: userSession.session,
      sign: userSession.sign,
    });
    expect(res).not.to.be.null;
    expect(res.error).not.to.be.null;
  });

  it('should permit admin to act even without tokens', async () => {
    // nobody is a token holder
    tokenProvider.balanceFn = async () => new BN(0);

    // create a thread
    const res = await modelUtils.createThread({
      address: adminAddress,
      kind,
      stage,
      chainId: chain,
      title,
      topicName,
      topicId,
      body,
      jwt: adminJWT,
      session: adminSession.session,
      sign: adminSession.sign,
  });
    expect(res.status).to.equal('Success');
    expect(res.result).to.not.be.null;
    expect(res.result.title).to.equal(encodeURIComponent(title));
    expect(res.result.body).to.equal(encodeURIComponent(body));
    expect(res.result.Address).to.not.be.null;
    expect(res.result.Address.address).to.equal(adminAddress);

    // create a comment
    const cRes = await modelUtils.createComment({
      chain,
      address: adminAddress,
      jwt: adminJWT,
      text: markdownComment.text,
      thread_id: res.result.id,
      session: adminSession.session,
      sign: adminSession.sign,
    });

    expect(cRes.status).to.equal('Success');
    expect(cRes.result).to.not.be.null;
    expect(cRes.result.thread_id).to.equal(res.result.id);
    expect(cRes.result.text).to.equal(markdownComment.text);
    expect(cRes.result.Address).to.not.be.null;
    expect(cRes.result.Address.address).to.equal(adminAddress);
  });
});

/* eslint-disable global-require */
/* eslint-disable no-unused-expressions */
import chai from 'chai';
import chaiHttp from 'chai-http';
import 'chai/register-should';
import jwt from 'jsonwebtoken';
import sleep from 'sleep-promise';
import moment from 'moment';
import { Errors as TagErrors } from 'server/routes/editTag';
import app, { resetDatabase } from '../../../server-test';
import { JWT_SECRET } from '../../../server/config';
import * as modelUtils from '../../util/modelUtils';

chai.use(chaiHttp);
const { expect } = chai;
const markdownThread = require('../../util/fixtures/markdownThread');

describe('Tag Tests', () => {
  const community = 'staking';
  const chain = 'ethereum';

  let adminJWT;
  let adminAddress;
  let userJWT;
  let userAddress;
  let tag;

  before(async () => {
    await resetDatabase();
    let res = await modelUtils.createAndVerifyAddress({ chain });
    adminAddress = res.address;
    adminJWT = jwt.sign({ id: res.user_id, email: res.email }, JWT_SECRET);
    const isAdmin = await modelUtils.assignRole({
      address_id: res.address_id,
      chainOrCommObj: { offchain_community_id: community },
      role: 'admin',
    });
    expect(adminAddress).to.not.be.null;
    expect(adminJWT).to.not.be.null;
    expect(isAdmin).to.not.be.null;

    res = await modelUtils.createAndVerifyAddress({ chain });
    userAddress = res.address;
    userJWT = jwt.sign({ id: res.user_id, email: res.email }, JWT_SECRET);
    expect(userAddress).to.not.be.null;
    expect(userJWT).to.not.be.null;
  });

  describe('/editTag', () => {
    const updatedName = 'test name';
    const updatedDescription = 'test description';
    const featured_order = true;

    beforeEach(async () => {
      const kind = 'forum';
      const threadRes = await modelUtils.createThread({
        chain,
        address: userAddress,
        jwt: userJWT,
        title: decodeURIComponent(markdownThread.title),
        body: decodeURIComponent(markdownThread.body),
        privacy: true,
        readOnly: true,
        tags: ['tag', 'tag2', 'tag3'],
        kind,
      });
      expect(threadRes.status).to.be.equal('Success');
      expect(threadRes.result).to.not.be.null;
      expect(threadRes.result.Address).to.not.be.null;
      expect(threadRes.result.Address.address).to.equal(userAddress);
      tag = threadRes.result.tags[0];
    });

    it('should successfully edit tag names & descriptions', async () => {
      const res = await modelUtils.editTag({
        id: tag.id,
        name: updatedName,
        description: updatedDescription,
        address: adminAddress,
        jwt: adminJWT,
        community,
      });
      expect(res.status).to.equal('Success');
      expect(res.result).to.not.be.null;
      expect(res.result.name).to.equal(updatedName);
      expect(res.result.description).to.equal(updatedDescription);
    });

    it('should successfully feature existing tags', async () => {
      const res = await modelUtils.editTag({
        id: tag.id,
        community,
        address: adminAddress,
        jwt: adminJWT,
        featured_order,
      });

      expect(res.status).to.equal('Success');
      expect(res.result).to.not.be.null;
      // todo: check against a community's featured_tag prop
    });

    it('should fail to edit a tag without an id', async () => {
      const res = await modelUtils.editTag({
        id: undefined,
        name: updatedName,
        description: updatedDescription,
        address: adminAddress,
        jwt: adminJWT,
        community,
      });
      expect(res).to.not.be.null;
      expect(res.error).to.not.be.null;
      expect(res.error).to.be.equal(TagErrors.NoTagId);
    });

    it('should fail to edit a non-existing tag', async () => {
      const res = await modelUtils.editTag({
        id: 99999,
        name: updatedName,
        description: updatedDescription,
        address: adminAddress,
        jwt: adminJWT,
        community,
      });
      expect(res).to.not.be.null;
      expect(res.error).to.not.be.null;
      expect(res.error).to.be.equal(TagErrors.TagNotFound);
    });

    it('should fail when a non-admin attempts to edit', async () => {
      const res = await modelUtils.editTag({
        id: tag.id,
        name: updatedName,
        description: updatedDescription,
        address: userAddress,
        jwt: userJWT,
        community,
      });
      expect(res).to.not.be.null;
      expect(res.error).to.not.be.null;
      expect(res.error).to.be.equal(TagErrors.NotAdmin);
    });
  });
});

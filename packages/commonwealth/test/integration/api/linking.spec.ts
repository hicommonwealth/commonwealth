import chai from 'chai';
import chaiHttp from 'chai-http';
import 'chai/register-should';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from 'server/config';
import { Errors } from 'server/util/linkingValidationHelper';
import app, { resetDatabase } from '../../../server-test';
import * as modelUtils from 'test/util/modelUtils';
import { Link, LinkSource, ThreadInstance } from 'server/models/thread';

chai.use(chaiHttp);
const { expect } = chai;

describe('Linking Tests', () => {
  const chain = 'ethereum';

  const title = 'test title';
  const body = 'test body';
  const topicName = 'test topic';
  const topicId = undefined;
  const kind = 'discussion';
  const stage = 'discussion';

  let adminJWT;
  let adminAddress;
  let adminAddressId;
  let userJWT;
  let userId;
  let userAddress;
  let userAddressId;
  let thread1: ThreadInstance;
  let thread2: ThreadInstance;
  const link1 = { source: LinkSource.Snapshot, identifier: '0x1234567', title: 'my snapshot' };
  const link2 = { source: LinkSource.Thread, identifier: '2' };
  const link3 = { source: LinkSource.Proposal, identifier: '123' };
  const link4 = { source: LinkSource.Thread, identifier: '3' };

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

    thread1 = (
      await modelUtils.createThread({
        address: userAddress,
        kind,
        stage,
        chainId: chain,
        title,
        topicName,
        topicId,
        body,
        jwt: userJWT,
      })
    ).result;

    thread2 = (
      await modelUtils.createThread({
        address: adminAddress,
        kind,
        stage,
        chainId: chain,
        title,
        topicName,
        topicId,
        body,
        jwt: adminJWT,
      })
    ).result;
  });

  describe('/linking/addThreadLinks', () => {
    it('should add first new link to exising thread', async () => {
      const result = await modelUtils.createLink({
        jwt: userJWT,
        thread_id: thread1.id,
        links: [link1],
      });
      expect(result.status).to.equal('Success');
      expect(result.result).to.not.be.null;
      expect(result.result.links[0].source).to.equal(link1.source.toString());
      expect(result.result.links[0].identifier).to.equal(link1.identifier);
      expect(result.result.links[0].title).to.equal('my snapshot')
    });
    it('should add multiple links to existing links', async () => {
      const result = await modelUtils.createLink({
        jwt: userJWT,
        thread_id: thread1.id,
        links: [link2, link3],
      });
      expect(result.status).to.equal('Success');
      expect(result.result).to.not.be.null;
      expect(result.result.links[0].source).to.equal(link1.source.toString());
      expect(result.result.links[0].identifier).to.equal(link1.identifier);
      expect(result.result.links[1].source).to.equal(link2.source.toString());
      expect(result.result.links[1].identifier).to.equal(link2.identifier);
      expect(result.result.links[2].source).to.equal(link3.source.toString());
      expect(result.result.links[2].identifier).to.equal(link3.identifier);
    });
    it('should revert adding existing link', async () => {
      const result = await modelUtils.createLink({
        jwt: userJWT,
        thread_id: thread1.id,
        links: [link2],
      });
      expect(result).to.not.be.null;
      expect(result.error).to.not.be.null;
      expect(result.error).to.be.equal(Errors.LinksExist);
    });
    it('should access control adding links', async () => {
      const result2 = await modelUtils.createLink({
        jwt: userJWT,
        thread_id: thread2.id,
        links: [link3],
      });
      expect(result2).to.not.be.null;
      expect(result2.error).to.not.be.null;
      expect(result2.error).to.be.equal(Errors.NotAdminOrOwner);
      const result = await modelUtils.createLink({
        jwt: adminJWT,
        thread_id: thread2.id,
        links: [link3],
      });
      expect(result.status).to.equal('Success');
      expect(result.result).to.not.be.null;
    });
    it('should filter duplicate links and add new', async () => {
      const result = await modelUtils.createLink({
        jwt: userJWT,
        thread_id: thread1.id,
        links: [link2, link4],
      });
      expect(result.status).to.equal('Success');
      expect(result.result).to.not.be.null;
      expect(result.result.links.length).to.equal(4);
      expect(result.result.links[3].source).to.equal(link4.source.toString());
      expect(result.result.links[3].identifier).to.equal(link4.identifier);
    });
  });

  describe('/linking/getLinks', () => {
    it('Can get all links for thread', async () => {
      const result = await modelUtils.getLinks({
        thread_id: thread1.id,
        jwt: userJWT,
      });
      expect(result.status).to.equal('Success');
      expect(result.result).to.not.be.null;
      expect(result.result.links[0].source).to.equal(link1.source.toString());
      expect(result.result.links[0].identifier).to.equal(link1.identifier);
      expect(result.result.links[1].source).to.equal(link2.source.toString());
      expect(result.result.links[1].identifier).to.equal(link2.identifier);
      expect(result.result.links[2].source).to.equal(link3.source.toString());
      expect(result.result.links[2].identifier).to.equal(link3.identifier);
    });
    it('Can get filtered links', async () => {
      const result = await modelUtils.getLinks({
        thread_id: thread1.id,
        linkType: [LinkSource.Snapshot],
        jwt: userJWT,
      });
      expect(result.status).to.equal('Success');
      expect(result.result).to.not.be.null;
      expect(result.result.links[0].source).to.equal(link1.source.toString());
      expect(result.result.links[0].identifier).to.equal(link1.identifier);
      const result2 = await modelUtils.getLinks({
        thread_id: thread1.id,
        linkType: [LinkSource.Snapshot, LinkSource.Proposal],
        jwt: userJWT,
      });
      expect(result2.status).to.equal('Success');
      expect(result2.result).to.not.be.null;
      expect(result2.result.links.length).to.equal(2);
      expect(result2.result.links[0].source).to.equal(link1.source.toString());
      expect(result2.result.links[1].source).to.equal(link3.source.toString());
    });
    it('Can get all threads linked to a link', async () => {
      const result = await modelUtils.getLinks({ link: link3, jwt: userJWT });
      expect(result.status).to.equal('Success');
      expect(result.result).to.not.be.null;
      expect(result.result.threads.length).to.equal(2);
      expect(result.result.threads.map((item) => item.id)).to.contain(
        thread1.id
      );
      expect(result.result.threads.map((item) => item.id)).to.contain(
        thread2.id
      );
    });
  });

  describe('/linking/deleteLinks', () => {
    it('Does access control delete links', async () => {
      const result = await modelUtils.deleteLink({
        jwt: userJWT,
        thread_id: thread2.id,
        links: [link3],
      });
      expect(result).to.not.be.null;
      expect(result.error).to.not.be.null;
      expect(result.error).to.be.equal(Errors.NotAdminOrOwner);
    });
    it('Does delete single Link', async () => {
      const result = await modelUtils.deleteLink({
        jwt: userJWT,
        thread_id: thread1.id,
        links: [link4],
      });
      expect(result.status).to.equal('Success');
      expect(result.result).to.not.be.null;
      expect(result.result.links.length).to.equal(3);
      expect(result.result.links[2].source).to.equal(link3.source.toString());
      expect(result.result.links[2].identifier).to.equal(link3.identifier);
    });
    it('Does delete multiple links', async () => {
      const result = await modelUtils.deleteLink({
        jwt: userJWT,
        thread_id: thread1.id,
        links: [link3, link2],
      });
      expect(result.status).to.equal('Success');
      expect(result.result).to.not.be.null;
      expect(result.result.links.length).to.equal(1);
      expect(result.result.links[0].source).to.equal(link1.source.toString());
      expect(result.result.links[0].identifier).to.equal(link1.identifier);
    });
    it('Reverts when trying to delete non-existant links', async () => {
      const result = await modelUtils.deleteLink({
        jwt: userJWT,
        thread_id: thread1.id,
        links: [link3, link2],
      });
      expect(result).to.not.be.null;
      expect(result.error).to.not.be.null;
      expect(result.error).to.be.equal(Errors.LinkDeleted);
    });
  });
});

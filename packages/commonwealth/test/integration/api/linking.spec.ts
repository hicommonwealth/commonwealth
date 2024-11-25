import type {
  Action,
  Awaitable,
  Message,
  Session,
  Signature,
} from '@canvas-js/interfaces';
import { dispose } from '@hicommonwealth/core';
import { ThreadAttributes } from '@hicommonwealth/model';
import { LinkSource } from '@hicommonwealth/shared';
import chai from 'chai';
import chaiHttp from 'chai-http';
import jwt from 'jsonwebtoken';
import { config } from 'server/config';
import { Errors } from 'server/util/linkingValidationHelper';
import { afterAll, beforeAll, describe, test } from 'vitest';
import { TestServer, testServer } from '../../../server-test';

chai.use(chaiHttp);
const { expect } = chai;

describe('Linking Tests', () => {
  let server: TestServer;

  const chain = 'ethereum';
  const title = 'test title';
  const body = 'test body';
  const kind = 'discussion';
  const stage = 'discussion';

  let topicId: number,
    adminJWT: string,
    adminAddress: string,
    adminDid: `did:${string}`,
    adminSession: {
      session: Session;
      sign: (payload: Message<Action | Session>) => Awaitable<Signature>;
    },
    userJWT: string,
    userAddress: string,
    userDid: `did:${string}`,
    userSession: {
      session: Session;
      sign: (payload: Message<Action | Session>) => Awaitable<Signature>;
    },
    thread1: ThreadAttributes,
    thread2: ThreadAttributes;

  const link1 = {
    source: LinkSource.Snapshot,
    identifier: '0x1234567',
    title: 'my snapshot',
  };
  const link2 = { source: LinkSource.Thread, identifier: '2' };
  const link3 = { source: LinkSource.Proposal, identifier: '123' };
  const link4 = { source: LinkSource.Thread, identifier: '3' };
  const link5 = { source: LinkSource.Proposal, identifier: '4' };

  beforeAll(async () => {
    server = await testServer(import.meta);

    const topic = await server.models.Topic.findOne({
      where: {
        community_id: chain,
        group_ids: [],
      },
    });
    // @ts-expect-error StrictNullChecks
    topicId = topic.id;

    let res = await server.seeder.createAndVerifyAddress({ chain }, 'Alice');
    adminAddress = res.address;
    adminDid = res.did;
    adminJWT = jwt.sign(
      { id: res.user_id, email: res.email },
      config.AUTH.JWT_SECRET,
    );
    const isAdmin = await server.seeder.updateRole({
      address_id: +res.address_id,
      chainOrCommObj: { chain_id: chain },
      role: 'admin',
    });
    adminSession = { session: res.session, sign: res.sign };
    expect(adminAddress).to.not.be.null;
    expect(adminDid).to.not.be.null;
    expect(adminJWT).to.not.be.null;
    expect(isAdmin).to.not.be.null;

    res = await server.seeder.createAndVerifyAddress({ chain }, 'Alice');
    userAddress = res.address;
    userDid = res.did;
    userJWT = jwt.sign(
      { id: res.user_id, email: res.email },
      config.AUTH.JWT_SECRET,
    );
    userSession = { session: res.session, sign: res.sign };
    expect(userAddress).to.not.be.null;
    expect(userDid).to.not.be.null;
    expect(userJWT).to.not.be.null;

    // @ts-expect-error StrictNullChecks
    thread1 = (
      await server.seeder.createThread({
        address: userAddress,
        did: userDid,
        kind,
        stage,
        chainId: chain,
        title,
        topicId,
        body,
        jwt: userJWT,
        session: userSession.session,
        sign: userSession.sign,
      })
    ).result;

    // @ts-expect-error StrictNullChecks
    thread2 = (
      await server.seeder.createThread({
        address: adminAddress,
        did: adminDid,
        kind,
        stage,
        chainId: chain,
        title,
        topicId,
        body,
        jwt: adminJWT,
        session: adminSession.session,
        sign: adminSession.sign,
      })
    ).result;
  });

  afterAll(async () => {
    await dispose()();
  });

  describe('/linking/addThreadLinks', () => {
    test('should add first new link to exising thread', async () => {
      const result = await server.seeder.createLink({
        jwt: userJWT,
        // @ts-expect-error StrictNullChecks
        thread_id: thread1.id,
        links: [link1],
      });
      expect(result.status).to.equal('Success');
      expect(result.result).to.not.be.null;
      expect(result.result.links[0].source).to.equal(link1.source.toString());
      expect(result.result.links[0].identifier).to.equal(link1.identifier);
      expect(result.result.links[0].title).to.equal('my snapshot');
    });
    test('should add multiple links to existing links', async () => {
      const result = await server.seeder.createLink({
        jwt: userJWT,
        // @ts-expect-error StrictNullChecks
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
    test('should revert adding existing link', async () => {
      const result = await server.seeder.createLink({
        jwt: userJWT,
        // @ts-expect-error StrictNullChecks
        thread_id: thread1.id,
        links: [link2],
      });
      expect(result).to.not.be.null;
      expect(result.error).to.not.be.null;
      expect(result.error).to.be.equal(Errors.LinksExist);
    });
    test('should access control adding links', async () => {
      const result2 = await server.seeder.createLink({
        jwt: userJWT,
        // @ts-expect-error StrictNullChecks
        thread_id: thread2.id,
        links: [link3],
      });
      expect(result2).to.not.be.null;
      expect(result2.error).to.not.be.null;
      expect(result2.error).to.be.equal(Errors.NotAdminOrOwner);
      const result = await server.seeder.createLink({
        jwt: adminJWT,
        // @ts-expect-error StrictNullChecks
        thread_id: thread2.id,
        links: [link3],
      });
      expect(result.status).to.equal('Success');
      expect(result.result).to.not.be.null;
    });
    test('should filter duplicate links and add new', async () => {
      const result = await server.seeder.createLink({
        jwt: userJWT,
        // @ts-expect-error StrictNullChecks
        thread_id: thread1.id,
        links: [link2, link4],
      });
      expect(result.status).to.equal('Success');
      expect(result.result).to.not.be.null;
      expect(result.result.links.length).to.equal(4);
      expect(result.result.links[3].source).to.equal(link4.source.toString());
      expect(result.result.links[3].identifier).to.equal(link4.identifier);
    });
    test('should allow admin to link any Thread', async () => {
      const result = await server.seeder.createLink({
        jwt: adminJWT,
        // @ts-expect-error StrictNullChecks
        thread_id: thread1.id,
        links: [link5],
      });
      expect(result.status).to.equal('Success');
      expect(result.result).to.not.be.null;
      expect(result.result.links.length).to.equal(5);
      const result2 = await server.seeder.deleteLink({
        jwt: adminJWT,
        // @ts-expect-error StrictNullChecks
        thread_id: thread1.id,
        links: [link5],
      });
      expect(result2.status).to.equal('Success');
      expect(result2.result).to.not.be.null;
      expect(result2.result.links.length).to.equal(4);
    });
  });

  describe('/linking/getLinks', () => {
    test('Can get all links for thread', async () => {
      const result = await server.seeder.getLinks({
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
    test('Can get filtered links', async () => {
      const result = await server.seeder.getLinks({
        linkType: [LinkSource.Snapshot],
        jwt: userJWT,
        thread_id: thread1.id,
      });
      expect(result.status).to.equal('Success');
      expect(result.result).to.not.be.null;
      expect(result.result.links[0].source).to.equal(link1.source.toString());
      expect(result.result.links[0].identifier).to.equal(link1.identifier);
      const result2 = await server.seeder.getLinks({
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
    test('Can get all threads linked to a link', async () => {
      const result = await server.seeder.getLinks({
        link: link3,
        jwt: userJWT,
      });
      expect(result.status).to.equal('Success');
      expect(result.result).to.not.be.null;
      expect(result.result.threads.length).to.equal(2);
      expect(result.result.threads.map((item) => item.id)).to.contain(
        thread1.id,
      );
      expect(result.result.threads.map((item) => item.id)).to.contain(
        thread2.id,
      );
    });
  });

  describe('/linking/deleteLinks', () => {
    test('Does access control delete links', async () => {
      const result = await server.seeder.deleteLink({
        jwt: userJWT,
        // @ts-expect-error StrictNullChecks
        thread_id: thread2.id,
        links: [link3],
      });
      expect(result).to.not.be.null;
      expect(result.error).to.not.be.null;
      expect(result.error).to.be.equal(Errors.NotAdminOrOwner);
    });
    test('Does delete single Link', async () => {
      const result = await server.seeder.deleteLink({
        jwt: userJWT,
        // @ts-expect-error StrictNullChecks
        thread_id: thread1.id,
        links: [link4],
      });
      expect(result.status).to.equal('Success');
      expect(result.result).to.not.be.null;
      expect(result.result.links.length).to.equal(3);
      expect(result.result.links[2].source).to.equal(link3.source.toString());
      expect(result.result.links[2].identifier).to.equal(link3.identifier);
    });
    test('Does delete multiple links', async () => {
      const result = await server.seeder.deleteLink({
        jwt: userJWT,
        // @ts-expect-error StrictNullChecks
        thread_id: thread1.id,
        links: [link3, link2],
      });
      expect(result.status).to.equal('Success');
      expect(result.result).to.not.be.null;
      expect(result.result.links.length).to.equal(1);
      expect(result.result.links[0].source).to.equal(link1.source.toString());
      expect(result.result.links[0].identifier).to.equal(link1.identifier);
    });
    test('Reverts when trying to delete non-existant links', async () => {
      const result = await server.seeder.deleteLink({
        jwt: userJWT,
        // @ts-expect-error StrictNullChecks
        thread_id: thread1.id,
        links: [link3, link2],
      });
      expect(result).to.not.be.null;
      expect(result.error).to.not.be.null;
      expect(result.error).to.be.equal(Errors.LinkDeleted);
    });
  });
});

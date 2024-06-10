/* eslint-disable no-unused-expressions */
import { dispose } from '@hicommonwealth/core';
import chai from 'chai';
import chaiHttp from 'chai-http';
import jwt from 'jsonwebtoken';
import { afterAll, beforeAll, describe, test } from 'vitest';
import { testServer, TestServer } from '../../../server-test';
import { config } from '../../../server/config';
import { Errors as ChainError } from '../../../server/controllers/server_communities_methods/update_community';
import type { CommunityArgs } from '../../util/modelUtils';

chai.use(chaiHttp);
const { expect } = chai;

describe('Update Community/Chain Tests', () => {
  let jwtToken;
  let siteAdminJwt;
  let loggedInAddr;
  const chain = 'ethereum';

  let server: TestServer;

  beforeAll(async () => {
    server = await testServer();

    // get logged in address/user with JWT
    const result = await server.seeder.createAndVerifyAddress(
      { chain },
      'Alice',
    );
    loggedInAddr = result.address;
    jwtToken = jwt.sign(
      { id: result.user_id, email: result.email },
      config.AUTH.JWT_SECRET,
    );
    const isAdmin = await server.seeder.updateRole({
      address_id: +result.address_id,
      chainOrCommObj: { chain_id: chain },
      role: 'admin',
    });
    expect(isAdmin).to.not.be.null;

    // get site admin JWT
    const siteAdminResult = await server.seeder.createAndVerifyAddress(
      { chain },
      'Bob',
    );
    const siteAdminSetSuccessfully = await server.seeder.setSiteAdmin({
      user_id: +siteAdminResult.user_id,
    });
    expect(siteAdminSetSuccessfully).to.be.true;
    siteAdminJwt = jwt.sign(
      { id: siteAdminResult.user_id, email: siteAdminResult.email },
      config.AUTH.JWT_SECRET,
    );

    // create community for test
    const communityArgs: CommunityArgs = {
      jwt: jwtToken,
      isAuthenticatedForum: 'false',
      privacyEnabled: 'false',
      id: 'tester',
      name: 'tester community',
      creator_address: loggedInAddr,
      creator_chain: chain,
      description: 'Tester community community',
      default_chain: chain,
    };

    await server.seeder.createCommunity(communityArgs);
  });

  afterAll(async () => {
    await dispose()();
  });

  describe('/updateChain route tests', () => {
    test('should update chain name', async () => {
      const name = 'commonwealtheum';
      const res = await chai
        .request(server.app)
        .patch(`/api/communities/${chain}`)
        .set('Accept', 'application/json')
        .send({ jwt: jwtToken, id: chain, name });
      expect(res.body.status).to.be.equal('Success');
      expect(res.body.result.name).to.be.equal(name);
    });

    test('should update description', async () => {
      const description = 'hello this the new chain';
      const res = await chai
        .request(server.app)
        .patch(`/api/communities/${chain}`)
        .set('Accept', 'application/json')
        .send({ jwt: jwtToken, id: chain, description });
      expect(res.body.status).to.be.equal('Success');
      expect(res.body.result.description).to.be.equal(description);
    });

    test.skip('should update website', async () => {
      const website = 'http://edgewa.re';
      const res = await chai
        .request(server.app)
        .patch(`/api/communities/${chain}`)
        .set('Accept', 'application/json')
        .send({ jwt: jwtToken, id: chain, website });
      expect(res.body.status).to.be.equal('Success');
      expect(res.body.result.website).to.be.equal(website);
    });

    test('should update discord', async () => {
      const discord = ['http://discord.gg'];
      const res = await chai
        .request(server.app)
        .patch(`/api/communities/${chain}`)
        .set('Accept', 'application/json')
        .send({ jwt: jwtToken, id: chain, social_links: discord });
      expect(res.body.status).to.be.equal('Success');
      expect(res.body.result.social_links).to.deep.equal(discord);
    });

    test.skip('should fail to update social link without proper prefix', async () => {
      const socialLinks = ['github.com'];
      const res = await chai
        .request(server.app)
        .patch(`/api/communities/${chain}`)
        .set('Accept', 'application/json')
        .send({ jwt: jwtToken, id: chain, socialLinks });
      expect(res.body.error).to.exist;
    });

    test('should update telegram', async () => {
      const telegram = ['https://t.me/'];
      const res = await chai
        .request(server.app)
        .patch(`/api/communities/${chain}`)
        .set('Accept', 'application/json')
        .send({ jwt: jwtToken, id: chain, social_links: telegram });
      expect(res.body.status).to.be.equal('Success');
      expect(res.body.result.social_links).to.deep.equal(telegram);
    });

    test.skip('should update github', async () => {
      const github = ['https://github.com/'];
      const res = await chai
        .request(server.app)
        .patch(`/api/communities/${chain}`)
        .set('Accept', 'application/json')
        .send({ jwt: jwtToken, id: chain, github });
      expect(res.body.status).to.be.equal('Success');
      expect(res.body.result.github).to.deep.equal(github);
    });

    test('should update symbol', async () => {
      const default_symbol = 'CWL';
      const res = await chai
        .request(server.app)
        .patch(`/api/communities/${chain}`)
        .set('Accept', 'application/json')
        .send({ jwt: jwtToken, id: chain, default_symbol });
      expect(res.body.status).to.be.equal('Success');
      expect(res.body.result.default_symbol).to.be.equal(default_symbol);
    });

    test('should update icon_url', async () => {
      const icon_url = '/static/img/protocols/cwl.png';
      const res = await chai
        .request(server.app)
        .patch(`/api/communities/${chain}`)
        .set('Accept', 'application/json')
        .send({ jwt: jwtToken, id: chain, icon_url });
      expect(res.body.status).to.be.equal('Success');
      expect(res.body.result.icon_url).to.be.equal(icon_url);
    });

    test('should update active', async () => {
      const active = false;
      const res = await chai
        .request(server.app)
        .patch(`/api/communities/${chain}`)
        .set('Accept', 'application/json')
        .send({ jwt: jwtToken, id: chain, active });
      expect(res.body.status).to.be.equal('Success');
      expect(res.body.result.active).to.be.equal(active);
    });

    test('should update type', async () => {
      const type = 'parachain';
      const res = await chai
        .request(server.app)
        .patch(`/api/communities/${chain}`)
        .set('Accept', 'application/json')
        .send({ jwt: jwtToken, id: chain, type });
      expect(res.body.status).to.be.equal('Success');
      expect(res.body.result.type).to.be.equal(type);
    });

    test('should fail to update network', async () => {
      const network = 'ethereum-testnet';
      const res = await chai
        .request(server.app)
        .patch(`/api/communities/${chain}`)
        .set('Accept', 'application/json')
        .send({ jwt: jwtToken, id: chain, network });
      expect(res.body.error).to.not.be.null;
      expect(res.body.error).to.be.equal(ChainError.CantChangeNetwork);
    });

    test('should fail to update custom domain if not site admin', async () => {
      const custom_domain = 'test.com';
      const res = await chai
        .request(server.app)
        .patch(`/api/communities/${chain}`)
        .set('Accept', 'application/json')
        .send({ jwt: jwtToken, id: chain, custom_domain });
      expect(res.body.error).to.not.be.null;
      expect(res.body.error).to.be.equal(ChainError.CantChangeCustomDomain);
    });

    test('should update custom domain if site admin', async () => {
      const custom_domain = 'test.com';
      const res = await chai
        .request(server.app)
        .patch(`/api/communities/${chain}`)
        .set('Accept', 'application/json')
        .send({ jwt: siteAdminJwt, id: chain, custom_domain });
      expect(res.body.status).to.be.equal('Success');
      expect(res.body.result.custom_domain).to.be.equal(custom_domain);
    });

    test('should fail if no chain id', async () => {
      const name = 'ethereum-testnet';
      const res = await chai
        .request(server.app)
        .patch(`/api/communities/${chain}`)
        .set('Accept', 'application/json')
        .send({ jwt: jwtToken, name });
      expect(res.body.error).to.not.be.null;
      expect(res.body.error).to.be.equal(ChainError.NoCommunityId);
    });

    test('should fail if no chain found', async () => {
      const id = 'ethereum-testnet';
      const res = await chai
        .request(server.app)
        .patch(`/api/communities/${chain}`)
        .set('Accept', 'application/json')
        .send({ jwt: jwtToken, id });
      expect(res.body.error).to.not.be.null;
      expect(res.body.error).to.be.equal(ChainError.NoCommunityFound);
    });

    test('should fail if not admin ', async () => {
      const id = 'ethereum';
      const result = await server.seeder.createAndVerifyAddress(
        { chain },
        'Alice',
      );
      const newJwt = jwt.sign(
        { id: result.user_id, email: result.email },
        config.AUTH.JWT_SECRET,
      );
      const res = await chai
        .request(server.app)
        .patch(`/api/communities/${chain}`)
        .set('Accept', 'application/json')
        .send({ jwt: newJwt, id });
      expect(res.body.error).to.not.be.null;
      expect(res.body.error).to.be.equal(ChainError.NotAdmin);
    });
  });

  describe.skip('/updateCommunity route tests', () => {
    test.skip('should update community name', async () => {
      const name = 'commonwealth tester community';
      const res = await chai
        .request(server.app)
        .patch(``)
        .set('Accept', 'application/json')
        .send({ jwt: jwtToken, id: chain, name });
      expect(res.body.status).to.be.equal('Success');
      expect(res.body.result.name).to.be.equal(name);
    });

    test.skip('should update community description', async () => {
      const description = 'for me! and the tester community';
      const res = await chai
        .request(server.app)
        .patch(``)
        .set('Accept', 'application/json')
        .send({ jwt: jwtToken, id: chain, description });
      expect(res.body.status).to.be.equal('Success');
      expect(res.body.result.description).to.be.equal(description);
    });

    test.skip('should update website', async () => {
      const website = 'http://edgewa.re';
      const res = await chai
        .request(server.app)
        .patch(``)
        .set('Accept', 'application/json')
        .send({ jwt: jwtToken, id: chain, website });
      expect(res.body.status).to.be.equal('Success');
      expect(res.body.result.website).to.be.equal(website);
    });

    test.skip('should update discord', async () => {
      const discord = 'http://discord.gg';
      const res = await chai
        .request(server.app)
        .patch(``)
        .set('Accept', 'application/json')
        .send({ jwt: jwtToken, id: chain, discord });
      expect(res.body.status).to.be.equal('Success');
      expect(res.body.result.discord).to.be.equal(discord);
    });

    test.skip('should update telegram', async () => {
      const telegram = 'https://t.me/';
      const res = await chai
        .request(server.app)
        .patch(``)
        .set('Accept', 'application/json')
        .send({ jwt: jwtToken, id: chain, telegram });
      expect(res.body.status).to.be.equal('Success');
      expect(res.body.result.telegram).to.be.equal(telegram);
    });

    test.skip('should update github', async () => {
      const github = 'https://github.com/';
      const res = await chai
        .request(server.app)
        .patch(``)
        .set('Accept', 'application/json')
        .send({ jwt: jwtToken, id: chain, github });
      expect(res.body.status).to.be.equal('Success');
      expect(res.body.result.github).to.be.equal(github);
    });
  });
});

/* eslint-disable no-unused-expressions */
import { dispose } from '@hicommonwealth/core';
import { models } from '@hicommonwealth/model';
import * as schemas from '@hicommonwealth/schemas';
import { ChainBase, ChainType } from '@hicommonwealth/shared';
import chai from 'chai';
import chaiHttp from 'chai-http';
import { Express } from 'express';
import jwt from 'jsonwebtoken';
import { afterAll, beforeAll, describe, test } from 'vitest';
import { z } from 'zod';
import { TestServer, testServer } from '../../../server-test';
import { config } from '../../../server/config';

chai.use(chaiHttp);
const { expect } = chai;

async function update(
  app: Express,
  address: string,
  payload: Record<string, unknown>,
) {
  return await chai
    .request(app)
    .post(`/api/v1/UpdateCommunity`)
    .set('Accept', 'application/json')
    .set('address', address)
    .send(payload);
}

describe('Update Community/Chain Tests', () => {
  let jwtToken;
  let loggedInAddr;
  const chain = 'ethereum';

  let server: TestServer;

  beforeAll(async () => {
    server = await testServer(import.meta);

    // get logged in address/user with JWT
    const result = await server.seeder.createAndVerifyAddress(
      { chain },
      'Alice',
    );
    loggedInAddr = result.did.split(':')[4];
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

    const node = await models.ChainNode.findOne({
      where: {
        eth_chain_id: 1,
      },
    });

    // create community for test
    const communityArgs: z.infer<(typeof schemas.CreateCommunity)['input']> = {
      id: 'tester',
      name: 'tester community',
      chain_node_id: node!.id!,
      description: 'Tester community community',
      type: ChainType.Offchain,
      base: ChainBase.Ethereum,
      default_symbol: 'test',
      directory_page_enabled: false,
      tags: [],
      social_links: [],
    };

    const created = await server.seeder.createCommunity(
      { ...communityArgs, address: result.address },
      jwtToken,
    );
    expect(created.name).to.be.equal(communityArgs.name);
  });

  afterAll(async () => {
    await dispose()();
  });

  describe('/updateChain route tests', () => {
    test('should update chain name', async () => {
      const name = 'commonwealtheum';
      const res = await update(server.app, loggedInAddr, {
        jwt: jwtToken,
        community_id: chain,
        name,
      });
      expect(res.status).to.be.equal(200);
      expect(res.body.name).to.be.equal(name);
    });

    test('should update description', async () => {
      const description = 'hello this the new chain';
      const res = await update(server.app, loggedInAddr, {
        jwt: jwtToken,
        community_id: chain,
        description,
      });
      expect(res.status).to.be.equal(200);
      expect(res.body.description).to.be.equal(description);
    });

    test.skip('should update website', async () => {
      const website = 'http://edgewa.re';
      const res = await update(server.app, loggedInAddr, {
        jwt: jwtToken,
        community_id: chain,
        website,
      });
      expect(res.status).to.be.equal(200);
      expect(res.body.website).to.be.equal(website);
    });

    test('should update discord', async () => {
      const discord = ['http://discord.gg'];
      const res = await update(server.app, loggedInAddr, {
        jwt: jwtToken,
        community_id: chain,
        social_links: discord,
      });
      expect(res.status).to.be.equal(200);
      expect(res.body.social_links).to.deep.equal(discord);
    });

    test.skip('should fail to update social link without proper prefix', async () => {
      const socialLinks = ['github.com'];
      const res = await update(server.app, loggedInAddr, {
        jwt: jwtToken,
        community_id: chain,
        socialLinks,
      });
      expect(res.body.error).to.exist;
    });

    test('should update telegram', async () => {
      const telegram = ['https://t.me/'];
      const res = await update(server.app, loggedInAddr, {
        jwt: jwtToken,
        community_id: chain,
        social_links: telegram,
      });
      expect(res.status).to.be.equal(200);
      expect(res.body.social_links).to.deep.equal(telegram);
    });

    test.skip('should update github', async () => {
      const github = ['https://github.com/'];
      const res = await update(server.app, loggedInAddr, {
        jwt: jwtToken,
        community_id: chain,
        github,
      });
      expect(res.status).to.be.equal(200);
      expect(res.body.github).to.deep.equal(github);
    });

    test('should update symbol', async () => {
      const default_symbol = 'CWL';
      const res = await update(server.app, loggedInAddr, {
        jwt: jwtToken,
        community_id: chain,
        default_symbol,
      });
      expect(res.status).to.be.equal(200);
      expect(res.body.default_symbol).to.be.equal(default_symbol);
    });

    test('should update icon_url', async () => {
      const icon_url = 'assets/img/protocols/cwl.png';
      const res = await update(server.app, loggedInAddr, {
        jwt: jwtToken,
        community_id: chain,
        icon_url,
      });
      expect(res.status).to.be.equal(200);
      expect(res.body.icon_url).to.be.equal(icon_url);
    });

    test('should update active', async () => {
      const active = false;
      const res = await update(server.app, loggedInAddr, {
        jwt: jwtToken,
        community_id: chain,
        active,
      });
      expect(res.status).to.be.equal(200);
      expect(res.body.active).to.be.equal(active);
    });

    test.skip('should update type', async () => {
      const type = 'parachain';
      const res = await update(server.app, loggedInAddr, {
        jwt: jwtToken,
        community_id: chain,
        type,
      });
      expect(res.status).to.be.equal(200);
      expect(res.body.type).to.be.equal(type);
    });

    test('should fail if no chain id', async () => {
      const name = 'ethereum-testnet';
      const res = await update(server.app, loggedInAddr, {
        jwt: jwtToken,
        name,
      });
      expect(res.body.message).to.not.be.null;
    });

    test('should fail if no chain found', async () => {
      const community_id = 'ethereum-testnet';
      const res = await update(server.app, loggedInAddr, {
        jwt: jwtToken,
        community_id,
      });
      expect(res.body.message).to.not.be.null;
    });

    test('should fail if not admin ', async () => {
      const community_id = 'ethereum';
      const result = await server.seeder.createAndVerifyAddress(
        { chain },
        'Alice',
      );
      const newJwt = jwt.sign(
        { id: result.user_id, email: result.email },
        config.AUTH.JWT_SECRET,
      );
      const res = await update(server.app, loggedInAddr, {
        jwt: newJwt,
        community_id,
      });
      expect(res.body.message).to.be.equal(
        'User is not admin in the community',
      );
    });
  });

  describe.skip('/updateCommunity route tests', () => {
    test.skip('should update community name', async () => {
      const name = 'commonwealth tester community';
      const res = await chai
        .request(server.app)
        .post(``)
        .set('Accept', 'application/json')
        .send({ jwt: jwtToken, id: chain, name });
      expect(res.body.status).to.be.equal('Success');
      expect(res.body.result.name).to.be.equal(name);
    });

    test.skip('should update community description', async () => {
      const description = 'for me! and the tester community';
      const res = await chai
        .request(server.app)
        .post(``)
        .set('Accept', 'application/json')
        .send({ jwt: jwtToken, id: chain, description });
      expect(res.body.status).to.be.equal('Success');
      expect(res.body.result.description).to.be.equal(description);
    });

    test.skip('should update website', async () => {
      const website = 'http://edgewa.re';
      const res = await chai
        .request(server.app)
        .post(``)
        .set('Accept', 'application/json')
        .send({ jwt: jwtToken, id: chain, website });
      expect(res.body.status).to.be.equal('Success');
      expect(res.body.result.website).to.be.equal(website);
    });

    test.skip('should update discord', async () => {
      const discord = 'http://discord.gg';
      const res = await chai
        .request(server.app)
        .post(``)
        .set('Accept', 'application/json')
        .send({ jwt: jwtToken, id: chain, discord });
      expect(res.body.status).to.be.equal('Success');
      expect(res.body.result.discord).to.be.equal(discord);
    });

    test.skip('should update telegram', async () => {
      const telegram = 'https://t.me/';
      const res = await chai
        .request(server.app)
        .post(``)
        .set('Accept', 'application/json')
        .send({ jwt: jwtToken, id: chain, telegram });
      expect(res.body.status).to.be.equal('Success');
      expect(res.body.result.telegram).to.be.equal(telegram);
    });

    test.skip('should update github', async () => {
      const github = 'https://github.com/';
      const res = await chai
        .request(server.app)
        .post(``)
        .set('Accept', 'application/json')
        .send({ jwt: jwtToken, id: chain, github });
      expect(res.body.status).to.be.equal('Success');
      expect(res.body.result.github).to.be.equal(github);
    });
  });
});

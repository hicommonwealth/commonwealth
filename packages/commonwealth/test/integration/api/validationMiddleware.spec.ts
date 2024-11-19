/* eslint-disable global-require */
/* eslint-disable no-unused-expressions */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { dispose } from '@hicommonwealth/core';
import chai from 'chai';
import chaiHttp from 'chai-http';
import jwt from 'jsonwebtoken';
import MockExpressRequest from 'mock-express-request';
import { afterAll, beforeAll, describe, expect, test } from 'vitest';
import { TestServer, testServer } from '../../../server-test';
import { config } from '../../../server/config';
import DatabaseValidationService from '../../../server/middleware/databaseValidationService';

chai.use(chaiHttp);

describe('DatabaseValidationService Tests', () => {
  const chain = 'ethereum';

  const title = 'test title';
  const body = 'test body';
  const topic = 'test topic';

  let userJWT;
  let userAddress;
  let userId;
  let user2Address;
  let user2JWT;
  let user2Id;
  let databaseValidationService;
  let server: TestServer;

  beforeAll(async function () {
    server = await testServer(import.meta);
    console.log('Database reset');
    databaseValidationService = new DatabaseValidationService(server.models);
    let res = await server.seeder.createAndVerifyAddress({ chain }, 'Alice');
    user2Address = res.address;
    user2JWT = jwt.sign(
      { id: res.user_id, email: res.email },
      config.AUTH.JWT_SECRET,
    );
    user2Id = res.user_id;
    expect(user2Address).to.not.be.null;
    expect(user2JWT).to.not.be.null;

    res = await server.seeder.createAndVerifyAddress({ chain }, 'Alice');
    userAddress = res.address;
    userJWT = jwt.sign(
      { id: res.user_id, email: res.email },
      config.AUTH.JWT_SECRET,
    );
    userId = res.user_id;
    expect(userAddress).to.not.be.null;
    expect(userJWT).to.not.be.null;
  }, 300_000);

  afterAll(async () => {
    await dispose()();
  });

  describe('validateAuthor', () => {
    test('should successfully validate author if address exists for user', () => {
      const request = new MockExpressRequest();

      const resBody = {
        address: userAddress,
        author_chain: chain,
        chain,
        title,
        topic,
        body,
        jwt: userJWT,
      };
      request.body = resBody;
      request.user = { id: userId };
      expect(
        databaseValidationService.validateAuthor(request, null, () => {
          return null;
        }),
      ).to.not.throw;
    });

    test('should fail if no user is given', () => {
      const request = new MockExpressRequest();

      const resBody = {
        address: userAddress,
        author_chain: chain,
        chain,
        title,
        topic,
        body,
        jwt: userJWT,
      };
      request.body = resBody;
      request.user = null;
      databaseValidationService.validateAuthor(request, null, () => {
        return null;
      });
      expect(request.address).to.be.undefined;
    });

    test('should fail if no address or author chain is given', () => {
      const request = new MockExpressRequest();

      const resBody = {
        chain,
        title,
        topic,
        body,
        jwt: userJWT,
      };
      request.body = resBody;
      request.user = { id: userId };
      databaseValidationService.validateAuthor(request, null, () => {
        return null;
      });
      expect(request.address).to.be.undefined;
    });
  });

  describe('validateCommunity', () => {
    test('should successfully validate chain id if chain exists', () => {
      const request = new MockExpressRequest();

      const resBody = {
        address: userAddress,
        author_chain: chain,
        chain,
        title,
        topic,
        body,
        jwt: userJWT,
      };
      request.body = resBody;
      request.user = { id: userId };
      expect(
        databaseValidationService.validateCommunity(request, null, () => {
          return null;
        }),
      ).to.not.throw;
    });

    test('should fail if no chain is given', () => {
      const request = new MockExpressRequest();

      const resBody = {
        address: userAddress,
        author_chain: null,
        title,
        topic,
        body,
        jwt: userJWT,
      };
      request.body = resBody;
      request.user = { id: userId };
      databaseValidationService.validateCommunity(request, resBody, () => {
        return null;
      });
      expect(request.chain).to.be.undefined;
    });
  });
});

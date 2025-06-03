/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable no-unused-expressions */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { dispose } from '@hicommonwealth/core';
import { PRODUCTION_DOMAIN } from '@hicommonwealth/shared';
import chai from 'chai';
import chaiHttp from 'chai-http';
import jwt from 'jsonwebtoken';
import { afterAll, beforeAll, beforeEach, describe, test } from 'vitest';
import { TestServer, testServer } from '../../../server-test';
import { config } from '../../../server/config';

chai.use(chaiHttp);
const { expect } = chai;

// TODO: fix this, user is not authenticated in test
describe.skip('User Model Routes', () => {
  let server: TestServer;

  beforeAll(async () => {
    server = await testServer();
  });

  afterAll(async () => {
    await dispose()();
  });

  describe('/updateEmail', () => {
    const chain = 'ethereum';
    let jwtToken;
    let userAddress;
    let userEmail;

    beforeEach(async () => {
      const res = await server.seeder.createAndVerifyAddress(
        { chain },
        'Alice',
      );
      userAddress = res.address;
      userEmail = res.email;
      jwtToken = jwt.sign(
        { id: res.user_id, email: userEmail },
        config.AUTH.JWT_SECRET,
      );
      const isAdmin = await server.seeder.updateRole({
        address_id: +res.address_id,
        chainOrCommObj: { chain_id: chain },
        role: 'admin',
      });
      expect(userAddress).to.not.be.null;
      expect(jwtToken).to.not.be.null;
      expect(isAdmin).to.not.be.null;
    });

    test('should add an email to user with just an address', async () => {
      const email = `test@${PRODUCTION_DOMAIN}`;
      const res = await chai
        .request(server.app)
        .post('/api/internal/UpdateEmail')
        .set('Accept', 'application/json')
        .set('address', userAddress)
        .send({
          jwt: jwtToken,
          email,
        });
      console.log({ userAddress, jwtToken, body: res.body });
      expect(res).to.be.json;
      expect(res.body.result.email).to.be.equal(email);
    });

    test('should fail to update without email', async () => {
      const res = await chai
        .request(server.app)
        .post('/api/internal/UpdateEmail')
        .set('Accept', 'application/json')
        .set('address', userAddress)
        .send({
          jwt: jwtToken,
        });
      expect(res.body.error).to.not.be.null;
    });

    test('should fail with an invalid email', async () => {
      const email = 'testatcommonwealthdotim';
      const res = await chai
        .request(server.app)
        .post('/api/internal/UpdateEmail')
        .set('Accept', 'application/json')
        .set('address', userAddress)
        .send({
          jwt: jwtToken,
          email,
        });
      expect(res.body.error).to.not.be.null;
    });
  });
});

/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable no-unused-expressions */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { dispose } from '@hicommonwealth/core';
import chai from 'chai';
import chaiHttp from 'chai-http';
import jwt from 'jsonwebtoken';
import { TestServer, testServer } from '../../../server-test';
import { JWT_SECRET } from '../../../server/config';
import { Errors as updateEmailErrors } from '../../../server/routes/updateEmail';

chai.use(chaiHttp);
const { expect } = chai;
const markdownThread = require('../../util/fixtures/markdownThread');

describe('User Model Routes', () => {
  let server: TestServer;

  before('reset database', async () => {
    server = await testServer();
  });

  after(async () => {
    await dispose()();
  });

  describe('/updateEmail', () => {
    const chain = 'ethereum';
    let jwtToken;
    let userAddress;
    let userEmail;

    beforeEach('create new user', async () => {
      const res = await server.seeder.createAndVerifyAddress(
        { chain },
        'Alice',
      );
      userAddress = res.address;
      userEmail = res.email;
      jwtToken = jwt.sign({ id: res.user_id, email: userEmail }, JWT_SECRET);
      const isAdmin = await server.seeder.updateRole({
        address_id: +res.address_id,
        chainOrCommObj: { chain_id: chain },
        role: 'admin',
      });
      expect(userAddress).to.not.be.null;
      expect(jwtToken).to.not.be.null;
      expect(isAdmin).to.not.be.null;
    });

    it('should add an email to user with just an address', async () => {
      const email = 'test@commonwealth.im';
      const res = await chai
        .request(server.app)
        .post('/api/updateEmail')
        .set('Accept', 'application/json')
        .send({
          jwt: jwtToken,
          email,
        });
      expect(res.body.status).to.be.equal('Success');
      expect(res.body.result.email).to.be.equal(email);
    });

    it('should fail to update without email', async () => {
      const res = await chai
        .request(server.app)
        .post('/api/updateEmail')
        .set('Accept', 'application/json')
        .send({
          jwt: jwtToken,
        });
      expect(res.body.error).to.not.be.null;
      expect(res.body.error).to.be.equal(updateEmailErrors.NoEmail);
    });

    it('should fail to update if email in use by another user', async () => {
      const res = await chai
        .request(server.app)
        .post('/api/updateEmail')
        .set('Accept', 'application/json')
        .send({
          jwt: jwtToken,
          email: 'test@commonwealth.im',
        });
      expect(res.body.error).to.not.be.null;
      expect(res.body.error).to.be.equal(updateEmailErrors.EmailInUse);
    });

    it('should fail with an invalid email', async () => {
      const email = 'testatcommonwealthdotim';
      const res = await chai
        .request(server.app)
        .post('/api/updateEmail')
        .set('Accept', 'application/json')
        .send({
          jwt: jwtToken,
          email,
        });
      expect(res.body.error).to.not.be.null;
      expect(res.body.error).to.be.equal(updateEmailErrors.InvalidEmail);
    });
  });
});

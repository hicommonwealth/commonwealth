import { models } from '@hicommonwealth/model';
import chai from 'chai';
import chaiHttp from 'chai-http';
import jwt from 'jsonwebtoken';
import app from '../../../server-test';
import { JWT_SECRET } from '../../../server/config';
import { Errors } from '../../../server/routes/upgradeMember';
import { post } from './external/appHook.spec';
import { testAddresses, testUsers } from './external/dbEntityHooks.spec';

chai.use(chaiHttp);

describe('upgradeMember Integration Tests', () => {
  let jwtToken;

  beforeEach(() => {
    jwtToken = jwt.sign(
      { id: testUsers[0].id, email: testUsers[0].email },
      JWT_SECRET,
    );
  });

  it('should return an error response if there is an invalid role specified', async () => {
    const invalidRequest = {
      jwt: jwtToken,
      author_chain: testAddresses[0].community_id,
      chain: testAddresses[0].community_id,
      new_role: 'invalid role',
      address: testAddresses[0].address,
    };

    const response = await post(
      '/api/upgradeMember',
      invalidRequest,
      true,
      app,
    );

    response.should.have.status(400);
    chai.assert.equal(response.error, Errors.InvalidRole);
  });

  it('should return an error response if an invalid address is specified', async () => {
    const invalidRequest = {
      jwt: jwtToken,
      author_chain: testAddresses[0].community_id,
      chain: testAddresses[0].community_id,
      new_role: 'member',
      address: true,
    };

    const response = await post(
      '/api/upgradeMember',
      invalidRequest,
      true,
      app,
    );

    response.should.have.status(400);
    chai.assert.equal(response.error, Errors.InvalidAddress);
  });

  it('should upgrade member and return a success response', async () => {
    await models.Address.update(
      {
        role: 'admin',
      },
      {
        where: {
          id: testAddresses[0].id,
        },
      },
    );
    const validRequest = {
      jwt: jwtToken,
      author_chain: testAddresses[0].community_id,
      chain: testAddresses[0].community_id,
      new_role: 'admin',
      address: testAddresses[1].address,
    };

    const response = await post('/api/upgradeMember', validRequest, false, app);

    chai.assert.equal(response.status, 'Success');
    const address = await models.Address.findOne({
      where: { id: testAddresses[1].id },
    });

    chai.assert.equal(address.role, 'admin');
  });
});

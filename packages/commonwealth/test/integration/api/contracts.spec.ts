import chai from 'chai';
import chaiHttp from 'chai-http';
import app, { resetDatabase } from '../../../server-test';
import { JWT_SECRET } from '../../../server/config';
import jwt from 'jsonwebtoken';
import * as modelUtils from '../../util/modelUtils';

let adminJWT;
let adminAddress;
let userJWT;
let userAddress;

describe('Contract route tests', () => {
  const chain = 'ethereum';
  const { expect } = chai;
  chai.use(chaiHttp);

  before(async () => {
    await resetDatabase();
    let res = await modelUtils.createAndVerifyAddress({ chain });
    adminAddress = res.address;
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
    userJWT = jwt.sign({ id: res.user_id, email: res.email }, JWT_SECRET);
    expect(userAddress).to.not.be.null;
    expect(userJWT).to.not.be.null;
  });

  describe('POST /api/contract', () => {
    it('should create a contract', async () => {
      const chain = await modelUtils.createAndVerifyAddress({
        chain: 'ethereum',
      });
      const res = await chai.request
        .agent(app)
        .post('/api/contract')
        .set('Accept', 'application/json')
        .query({
          chain,
          jwt: adminJWT,
        });

      expect(res.status).to.equal(201);
      expect(res.body.status).to.equal('Success');
    });
  });

  describe('POST /api/contract/template', () => {
    it('should create a contract template', async () => {
      const res = await chai.request
        .agent(app)
        .post('/api/contract/template')
        .set('Accept', 'application/json')
        .query({
          chain,
          jwt: adminJWT,
        });

      expect(res.status).to.equal(201);
      expect(res.body.status).to.equal('Success');
    });

    it('should create a contract with metadata', async () => {
      const res = await chai.request
        .agent(app)
        .post('/api/contract/template')
        .set('Accept', 'application/json')
        .query({
          chain,
          jwt: adminJWT,
        });

      expect(res.status).to.equal(201);
      expect(res.body.status).to.equal('Success');
    })
  });

  describe('POST /api/contract/template/metadata', () => {
    it('should create a contract template metadata', async () => {
      const res = await chai.request
        .agent(app)
        .post('/api/contract/template/metadata')
        .set('Accept', 'application/json')
        .query({
          chain,
          jwt: adminJWT,
        });

      expect(res.status).to.equal(201);
      expect(res.body.status).to.equal('Success');
    });
  });

  describe('DELETE /api/contract/template/metadata', () => {
    it('should delete a contract template metadata', async () => {
      const res = await chai.request
        .agent(app)
        .delete('/api/contract/template/metadata')
        .set('Accept', 'application/json')
        .query({
          chain,
          jwt: adminJWT,
        });

      expect(res.status).to.equal(200);
      expect(res.body.status).to.equal('Success');
    });
  });

  describe('DELETE /api/contract/template', () => {
    it('should delete a contract template', async () => {
      const res = await chai.request
        .agent(app)
        .delete('/api/contract/template')
        .set('Accept', 'application/json')
        .query({
          chain,
          jwt: adminJWT,
        });

      expect(res.status).to.equal(200);
      expect(res.body.status).to.equal('Success');
    });
  });

  describe('DELETE /api/contract', () => {
    it('should delete a contract', async () => {
      const res = await chai.request
        .agent(app)
        .delete('/api/contract')
        .set('Accept', 'application/json')
        .query({
          chain,
          jwt: adminJWT,
        });

      expect(res.status).to.equal(200);
      expect(res.body.status).to.equal('Success');
    });
  });
});

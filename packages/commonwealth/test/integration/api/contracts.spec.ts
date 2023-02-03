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

type Contract = {
  community_id: string;
  contract_id: number;
  template_id: number;
};

type ContractMetadata = {
  cct_id: string;
  slug: string;
  nickname: string;
  display_name: string;
  display_options: string;
};

function generateRandomString(): string {
  return Math.random().toString(36).substring(2, 15);
}

function generateRandomNumber(): number {
  return Math.floor(Math.random() * 100);
}

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

  describe(' /api/contract/community_template', () => {
    it('should create a contract template and metadata', async () => {
      const body = {
        community_id: generateRandomString(),
        contract_id: generateRandomNumber(),
        template_id: generateRandomNumber(),
        slug: generateRandomString(),
        nickname: generateRandomString(),
        display_name: generateRandomString(),
        display_options: generateRandomString(),
      };
      const res = await chai.request
        .agent(app)
        .post('/api/contract/community_template')
        .set('Accept', 'application/json')
        .query({
          chain,
          jwt: adminJWT,
        })
        .send({ body });

      expect(res.status).to.equal(200);
    });

    it('should get a contract template by template id', async () => {
      const contract: Contract = {
        community_id: generateRandomString(),
        contract_id: generateRandomNumber(),
        template_id: generateRandomNumber(),
      };
      const postResponse = await chai.request
        .agent(app)
        .post('/api/contract/community_template')
        .set('Accept', 'application/json')
        .query({
          chain,
          jwt: adminJWT,
        })
        .send({ contract });

      expect(postResponse.status).to.equal(201);

      const getResponse = await chai.request
        .agent(app)
        .get('/api/contract/community_template')
        .set('Accept', 'application/json')
        .query({
          chain,
          jwt: adminJWT,
        })
        .send({ contract });

      expect(getResponse.status).to.equal(200);
      expect(getResponse.body.status).to.equal('Success');
    });

    it('should update a contract template', async () => {
      const contract: Contract = {
        community_id: generateRandomString(),
        contract_id: generateRandomNumber(),
        template_id: generateRandomNumber(),
      };
      //post the contract template
      const postResponse = await chai.request
        .agent(app)
        .post('/api/contract/community_template')
        .set('Accept', 'application/json')
        .query({
          chain,
          jwt: adminJWT,
        })
        .send({ contract });

      expect(postResponse.status).to.equal(201);

      contract.community_id = 'new_community_id';

      const res = await chai.request
        .agent(app)
        .put('/api/contract/community_template')
        .set('Accept', 'application/json')
        .query({
          chain,
          jwt: adminJWT,
        })
        .send({ contract });

      expect(res.status).to.equal(200);
      expect(res.body.status).to.equal('Success');
      expect(res.body.data.template_id).to.equal(contract.template_id);
    });

    it('should delete a contract template', async () => {
      const contract: Contract = {
        community_id: generateRandomString(),
        contract_id: generateRandomNumber(),
        template_id: generateRandomNumber(),
      };
      const postResponse = await chai.request
        .agent(app)
        .post('/api/contract/community_template')
        .set('Accept', 'application/json')
        .query({
          chain,
          jwt: adminJWT,
        })
        .send({ contract });

      expect(postResponse.status).to.equal(201);

      const res = await chai.request
        .agent(app)
        .delete('/api/contract/community_template')
        .set('Accept', 'application/json')
        .query({
          chain,
          jwt: adminJWT,
        })
        .send({ contract });

      expect(res.status).to.equal(200);
      expect(res.body.status).to.equal('Success');
    });

    describe('/api/contract/community_template/metadata', () => {
      const contractMetadata: ContractMetadata = {
        cct_id: generateRandomString(),
        slug: generateRandomString(),
        nickname: generateRandomString(),
        display_name: generateRandomString(),
        display_options: generateRandomString(),
      };

      it('should get a contract with metadata', async () => {
        const res = await chai.request
          .agent(app)
          .get('/api/contract/community_template/metadata')
          .set('Accept', 'application/json')
          .query({
            chain,
            jwt: adminJWT,
          })
          .send({ contractMetadata });

        expect(res.status).to.equal(200);
        expect(res.body.status).to.equal('Success');
      });

      it('should update a contract with metadata', async () => {
        const res = await chai.request
          .agent(app)
          .put('/api/contract/community_template/metadata')
          .set('Accept', 'application/json')
          .query({
            chain,
            jwt: adminJWT,
          })
          .send({ contractMetadata });

        expect(res.status).to.equal(200);
        expect(res.body.status).to.equal('Success');
      });

      it('should delete a contract with metadata', async () => {
        const res = await chai.request
          .agent(app)
          .delete('/api/contract/community_template/metadata')
          .set('Accept', 'application/json')
          .query({
            chain,
            jwt: adminJWT,
          })
          .send({ contractMetadata });

        expect(res.status).to.equal(200);
        expect(res.body.status).to.equal('Success');
      });
    });
  }

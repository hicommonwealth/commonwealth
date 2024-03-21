import { dispose } from '@hicommonwealth/core';
import { tester } from '@hicommonwealth/model';
import chai from 'chai';
import chaiHttp from 'chai-http';
import { ApiEndpoints } from 'state/api/config';
import app from '../../../server-test';

chai.use(chaiHttp);
const { expect } = chai;

let adminJWT;

describe('Topic Tests', () => {
  const chain = 'ethereum';

  before('reset database', async () => {
    await tester.seedDb();
  });

  after(async () => {
    await dispose()();
  });

  describe('Bulk Topics', () => {
    it('Should pass /bulkTopics', async () => {
      const res = await chai.request
        .agent(app)
        .get(`/api${ApiEndpoints.BULK_TOPICS}`)
        .set('Accept', 'application/json')
        .query({
          chain,
          jwt: adminJWT,
        });
      expect(res.body).to.not.be.null;
      expect(res.body.status).to.be.equal('Success');
      expect(res.body.result).to.not.be.null;
      expect(res.body.result.length).to.be.equal(2);
    });
  });
});

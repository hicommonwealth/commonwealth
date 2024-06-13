import { dispose } from '@hicommonwealth/core';
import chai from 'chai';
import chaiHttp from 'chai-http';
import { ApiEndpoints } from 'state/api/config';
import { afterAll, beforeAll, describe, test } from 'vitest';
import { testServer, TestServer } from '../../../server-test';

chai.use(chaiHttp);
const { expect } = chai;

let adminJWT;

describe('Topic Tests', () => {
  const chain = 'ethereum';

  let server: TestServer;

  beforeAll(async () => {
    server = await testServer();
  });

  afterAll(async () => {
    await dispose()();
  });

  describe('Bulk Topics', () => {
    test('Should pass /bulkTopics', async () => {
      const res = await chai.request
        .agent(server.app)
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

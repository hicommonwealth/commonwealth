process.env.CW_SCHEDULER_SECRET = 'test';

import chai from 'chai';
import app from '../../../server-test';
import { post, postBearer } from './external/appHook.spec';
import { CW_SCHEDULER_SECRET } from '../../../server/config';

const TEST_ENDPOINT = '/api/job/recomputeCounts';

describe('recompute counts', () => {
  it('should return 401 if token is not provided', async () => {
    const resp = await post(TEST_ENDPOINT, {}, true, app);
    chai.assert.equal(resp.status, 401);
  });

  it('should return 401 if token is invalid', async () => {
    const resp = await postBearer(TEST_ENDPOINT, {}, app, 'invalid');
    chai.assert.equal(resp.status, 401);
  });

  it('should return 200 if request body has access_token', async () => {
    const resp = await post(
      TEST_ENDPOINT,
      { access_token: CW_SCHEDULER_SECRET },
      true,
      app
    );
    chai.assert.equal(resp.status, 'Success');
  });

  it('should return 200 if authorization header is valid', async () => {
    const resp = await postBearer(TEST_ENDPOINT, {}, app, CW_SCHEDULER_SECRET);
    chai.assert.equal(resp.status, 200);
  });
});

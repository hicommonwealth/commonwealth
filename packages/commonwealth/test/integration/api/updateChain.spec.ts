import { assert } from 'chai';
import models from '../../../server/database';
import updateChain from '../../../server/routes/updateChain';
import { getReq, res } from '../../unit/unitHelpers';
import { resetDatabase } from '../../util/resetDatabase';

describe('UpdateChain Tests', () => {
  before(async () => {
    await resetDatabase();
  });

  it('Correctly updates chain', async () => {
    const response = (await updateChain(
      models,
      getReq({}),
      res(),
      null
    )) as any;

    assert.equal(response.length, 0);
  });
});
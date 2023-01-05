import { assert } from 'chai';

import validateChain from '../../../server/middleware/validateChain';
import { mockDb } from '../../../server/models/mocks/mock_database';

describe('validateChain() unit tests', () => {

  it('should validate chain ethereum successfully', async () => {
    const chainParams = {
      chain: 'ethereum',
    };

    const [chain] = await validateChain(mockDb, chainParams);
    assert.equal(chain.id, 'ethereum');
  });

});

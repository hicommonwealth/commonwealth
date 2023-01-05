import { assert } from 'chai';

import validateChain from '../../../server/middleware/validateChain';
import models from '../../../server/database';

describe('validateChain() unit tests', () => {

  it('should validate chain ethereum successfully', async () => {
    const chainParams = {
      chain: 'ethereum',
    };

    const [chain] = await validateChain(models, chainParams);
    assert.equal(chain.id, 'ethereum');
  });

});

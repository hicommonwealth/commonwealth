import chai from 'chai';

import { EdgewareSpec } from '../../../scripts/specs/edgeware';
import { createApi } from 'chain-events/src/chain-bases/substrate/subscribeFunc';

const { assert } = chai;

describe.skip('Subscribe Func Tests', () => {
  it('should create an API connection', async () => {
    const VALID_URL = 'ws://mainnet1.edgewa.re:9944';
    const api = await createApi(VALID_URL, EdgewareSpec);
    assert.isNotNull(api);
    assert.isTrue(api.isConnected);
  });

  it('should timeout on bad api connection', async () => {
    const INVALID_URL = 'ws://mainnet1.edgewa.re:9943';
    try {
      await createApi(INVALID_URL, EdgewareSpec, 'edgeware');
      assert.fail('Should throw error on connect timeout');
    } catch (e) {
      // success
    }
  });
});

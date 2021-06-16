import chai from 'chai';
import { spec as EdgewareSpec } from '@edgeware/node-types';

import { createApi } from '../../../src/substrate/subscribeFunc';

const { assert } = chai;

describe('Subscribe Func Tests', () => {
  it('should create an API connection', async () => {
    const VALID_URL = 'ws://mainnet1.edgewa.re:9944';
    const api = await createApi(VALID_URL, EdgewareSpec);
    assert.isNotNull(api);
    assert.isTrue(api.isConnected);
  });

  it('should timeout on bad api connection', async () => {
    const INVALID_URL = 'ws://mainnet1.edgewa.re:9943';
    try {
      await createApi(INVALID_URL, EdgewareSpec, 200);
      assert.fail('Should throw error on connect timeout');
    } catch (e) {
      // success
    }
  });
});

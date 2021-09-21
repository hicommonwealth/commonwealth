import chai, { assert } from 'chai';
import { IdentityFetchCacheNew } from '../../../server/util/identityFetchCache';
import models from '../../../server/database';

describe.only('New identity cache tests', () => {
  it.only('Should add an identity to the cache', async () => {
    const cache = new IdentityFetchCacheNew();
    await cache.add('polkadot', '0x30DB748Fc0E4667CD6494f208de453464cf314A5')
    const result = await models.IdentityCache.findOne({
      where: {
        "chain": 'polkadot',
        "address": '0x30DB748Fc0E4667CD6494f208de453464cf314A5'
      }
    })
    assert(result.chain === 'polkadot');
    assert(result.address === '0x30DB748Fc0E4667CD6494f208de453464cf314A5');
  })
})

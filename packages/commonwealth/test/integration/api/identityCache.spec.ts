import { assert } from 'chai';
import { IdentityFetchCacheNew } from '../../../server/util/identityFetchCache';
import models from '../../../server/database';

describe('New identity cache tests', () => {
  it('Should add an identity to the cache', async () => {
    let cache;
    try {
      cache = new IdentityFetchCacheNew();
    } catch (error) {
      console.log(error);
      assert(error === null);
    }
    await cache.add('edgeware', '0x30DB748Fc0E4667CD6494f208de453464cf314A5');
    const result = await models.IdentityCache.findOne({
      where: {
        chain: 'edgeware',
        address: '0x30DB748Fc0E4667CD6494f208de453464cf314A5',
      },
    });
    assert(result.chain === 'edgeware');
    assert(result.address === '0x30DB748Fc0E4667CD6494f208de453464cf314A5');
  });
});

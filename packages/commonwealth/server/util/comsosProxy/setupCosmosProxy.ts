import {
  CacheDecorator,
  lookupKeyDurationInReq,
} from '@hicommonwealth/adapters';
import * as express from 'express';
import {
  calcCosmosLCDCacheKeyDuration,
  calcCosmosRPCCacheKeyDuration,
} from '../cosmosCache';
import { cosmosHandler } from './handlers/cosmos';
import {
  cosmosMagicNodeInfoProxyHandler,
  cosmosMagicOptionsHandler,
} from './handlers/magic';

const DEFAULT_CACHE_DURATION = 60 * 10; // 10 minutes

export function setupCosmosProxies(
  app: express.Express,
  cacheDecorator: CacheDecorator,
) {
  app.post(
    '/cosmosAPI/:community_id',
    express.text() as express.RequestHandler,
    calcCosmosRPCCacheKeyDuration,
    cacheDecorator.cacheMiddleware(
      DEFAULT_CACHE_DURATION,
      lookupKeyDurationInReq,
    ),
    cosmosHandler.bind('RPC'),
  );

  app.use(
    '/cosmosAPI/v1/:community_id',
    express.text() as express.RequestHandler,
    calcCosmosLCDCacheKeyDuration,
    cacheDecorator.cacheMiddleware(
      DEFAULT_CACHE_DURATION,
      lookupKeyDurationInReq,
    ),
    cosmosHandler.bind('REST'),
  );

  // magic
  app.options('/magicCosmosAPI/:chain', cosmosMagicOptionsHandler);
  app.use(
    '/magicCosmosAPI/:chain/?(node_info)?',
    express.text() as express.RequestHandler,
    cosmosMagicNodeInfoProxyHandler,
  );
}

import {
  CacheDecorator,
  lookupKeyDurationInReq,
} from '@hicommonwealth/adapters';
import { text, type Router } from 'express';
import { registerRoute } from '../../middleware/methodNotAllowed';
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

export function setupCosmosProxy(
  router: Router,
  cacheDecorator: CacheDecorator,
) {
  registerRoute(
    router,
    'post',
    '/cosmosProxy/:community_id',
    text(),
    calcCosmosRPCCacheKeyDuration,
    cacheDecorator.cacheMiddleware(
      DEFAULT_CACHE_DURATION,
      lookupKeyDurationInReq,
    ),
    cosmosHandler.bind(this, 'RPC'),
  );

  router.use(
    '/cosmosProxy/v1/:community_id',
    text(),
    calcCosmosLCDCacheKeyDuration,
    cacheDecorator.cacheMiddleware(
      DEFAULT_CACHE_DURATION,
      lookupKeyDurationInReq,
    ),
    cosmosHandler.bind(this, 'REST'),
  );

  // magic
  router.options(
    '/magicCosmosProxy/:chain',
    cosmosMagicOptionsHandler.bind(this),
  );
  router.use(
    '/magicCosmosProxy/:chain/?(node_info)?',
    text(),
    cosmosMagicNodeInfoProxyHandler.bind(this),
  );
}

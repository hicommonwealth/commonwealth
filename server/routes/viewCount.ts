import { Request, Response, NextFunction } from 'express';
import ViewCountCache from '../util/viewCountCache';
import { factory, formatFilename } from '../../shared/logging';

const log = factory.getLogger(formatFilename(__filename));

export const Errors = {
  NoObjectId: 'Must provide object_id',
  NoChainOrComm: 'Must provide chain or community',
  InvalidChainOrComm: 'Invalid chain or community',
  InvalidThread: 'Invalid offchain thread',
};

const viewCount = async (models, cache: ViewCountCache, req: Request, res: Response, next: NextFunction) => {
  if (!req.body.object_id) {
    return next(new Error(Errors.NoObjectId));
  }
  if (!req.body.chain && !req.body.community) {
    return next(new Error(Errors.NoChainOrComm));
  }
  const chain = await models.Chain.findOne({
    where: { id: req.body.chain }
  });
  const community = await models.OffchainCommunity.findOne({
    where: { id: req.body.community }
  });

  if (!chain && !community) {
    return next(new Error(Errors.InvalidChainOrComm));
  }

  // verify thread exists before querying
  const obj = await models.OffchainThread.findOne({
    where: community ? {
      community: req.body.community,
      id: req.body.object_id,
    } : {
      chain: req.body.chain,
      id: req.body.object_id,
    }
  });
  if (!obj) {
    return next(new Error(Errors.InvalidThread));
  }

  // query view counts, creating as needed
  let [ count, created ] = await models.OffchainViewCount.findOrCreate({
    where: community ? {
      community: req.body.community,
      object_id: req.body.object_id,
    } : {
      chain: req.body.chain,
      object_id: req.body.object_id,
    },
    defaults: {
      view_count: 1,
    }
  });

  // hit cache to decide whether to add to count
  const isNewView = await cache.view(req.ip, req.body.object_id);

  // add one to view count if not in cache and not newly created
  if (isNewView && !created) {
    count = await count.update({
      view_count: count.view_count + 1,
    });
  }

  return res.json({ status: 'Success', result: count });
};

export default viewCount;

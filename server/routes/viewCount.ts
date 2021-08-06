import { Request, Response, NextFunction } from 'express';
import ViewCountCache from '../util/viewCountCache';
import { factory, formatFilename } from '../../shared/logging';
import { DB } from '../database';

const log = factory.getLogger(formatFilename(__filename));

export const Errors = {
  NoObjectId: 'Must provide object ID',
  NoChainOrComm: 'Must provide chain or community',
  InvalidChainOrComm: 'Invalid chain or community',
  InvalidThread: 'Invalid offchain thread',
};

const viewCount = async (models: DB, cache: ViewCountCache, req: Request, res: Response, next: NextFunction) => {
  if (!req.body.object_id) {
    return next(new Error(Errors.NoObjectId));
  }
  if (!req.body.chain && !req.body.community) {
    return next(new Error(Errors.NoChainOrComm));
  }
  console.log(req.body.chain, req.body.community)
  const chain = await models.Chain.findOne({
    where: { id: req.body.chain || null }
  });
  const community = await models.OffchainCommunity.findOne({
    where: { id: req.body.community || null }
  });

  if (!chain && !community) {
    return next(new Error(Errors.InvalidChainOrComm));
  }

  // verify count exists before querying
  let count = await models.OffchainViewCount.findOne({
    where: community ? {
      community: req.body.community,
      object_id: req.body.object_id,
    } : {
      chain: req.body.chain,
      object_id: req.body.object_id,
    }
  });
  if (!count) {
    return next(new Error(Errors.InvalidThread));
  }

  // hit cache to decide whether to add to count
  const isNewView = await cache.view(req.ip, req.body.object_id);

  // add one to view count if not in cache and not newly created
  if (isNewView) {
    count = await count.update({
      view_count: count.view_count + 1,
    });
  }

  return res.json({ status: 'Success', result: count.toJSON() });
};

export default viewCount;

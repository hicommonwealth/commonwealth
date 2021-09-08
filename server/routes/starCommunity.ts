import { Request, Response, NextFunction } from 'express';
import lookupCommunityIsVisibleToUser from '../util/lookupCommunityIsVisibleToUser';
import { DB } from '../database';

export const Errors = {
  NoStarValue: 'Must specify true or false to set starred status',
};

const starCommunity = async (models: DB, req: Request, res: Response, next: NextFunction) => {
  const [chain, community, error] = await lookupCommunityIsVisibleToUser(models, req.body, req.user);
  if (error) return next(new Error(error));

  if (req.body.star === 'true') {
    // star community
    const star = await models.StarredCommunity.create(
      chain
        ? { chain: chain.id, user_id: req.user.id }
        : { community: community.id, user_id: req.user.id }
    );
    return res.json({ status: 'Success', result: star.toJSON() });
  } else if (req.body.star === 'false') {
    // unstar community
    const star = await models.StarredCommunity.findOne({
      where: chain
        ? { chain: chain.id, user_id: req.user.id }
        : { community: community.id, user_id: req.user.id }
    });
    if (star) {
      await star.destroy();
    }
    return res.json({ status: 'Success' });
  } else {
    return next(new Error(Errors.NoStarValue));
  }
};

export default starCommunity;

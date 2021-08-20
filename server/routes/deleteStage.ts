/* eslint-disable no-restricted-syntax */
import { Response, NextFunction } from 'express';
import { QueryTypes } from 'sequelize';
import lookupCommunityIsVisibleToUser from '../util/lookupCommunityIsVisibleToUser';
import { DB } from '../database';

export const Errors = {
  NotLoggedIn: 'Not logged in',
  NoStageId: 'Must provide stage ID',
  NotAdmin: 'Only admins can delete stages',
  StageNotFound: 'Stage not found',
  DeleteFail: 'Could not delete stage',
};

const deleteStage = async (models: DB, req, res: Response, next: NextFunction) => {
  const [chain, community, error] = await lookupCommunityIsVisibleToUser(models, req.body, req.user);
  if (error) return next(new Error(error));
  if (!req.user) {
    return next(new Error(Errors.NotLoggedIn));
  }
  if (!req.body.id) {
    return next(new Error(Errors.NoStageId));
  }
  if (req.body.featured_order && !req.user.isAdmin) {
    return next(new Error(Errors.NotAdmin));
  }

  const { id } = req.body;
  const stage = await models.OffchainStage.findOne({ where: { id } });
  if (!stage) return next(new Error(Errors.StageNotFound));

  const chainOrCommunity = community
    ? 'community = :community'
    : 'chain = :chain';
  const replacements = community
    ? { community: community.id }
    : { chain: chain.id };
  replacements['id'] = id;
  const query = `UPDATE "OffchainThreads" SET stage_id=null WHERE stage_id = :id AND ${chainOrCommunity};`;
  await models.sequelize.query(query, {
    replacements,
    type: QueryTypes.UPDATE,
  });

  stage.destroy().then(() => {
    res.json({ status: 'Success' });
  }).catch((e) => {
    next(new Error(Errors.DeleteFail));
  });
};

export default deleteStage;

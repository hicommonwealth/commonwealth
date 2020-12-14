/* eslint-disable quotes */
import { Request, Response, NextFunction } from 'express';
import { QueryTypes } from 'sequelize';
import lookupCommunityIsVisibleToUser from '../util/lookupCommunityIsVisibleToUser';
import { factory, formatFilename } from '../../shared/logging';

const log = factory.getLogger(formatFilename(__filename));

const search = async (models, req: Request, res: Response, next: NextFunction) => {
  const [chain, community] = await lookupCommunityIsVisibleToUser(models, req.query, req.user, next);
  const { cutoff_date } = req.query;

  // set up query parameters
  const communityOptions = community
    ? `community = :community `
    : `chain = :chain `;
  const replacements = community
    ? { community: community.id }
    : { chain: chain.id };
  replacements['searchTerm'] = req.query.search;

  // make search query
  let threadsAndComments;
  try {
    threadsAndComments = await models.sequelize.query(`
SELECT title, body FROM "OffchainThreads" WHERE ${communityOptions}
AND _search @@ plainto_tsquery('english', :searchTerm)
LIMIT 20;
`, {
      replacements,
      type: QueryTypes.SELECT
    });
  } catch (e) {
    console.log(e);
    return next(new Error('Invalid search term'));
  }

  return res.json({
    status: 'Success',
    response: threadsAndComments,
  });
};

export default search;

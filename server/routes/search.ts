/* eslint-disable quotes */
import { Request, Response, NextFunction } from 'express';
import { QueryTypes } from 'sequelize';
import lookupCommunityIsVisibleToUser from '../util/lookupCommunityIsVisibleToUser';
import { factory, formatFilename } from '../../shared/logging';

const log = factory.getLogger(formatFilename(__filename));

const Errors = {
  UnexpectedError: 'Unexpected error',
  QueryTooShort: 'Query must be at least 3 characters',
};

const search = async (models, req: Request, res: Response, next: NextFunction) => {
  const [chain, community] = await lookupCommunityIsVisibleToUser(models, req.query, req.user, next);
  const { cutoff_date } = req.query;

  // set up query parameters
  const communityOptions = community
    ? `community = :community `
    : `chain = :chain `;
  const communityOptions2 = community
    ? `"OffchainComments".community = :community `
    : `"OffchainComments".chain = :chain `;
  const replacements = community
    ? { community: community.id }
    : { chain: chain.id };
  replacements['searchTerm'] = req.query.search;
  replacements['limit'] = 20;

  if (req.query.search.length < 3) {
    return next(new Error(Errors.QueryTooShort));
  }

  // query for both threads and comments, and then execute a union and keep only the most recent :limit
  let threadsAndComments;
  try {
    threadsAndComments = await models.sequelize.query(`
SELECT * FROM
((SELECT title, body, CAST(id as VARCHAR) as proposalId, 'thread' as type, created_at FROM "OffchainThreads"
WHERE ${communityOptions} AND _search @@ plainto_tsquery('english', :searchTerm) ORDER BY created_at DESC LIMIT :limit)
UNION ALL
(SELECT "OffchainThreads".title, text, root_id as proposalId, 'comment' as type, "OffchainComments".created_at FROM "OffchainComments"
JOIN "OffchainThreads" ON "OffchainThreads".id = CAST(REPLACE(root_id, 'discussion_', '') AS int)
WHERE ${communityOptions2} AND "OffchainComments"._search @@ plainto_tsquery('english', :searchTerm)
ORDER BY created_at DESC LIMIT :limit)) s
ORDER BY created_at DESC LIMIT :limit;
`, {
      replacements,
      type: QueryTypes.SELECT
    });
  } catch (e) {
    console.log(e);
    return next(new Error(Errors.UnexpectedError));
  }

  return res.json({
    status: 'Success',
    response: threadsAndComments,
  });
};

export default search;

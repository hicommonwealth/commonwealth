/* eslint-disable quotes */
import { Request, Response, NextFunction } from 'express';
import { Op, QueryTypes } from 'sequelize';
import lookupCommunityIsVisibleToUser from '../util/lookupCommunityIsVisibleToUser';
import { factory, formatFilename } from '../../shared/logging';
import { DB } from '../database';

const log = factory.getLogger(formatFilename(__filename));

const Errors = {
  UnexpectedError: 'Unexpected error',
  QueryMissing: 'Must enter query to begin searching',
  QueryTooShort: 'Query must be at least 4 characters',
  NoCommunity: 'Title search must be community scoped'
};

const search = async (
  models: DB,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let replacements = {};

  if (!req.query.search) {
    return next(new Error(Errors.QueryMissing));
  }
  if (req.query.search.length < 4) {
    return next(new Error(Errors.QueryTooShort));
  }

  if (req.query.thread_title_only === 'true') {
    if (!req.query.chain && !req.query.community) {
      return next(new Error(Errors.NoCommunity));
    }
    const [chain, community, error] = await lookupCommunityIsVisibleToUser(
      models,
      req.query,
      req.user
    );
    if (error) return next(new Error(error));
    const encodedSearchTerm = encodeURIComponent(req.query.search);
    const params = {
      title: {
        [Op.or]: [
          { [Op.iLike]: `%${encodedSearchTerm}%` },
          { [Op.iLike]: `%${req.query.search}%` },
        ]
      },
    };
    if (chain) params['chain'] = chain.id;
    else if (community) params['community'] = community.id;
    try {
      const threads = await models.OffchainThread.findAll({
        where: params,
        limit: req.query.results_size || 20,
        attributes: {
          exclude: ['body', 'plaintext', 'version_history']
        },
        include: [{
            model: models.Address,
            as: 'Address',
          },
        ],
      });
      return res.json({
        status: 'Success',
        result: threads,
      });
    } catch (e) {
      console.log(e);
      return next(new Error(Errors.UnexpectedError));
    }
  }

  // Community-scoped search
  let communityOptions = '';
  let communityOptions2 = '';
  if (req.query.chain || req.query.community) {
    const [chain, community, error] = await lookupCommunityIsVisibleToUser(
      models,
      req.query,
      req.user
    );
    if (error) return next(new Error(error));

    // set up query parameters
    communityOptions = community
      ? `"OffchainThreads".community = :community AND `
      : `"OffchainThreads".chain = :chain AND `;
    communityOptions2 = community
      ? `"OffchainComments".community = :community AND `
      : `"OffchainComments".chain = :chain AND `;
    replacements = community
      ? { community: community.id }
      : { chain: chain.id };
  }

  const { cutoff_date } = req.query;

  replacements['searchTerm'] = req.query.search;
  replacements['limit'] = 50; // must be same as SEARCH_PAGE_SIZE on frontend

  // query for both threads and comments, and then execute a union and keep only the most recent :limit
  let threadsAndComments;
  try {
    threadsAndComments = await models.sequelize.query(
      `
SELECT * FROM (
  (SELECT
      "OffchainThreads".title,
      "OffchainThreads".body,
      CAST("OffchainThreads".id as VARCHAR) as proposalId,
      'thread' as type,
      "Addresses".id as address_id,
      "Addresses".address,
      "Addresses".chain as address_chain,
      "OffchainThreads".created_at,
      "OffchainThreads".chain,
      "OffchainThreads".community
    FROM "OffchainThreads"
    JOIN "Addresses" ON "OffchainThreads".address_id = "Addresses".id
    WHERE ${communityOptions} "OffchainThreads"._search @@ plainto_tsquery('english', :searchTerm)
    ORDER BY "OffchainThreads".created_at DESC LIMIT :limit)
  UNION ALL
  (SELECT
      "OffchainThreads".title,
      "OffchainComments".text,
      "OffchainComments".root_id as proposalId,
      'comment' as type,
      "Addresses".id as address_id,
      "Addresses".address,
      "Addresses".chain as address_chain,
      "OffchainComments".created_at,
      "OffchainThreads".chain,
      "OffchainThreads".community
    FROM "OffchainComments"
    JOIN "OffchainThreads" ON "OffchainThreads".id =
        CASE WHEN root_id ~ '^discussion_[0-9\\.]+$' THEN CAST(REPLACE(root_id, 'discussion_', '') AS int) ELSE NULL END
    JOIN "Addresses" ON "OffchainComments".address_id = "Addresses".id
    WHERE ${communityOptions2} "OffchainComments"._search @@ plainto_tsquery('english', :searchTerm)
    ORDER BY "OffchainComments".created_at DESC LIMIT :limit)
) s
ORDER BY created_at DESC LIMIT :limit;
`,
      {
        replacements,
        type: QueryTypes.SELECT,
      }
    );
  } catch (e) {
    console.log(e);
    return next(new Error(Errors.UnexpectedError));
  }

  return res.json({
    status: 'Success',
    result: threadsAndComments,
  });
};

export default search;

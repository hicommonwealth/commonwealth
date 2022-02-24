/* eslint-disable quotes */
import { Request, Response, NextFunction } from 'express';
import { QueryTypes } from 'sequelize';
import validateChain from '../util/validateChain';
import { DB } from '../database';

const Errors = {
  UnexpectedError: 'Unexpected error',
  QueryMissing: 'Must enter query to begin searching',
  QueryTooShort: 'Query must be at least 4 characters',
  NoCommunity: 'Title search must be community scoped'
};

const searchComments = async (
  models: DB,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let bind = {};

  if (!req.query.search) {
    return next(new Error(Errors.QueryMissing));
  }
  if (req.query.search.length < 4) {
    return next(new Error(Errors.QueryTooShort));
  }

  // Community-scoped search
  let communityOptions = '';
  if (req.query.chain || req.query.community) {
    const [chain, error] = await validateChain(models, req.query);
    if (error) return next(new Error(error));

    // set up query parameters
    communityOptions = `AND "OffchainComments".chain = $chain `;
    bind = { chain: chain.id };
  }

  const sort = req.query.sort === 'Newest'
    ? 'ORDER BY "OffchainComments".created_at DESC'
    : req.query.sort === 'Oldest'
    ? 'ORDER BY "OffchainComments".created_at ASC'
    : 'ORDER BY rank DESC'

  bind['searchTerm'] = req.query.search;
  bind['limit'] = 50; // must be same as SEARCH_PAGE_SIZE on frontend

  // query for both threads and comments, and then execute a union and keep only the most recent :limit
  let comments;
  try {
    comments = await models.sequelize.query(
      `
  SELECT
      "OffchainThreads".title,
      "OffchainComments".text,
      "OffchainComments".root_id as proposalId,
      'comment' as type,
      "Addresses".id as address_id,
      "Addresses".address,
      "Addresses".chain as address_chain,
      "OffchainComments".created_at,
      "OffchainThreads".chain,
      ts_rank_cd("OffchainComments"._search, query) as rank
    FROM "OffchainComments"
    JOIN "OffchainThreads" ON "OffchainThreads".id =
        CASE WHEN root_id ~ '^discussion_[0-9\\.]+$' THEN CAST(REPLACE(root_id, 'discussion_', '') AS int) ELSE NULL END
    JOIN "Addresses" ON "OffchainComments".address_id = "Addresses".id, 
    websearch_to_tsquery('english', $searchTerm) as query
    WHERE query @@ "OffchainComments"._search ${communityOptions} 
    ${sort} LIMIT $limit
`,
      {
        bind,
        type: QueryTypes.SELECT,
      }
    );
  } catch (e) {
    console.log(e);
    return next(new Error(Errors.UnexpectedError));
  }

  return res.json({
    status: 'Success',
    result: comments,
  });
};

export default searchComments;
import type { DB } from '../models';
/* eslint-disable quotes */
import { AppError, ServerError } from 'common-common/src/errors';
import type { NextFunction, Request, Response } from 'express';
import { QueryTypes } from 'sequelize';

const Errors = {
  UnexpectedError: 'Unexpected error',
  QueryMissing: 'Must enter query to begin searching',
  QueryTooShort: 'Query must be at least 4 characters',
  NoCommunity: 'Title search must be community scoped',
};

const searchComments = async (
  models: DB,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let bind = {};

  const chain = req.chain;
  if (!req.query.search) {
    return next(new AppError(Errors.QueryMissing));
  }
  if (req.query.search.length < 4) {
    return next(new AppError(Errors.QueryTooShort));
  }

  // Community-scoped search
  let communityOptions = '';
  if (req.query.chain) {
    // set up query parameters
    communityOptions = `AND "Comments".chain = $chain `;
    bind = { chain: chain.id };
  }

  const sort =
    req.query.sort === 'Newest'
      ? 'ORDER BY "Comments".created_at DESC'
      : req.query.sort === 'Oldest'
      ? 'ORDER BY "Comments".created_at ASC'
      : 'ORDER BY rank DESC';

  bind['searchTerm'] = req.query.search;
  bind['limit'] = 50; // must be same as SEARCH_PAGE_SIZE on frontend

  // query for both threads and comments, and then execute a union and keep only the most recent :limit
  let comments;
  try {
    comments = await models.sequelize.query(
      `
  SELECT
      "Threads".title,
      "Comments".text,
      "Comments".thread_id as proposalId,
      'comment' as type,
      "Addresses".id as address_id,
      "Addresses".address,
      "Addresses".chain as address_chain,
      "Comments".created_at,
      "Threads".chain,
      ts_rank_cd("Comments"._search, query) as rank
    FROM "Comments"
    JOIN "Threads" ON "Comments".thread_id = "Threads".id
    JOIN "Addresses" ON "Comments".address_id = "Addresses".id, 
    websearch_to_tsquery('english', $searchTerm) as query
    WHERE query @@ "Comments"._search ${communityOptions} AND "Comments".deleted_at IS NULL
    ${sort} LIMIT $limit
`,
      {
        bind,
        type: QueryTypes.SELECT,
      }
    );
  } catch (e) {
    console.log(e);
    return next(new ServerError(Errors.UnexpectedError));
  }

  return res.json({
    status: 'Success',
    result: comments,
  });
};

export default searchComments;

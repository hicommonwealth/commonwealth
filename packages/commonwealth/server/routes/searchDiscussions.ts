import type { DB } from '../models';
/* eslint-disable quotes */
import { AppError, ServerError } from 'common-common/src/errors';
import type { NextFunction, Request, Response } from 'express';
import { Op, QueryTypes } from 'sequelize';

const Errors = {
  UnexpectedError: 'Unexpected error',
  QueryMissing: 'Must enter query to begin searching',
  QueryTooShort: 'Query must be at least 4 characters',
  NoChain: 'Title search must be chain-scoped',
};

const searchDiscussions = async (
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

  if (req.query.thread_title_only === 'true') {
    if (!req.query.chain) {
      return next(new AppError(Errors.NoChain));
    }
    const encodedSearchTerm = encodeURIComponent(req.query.search);
    const params = {
      chain: chain.id,
      title: {
        [Op.or]: [
          { [Op.iLike]: `%${encodedSearchTerm}%` },
          { [Op.iLike]: `%${req.query.search}%` },
        ],
      },
    };

    try {
      const threads = await models.Thread.findAll({
        where: params,
        limit: req.query.results_size || 20,
        attributes: {
          exclude: ['body', 'plaintext', 'version_history'],
        },
        include: [
          {
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
      return next(new ServerError(Errors.UnexpectedError));
    }
  }

  // Community-scoped search
  let communityOptions = '';
  if (req.query.chain) {
    // set up query parameters
    communityOptions = `AND "Threads".chain = $chain `;
    bind = { chain: chain.id };
  }

  const sort =
    req.query.sort === 'Newest'
      ? 'ORDER BY "Threads".created_at DESC'
      : req.query.sort === 'Oldest'
      ? 'ORDER BY "Threads".created_at ASC'
      : 'ORDER BY rank DESC';

  bind['searchTerm'] = req.query.search;
  bind['limit'] = 50; // must be same as SEARCH_PAGE_SIZE on frontend

  // query for both threads and comments, and then execute a union and keep only the most recent :limit
  let threadsAndComments;
  try {
    threadsAndComments = await models.sequelize.query(
      `
  SELECT
      "Threads".title,
      "Threads".body,
      CAST("Threads".id as VARCHAR) as proposalId,
      'thread' as type,
      "Addresses".id as address_id,
      "Addresses".address,
      "Addresses".chain as address_chain,
      "Threads".created_at,
      "Threads".chain,
      ts_rank_cd("Threads"._search, query) as rank
    FROM "Threads"
    JOIN "Addresses" ON "Threads".address_id = "Addresses".id, 
    websearch_to_tsquery('english', $searchTerm) as query
    WHERE query @@ "Threads"._search ${communityOptions} AND "Threads".deleted_at IS NULL
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
    result: threadsAndComments,
  });
};

export default searchDiscussions;

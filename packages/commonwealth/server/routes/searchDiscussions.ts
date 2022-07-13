/* eslint-disable quotes */
import { Request, Response, NextFunction } from 'express';
import { Op, QueryTypes } from 'sequelize';
import validateChain from '../util/validateChain';
import { DB } from '../database';

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

  if (!req.query.search) {
    return next(new Error(Errors.QueryMissing));
  }
  if (req.query.search.length < 4) {
    return next(new Error(Errors.QueryTooShort));
  }

  if (req.query.thread_title_only === 'true') {
    if (!req.query.chain) {
      return next(new Error(Errors.NoChain));
    }
    const [chain, error] = await validateChain(models, req.query);
    if (error) return next(new Error(error));
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
      const threads = await models.OffchainThread.findAll({
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
      return next(new Error(Errors.UnexpectedError));
    }
  }

  // Community-scoped search
  let communityOptions = '';
  if (req.query.chain) {
    const [chain, error] = await validateChain(models, req.query);
    if (error) return next(new Error(error));

    // set up query parameters
    communityOptions = `AND "OffchainThreads".chain = $chain `;
    bind = { chain: chain.id };
  }

  const sort =
    req.query.sort === 'Newest'
      ? 'ORDER BY "OffchainThreads".created_at DESC'
      : req.query.sort === 'Oldest'
      ? 'ORDER BY "OffchainThreads".created_at ASC'
      : 'ORDER BY rank DESC';

  bind['searchTerm'] = req.query.search;
  bind['limit'] = 50; // must be same as SEARCH_PAGE_SIZE on frontend

  // query for both threads and comments, and then execute a union and keep only the most recent :limit
  let threadsAndComments;
  try {
    threadsAndComments = await models.sequelize.query(
      `
  SELECT
      "OffchainThreads".title,
      "OffchainThreads".body,
      CAST("OffchainThreads".id as VARCHAR) as proposalId,
      'thread' as type,
      "Addresses".id as address_id,
      "Addresses".address,
      "Addresses".chain as address_chain,
      "OffchainThreads".created_at,
      "OffchainThreads".chain,
      ts_rank_cd("OffchainThreads"._search, query) as rank
    FROM "OffchainThreads"
    JOIN "Addresses" ON "OffchainThreads".address_id = "Addresses".id, 
    websearch_to_tsquery('english', $searchTerm) as query
    WHERE query @@ "OffchainThreads"._search ${communityOptions} AND "OffchainThreads".deleted_at IS NULL
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
    result: threadsAndComments,
  });
};

export default searchDiscussions;

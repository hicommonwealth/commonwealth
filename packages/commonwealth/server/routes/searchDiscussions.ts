/* eslint-disable quotes */
import { AppError } from 'common-common/src/errors';
import type { NextFunction, Request, Response } from 'express';
import { Op, QueryTypes } from 'sequelize';

import type { DB } from '../models';
import { ChainInstance } from '../models/chain';
import { ALL_CHAINS } from '../middleware/databaseValidationService';

const MIN_SEARCH_QUERY_LENGTH = 4;

const Errors = {
  UnexpectedError: 'Unexpected error',
  QueryMissing: 'Must enter query to begin searching',
  QueryTooShort: 'Query must be at least 4 characters',
  NoChains: 'No chains resolved to execute search',
};

type SearchDiscussionsQuery = {
  search?: string;
  thread_title_only?: 'true' | 'false';
  chain?: string;
  results_size?: string;
  sort?: string;
};

type SearchDiscussionsBindOptions = {
  chains?: string[];
  searchTerm?: string;
  limit?: number;
};

const search = async (
  models: DB,
  chains: ChainInstance[],
  options: SearchDiscussionsQuery
) => {
  if (chains.length === 0) {
    throw new AppError(Errors.NoChains);
  }

  const allChainIds = chains.map((chain) => chain.id);

  if (options.thread_title_only === 'true') {
    const encodedSearchTerm = encodeURIComponent(options.search);
    const params = {
      chain: {
        [Op.in]: allChainIds,
      },
      title: {
        [Op.or]: [
          { [Op.iLike]: `%${encodedSearchTerm}%` },
          { [Op.iLike]: `%${options.search}%` },
        ],
      },
    };

    const threads = await models.Thread.findAll({
      where: params,
      limit: parseInt(options.results_size, 10) || 20,
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
    return threads;
  }

  const bind: SearchDiscussionsBindOptions = {
    chains: allChainIds,
    searchTerm: options.search,
    limit: 50, // must be same as SEARCH_PAGE_SIZE on frontend
  };

  const sortOption =
    options.sort === 'Newest'
      ? '"Threads".created_at DESC'
      : options.sort === 'Oldest'
      ? '"Threads".created_at ASC'
      : 'rank DESC';
  const sort = `ORDER BY ${sortOption}`;

  // query for both threads and comments, and then execute a union and keep only the most recent :limit
  const threadsAndComments = await models.sequelize.query(
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
      WHERE
        "Threads".deleted_at IS NULL AND
        "Threads".chain = ANY($chains) AND
        query @@ "Threads"._search
      ${sort} LIMIT $limit
  `,
    {
      bind,
      type: QueryTypes.SELECT,
    }
  );

  return threadsAndComments;
};

const searchDiscussions = async (
  models: DB,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const options = req.query as SearchDiscussionsQuery;
    if (!options.search) {
      throw new AppError(Errors.QueryMissing);
    }
    if (options.search.length < MIN_SEARCH_QUERY_LENGTH) {
      throw new AppError(Errors.QueryTooShort);
    }
    if (!options.chain) {
      throw new AppError(Errors.NoChains);
    }
    if (!req.chain) {
      // must explicitly request all chains
      if (options.chain !== ALL_CHAINS) {
        throw new AppError(Errors.NoChains);
      }

      const allChains = await models.Chain.findAll({});
      const allSearchResults = await search(models, allChains, req.query);

      return res.json({
        status: 'Success',
        result: allSearchResults,
      });
    }

    const threadsAndComments = await search(models, [req.chain], req.query);
    return res.json({
      status: 'Success',
      result: threadsAndComments,
    });
  } catch (err) {
    console.error(err);
    return next(err);
  }
};

export default searchDiscussions;

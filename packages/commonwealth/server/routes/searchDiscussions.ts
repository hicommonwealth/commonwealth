/* eslint-disable quotes */
import { AppError } from 'common-common/src/errors';
import type { NextFunction, Request, Response } from 'express';
import { Op, QueryTypes } from 'sequelize';

import type { DB } from '../models';
import { ChainInstance } from '../models/chain';
import { ALL_CHAINS } from '../middleware/databaseValidationService';
import {
  PaginationSqlBind,
  buildPaginationSql,
} from '../../server/util/queries';

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
  sort?: string;
  page?: string;
  page_size?: string;
};

type SearchDiscussionsBindOptions = PaginationSqlBind & {
  chain?: string;
  searchTerm?: string;
};

const search = async (
  models: DB,
  chain: ChainInstance | null,
  options: SearchDiscussionsQuery
) => {
  if (options.thread_title_only === 'true') {
    const encodedSearchTerm = encodeURIComponent(options.search);
    const params: any = {
      title: {
        [Op.or]: [
          { [Op.iLike]: `%${encodedSearchTerm}%` },
          { [Op.iLike]: `%${options.search}%` },
        ],
      },
    };
    if (chain) {
      params.chain = chain.id;
    }

    const threads = await models.Thread.scope('excludeAttributes').findAll({
      where: params,
      limit: parseInt(options.page_size, 10) || 20,
      include: [
        {
          model: models.Address,
          as: 'Address',
        },
      ],
    });

    return threads;
  }

  // sort by rank by default
  let sortOptions: {
    column: string;
    direction: 'ASC' | 'DESC';
  } = {
    column: 'rank',
    direction: 'DESC',
  };
  switch ((options.sort || '').toLowerCase()) {
    case 'newest':
      sortOptions = { column: '"Threads".created_at', direction: 'DESC' };
      break;
    case 'oldest':
      sortOptions = { column: '"Threads".created_at', direction: 'ASC' };
      break;
  }

  const { sql: paginationSort, bind: paginationBind } = buildPaginationSql({
    limit: parseInt(options.page_size, 10) || 10,
    page: parseInt(options.page, 10) || 1,
    orderBy: sortOptions.column,
    orderDirection: sortOptions.direction,
  });

  const bind: SearchDiscussionsBindOptions = {
    searchTerm: options.search,
    ...paginationBind,
  };
  if (chain) {
    bind.chain = chain.id;
  }

  const chainWhere = bind.chain ? '"Threads".chain = $chain AND' : '';

  const threads = await models.sequelize.query(
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
        ${chainWhere}
        "Threads".deleted_at IS NULL AND
        query @@ "Threads"._search
      ${paginationSort}
  `,
    {
      bind,
      type: QueryTypes.SELECT,
    }
  );

  return threads;
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
    if (!req.chain && options.chain !== ALL_CHAINS) {
      // if no chain resolved, ensure that client explicitly requested all chains
      throw new AppError(Errors.NoChains);
    }

    const threads = await search(models, req.chain, req.query);
    return res.json({
      status: 'Success',
      result: threads,
    });
  } catch (err) {
    console.error(err);
    return next(err);
  }
};

export default searchDiscussions;

/* eslint-disable quotes */
import { AppError } from 'common-common/src/errors';
import type { NextFunction, Request, Response } from 'express';
import { QueryTypes } from 'sequelize';
import type { DB } from '../models';
import { ChainInstance } from '../models/chain';
import { ALL_CHAINS } from '../middleware/databaseValidationService';
import { buildPaginationSql } from '../../server/util/queries';

const MIN_SEARCH_QUERY_LENGTH = 4;

const Errors = {
  UnexpectedError: 'Unexpected error',
  QueryMissing: 'Must enter query to begin searching',
  QueryTooShort: 'Query must be at least 4 characters',
  NoCommunity: 'Title search must be community scoped',
  NoChains: 'No chains resolved to execute search',
};

type SearchCommentsQuery = {
  search?: string;
  chain?: string;
  sort?: string;
  page?: string;
  page_size?: string;
};

type SearchCommentsBindOptions = {
  chain?: string;
  searchTerm?: string;
  limit?: number;
};

const search = async (
  models: DB,
  chain: ChainInstance | null,
  options: SearchCommentsQuery
) => {
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
      sortOptions = { column: '"Comments".created_at', direction: 'DESC' };
      break;
    case 'oldest':
      sortOptions = { column: '"Comments".created_at', direction: 'ASC' };
      break;
  }

  const { sql: paginationSort, bind: paginationBind } = buildPaginationSql({
    limit: parseInt(options.page_size, 10) || 10,
    page: parseInt(options.page, 10) || 1,
    orderBy: sortOptions.column,
    orderDirection: sortOptions.direction,
  });

  const bind: SearchCommentsBindOptions = {
    searchTerm: options.search,
    ...paginationBind,
  };
  if (chain) {
    bind.chain = chain.id;
  }

  const chainWhere = bind.chain ? '"Comments".chain = $chain AND' : '';

  // query for both threads and comments, and then execute a union and keep only the most recent :limit
  const comments = await models.sequelize.query(
    `
    SELECT
        "Comments".id,
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
      WHERE
        ${chainWhere}
        "Comments".deleted_at IS NULL AND
        query @@ "Comments"._search
      ${paginationSort}
    `,
    {
      bind,
      type: QueryTypes.SELECT,
    }
  );

  return comments;
};

const searchComments = async (
  models: DB,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const options = req.query as SearchCommentsQuery;
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

    const comments = await search(models, req.chain, req.query);
    return res.json({
      status: 'Success',
      result: comments,
    });
  } catch (err) {
    console.error(err);
    return next(err);
  }
};

export default searchComments;

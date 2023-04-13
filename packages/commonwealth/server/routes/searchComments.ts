/* eslint-disable quotes */
import { AppError } from 'common-common/src/errors';
import type { NextFunction, Request, Response } from 'express';
import { QueryTypes } from 'sequelize';
import type { DB } from '../models';
import { ChainInstance } from '../models/chain';
import { ALL_CHAINS } from '../middleware/databaseValidationService';

const MIN_SEARCH_QUERY_LENGTH = 4;

const Errors = {
  UnexpectedError: 'Unexpected error',
  QueryMissing: 'Must enter query to begin searching',
  QueryTooShort: 'Query must be at least 4 characters',
  NoCommunity: 'Title search must be community scoped',
  NoChains: 'No chains resolved to execute search'
};

type SearchCommentsQuery = {
  search?: string;
  chain?: string;
  sort?: string;
}

type SearchCommentsBindOptions = {
  chains?: string[];
  searchTerm?: string;
  limit?: number;
}

const search = async (models: DB, chains: ChainInstance[], options: SearchCommentsQuery) => {

  if (chains.length === 0) {
    throw new AppError(Errors.NoChains);
  }

  const allChainIds = chains.map((chain) => chain.id);

  const bind : SearchCommentsBindOptions = {
    chains: allChainIds,
    searchTerm: options.search,
    limit: 50 // must be same as SEARCH_PAGE_SIZE on frontend
  };

  const sortOption =
    options.sort === 'Newest' ? '"Comments".created_at DESC' :
    options.sort === 'Oldest' ? '"Comments".created_at ASC' :
    'rank DESC';
  const sort = `ORDER BY ${sortOption}`

  // query for both threads and comments, and then execute a union and keep only the most recent :limit
  const comments = await models.sequelize.query(
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
      WHERE
        "Comments".deleted_at IS NULL AND
        "Comments".chain = ANY($chains) AND
        query @@ "Comments"._search
      ${sort} LIMIT $limit
    `,
    {
      bind,
      type: QueryTypes.SELECT,
    }
  );

  return comments;

}

const searchComments = async (
  models: DB,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const options = req.query as SearchCommentsQuery
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

      const allChains = await models.Chain.findAll({})
      const allSearchResults = await search(models, allChains, req.query)

      return res.json({
        status: 'Success',
        result: allSearchResults
      });
    }

    const comments = await search(models, [req.chain], req.query);
    return res.json({
      status: 'Success',
      result: comments
    });
  } catch (err) {
    console.error(err);
    return next(err);
  }
};

export default searchComments;

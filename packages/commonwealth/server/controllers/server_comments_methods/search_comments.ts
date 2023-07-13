import { ChainInstance } from '../../models/chain';
import { ServerCommentsController } from '../server_comments_controller';
import { buildPaginationSql } from '../../util/queries';
import { QueryTypes } from 'sequelize';

export type SearchCommentsOptions = {
  chain: ChainInstance;
  search: string;
  sort?: string;
  page?: number;
  pageSize?: number;
};
export type SearchCommentsResult = {
  id: number;
  title: string;
  text: string;
  proposalid: number;
  type: 'comment';
  address_id: number;
  address: string;
  address_chain: string;
  created_at: string;
  chain: string;
  rank: number;
}[];

export async function __searchComments(
  this: ServerCommentsController,
  { chain, search, sort, page, pageSize }: SearchCommentsOptions
): Promise<SearchCommentsResult> {
  // sort by rank by default
  let sortOptions: {
    column: string;
    direction: 'ASC' | 'DESC';
  } = {
    column: 'rank',
    direction: 'DESC',
  };
  switch ((sort || '').toLowerCase()) {
    case 'newest':
      sortOptions = { column: '"Comments".created_at', direction: 'DESC' };
      break;
    case 'oldest':
      sortOptions = { column: '"Comments".created_at', direction: 'ASC' };
      break;
  }

  const { sql: paginationSort, bind: paginationBind } = buildPaginationSql({
    limit: pageSize || 10,
    page: page || 1,
    orderBy: sortOptions.column,
    orderDirection: sortOptions.direction,
  });

  const bind: {
    searchTerm?: string;
    chain?: string;
    limit?: number;
  } = {
    searchTerm: search,
    ...paginationBind,
  };
  if (chain) {
    bind.chain = chain.id;
  }

  const chainWhere = bind.chain ? '"Comments".chain = $chain AND' : '';

  const comments = await this.models.sequelize.query(
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

  return comments as SearchCommentsResult;
}

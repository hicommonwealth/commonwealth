import { Query } from '@hicommonwealth/core';
import { ALL_COMMUNITIES, UserTierMap } from '@hicommonwealth/shared';
import { QueryTypes } from 'sequelize';
import { z } from 'zod';
import { models } from '../../database';

export enum SearchEntityType {
  USER = 'user',
  COMMUNITY = 'community',
  TOPIC = 'topic',
  THREAD = 'thread',
  PROPOSAL = 'proposal',
}

export const SearchScope = z.enum([
  'All',
  'Members',
  'Communities',
  'Topics',
  'Threads',
  'Proposals',
]);

export type SearchScope = z.infer<typeof SearchScope>;

const VALID_SEARCH_SCOPES = [
  'All',
  'Members',
  'Communities',
  'Topics',
  'Threads',
  'Proposals',
] as const;

export const SearchEntitiesInput = z.object({
  searchTerm: z.string(),
  communityId: z.string().optional(),
  searchScope: z
    .string()
    .optional()
    .default('All')
    .refine(
      (value) => {
        const scopes = value.split(',').map((s) => s.trim());
        return scopes.every((scope) =>
          VALID_SEARCH_SCOPES.includes(scope as any),
        );
      },
      {
        message: `searchScope must contain only valid values: ${VALID_SEARCH_SCOPES.join(', ')}`,
      },
    ),
  limit: z.number().min(1).max(50).optional(),
  page: z.number().min(1).optional(),
  orderBy: z.enum(['relevance', 'created_at', 'name']).optional(),
  orderDirection: z.enum(['ASC', 'DESC']).optional(),
  includeCount: z.boolean().optional(),
});

export const SearchEntityResult = z.object({
  id: z.string(),
  type: z.nativeEnum(SearchEntityType),
  name: z.string(),
  description: z.string().optional(),
  avatar_url: z.string().optional().nullable(),
  community_id: z.string().optional(),
  community_name: z.string().optional().nullable(),
  author: z.string().optional().nullable(),
  created_at: z.date().optional().nullable(),
  member_count: z.number().optional().nullable(),
  status: z.string().optional().nullable(),
  relevance_score: z
    .union([z.number(), z.string()])
    .transform((val) => (typeof val === 'string' ? parseFloat(val) : val))
    .optional()
    .nullable(),
});

export const SearchEntitiesOutput = z.object({
  results: z.array(SearchEntityResult),
  totalResults: z.number(),
  limit: z.number(),
  page: z.number(),
});

export const SearchEntitiesSchema = {
  input: SearchEntitiesInput,
  output: SearchEntitiesOutput,
};

export function SearchEntities(): Query<typeof SearchEntitiesSchema> {
  return {
    ...SearchEntitiesSchema,
    auth: [],
    secure: true,
    body: async ({
      payload,
    }: {
      payload: z.infer<typeof SearchEntitiesInput>;
    }) => {
      const {
        searchTerm,
        communityId,
        searchScope = 'All',
        limit = 10,
        page = 1,
        orderBy = 'relevance',
        orderDirection = 'DESC',
        includeCount = true,
      } = payload;

      const searchScopeArray = searchScope
        .split(',')
        .map((s: string) => s.trim()) as SearchScope[];

      const entityTypesToSearch = getEntityTypesFromScope(searchScopeArray);

      const communityFilter =
        communityId && communityId !== ALL_COMMUNITIES
          ? 'AND community_id = $communityId'
          : '';

      const offset = (page - 1) * limit;
      const paginationSql = `LIMIT $limit OFFSET $offset`;

      const searchQueries: string[] = [];

      // Users search
      if (entityTypesToSearch.includes(SearchEntityType.USER)) {
        searchQueries.push(`
          SELECT 
            U.id::text as id,
            '${SearchEntityType.USER}' as type,
            U.profile->>'name' as name,
            COALESCE(U.profile->>'bio', '') as description,
            U.profile->>'avatar_url' as avatar_url,
            A.community_id,
            C.name as community_name,
            NULL as author,
            U.created_at,
            NULL::integer as member_count,
            NULL as status,
            1.0 as relevance_score
          FROM "Users" U
          JOIN "Addresses" A ON U.id = A.user_id
          JOIN "Communities" C ON A.community_id = C.id
          WHERE U.tier > ${UserTierMap.BannedUser}
            AND U.profile->>'name' ILIKE '%' || $searchTerm || '%'
            ${communityFilter.replace('community_id', 'A.community_id')}
        `);
      }

      // Communities search
      if (entityTypesToSearch.includes(SearchEntityType.COMMUNITY)) {
        searchQueries.push(`
          SELECT 
            C.id::text as id,
            '${SearchEntityType.COMMUNITY}' as type,
            C.name,
            COALESCE(C.description, '') as description,
            C.icon_url as avatar_url,
            C.id as community_id,
            C.name as community_name,
            NULL as author,
            C.created_at,
            (SELECT COUNT(*) FROM "Addresses" WHERE community_id = C.id)::integer as member_count,
            CASE WHEN C.active THEN 'Active' ELSE 'Inactive' END as status,
            1.0 as relevance_score
          FROM "Communities" C
          WHERE C.active = TRUE
            AND (C.name ILIKE '%' || $searchTerm || '%' OR C.default_symbol ILIKE '%' || $searchTerm || '%')
        `);
      }

      // Topics search
      if (entityTypesToSearch.includes(SearchEntityType.TOPIC)) {
        searchQueries.push(`
          SELECT 
            T.id::text as id,
            '${SearchEntityType.TOPIC}' as type,
            T.name,
            COALESCE(T.description, '') as description,
            NULL as avatar_url,
            T.community_id,
            C.name as community_name,
            NULL as author,
            T.created_at,
            (SELECT COUNT(*) FROM "Threads" WHERE topic_id = T.id AND deleted_at IS NULL)::integer as member_count,
            CASE WHEN T.archived_at IS NULL THEN 'Active' ELSE 'Archived' END as status,
            1.0 as relevance_score
          FROM "Topics" T
          JOIN "Communities" C ON T.community_id = C.id
          WHERE T.name ILIKE '%' || $searchTerm || '%'
            ${communityFilter.replace('community_id', 'T.community_id')}
        `);
      }

      // Threads search
      if (entityTypesToSearch.includes(SearchEntityType.THREAD)) {
        searchQueries.push(`
          SELECT 
            T.id::text as id,
            '${SearchEntityType.THREAD}' as type,
            T.title as name,
            COALESCE(LEFT(T.body, 200), '') as description,
            NULL as avatar_url,
            T.community_id,
            C.name as community_name,
            U.profile->>'name' as author,
            T.created_at,
            (SELECT COUNT(*) FROM "Comments" WHERE thread_id = T.id AND deleted_at IS NULL)::integer as member_count,
            'Active' as status,
            ts_rank_cd(T.search, websearch_to_tsquery('english', $searchTerm)) as relevance_score
          FROM "Threads" T
          JOIN "Addresses" A ON T.address_id = A.id
          JOIN "Users" U ON A.user_id = U.id
          JOIN "Communities" C ON T.community_id = C.id
          WHERE T.deleted_at IS NULL 
            AND T.marked_as_spam_at IS NULL
            AND (T.title ILIKE '%' || $searchTerm || '%' OR websearch_to_tsquery('english', $searchTerm) @@ T.search)
            ${communityFilter.replace('community_id', 'T.community_id')}
        `);
      }

      if (searchQueries.length === 0) {
        return {
          results: [],
          totalResults: 0,
          limit,
          page,
        };
      }

      // Combine all search queries
      const unionQuery = searchQueries.join(' UNION ALL ');

      // Apply ordering and pagination
      let orderBySql = '';
      switch (orderBy) {
        case 'created_at':
          orderBySql = `ORDER BY created_at ${orderDirection}`;
          break;
        case 'name':
          orderBySql = `ORDER BY name ${orderDirection}`;
          break;
        case 'relevance':
        default:
          orderBySql = `ORDER BY relevance_score ${orderDirection}, created_at DESC`;
          break;
      }

      const fullQuery = `
        WITH search_results AS (
          ${unionQuery}
        )
        SELECT * FROM search_results
        ${orderBySql}
        ${paginationSql}
      `;

      const countQuery = `
        WITH search_results AS (
          ${unionQuery}
        )
        SELECT COUNT(*) as total FROM search_results
      `;

      const bind = {
        searchTerm,
        communityId,
        limit,
        offset,
      };

      // Execute queries
      const [results, countResult] = await Promise.all([
        models.sequelize.query<z.infer<typeof SearchEntityResult>>(fullQuery, {
          bind,
          type: QueryTypes.SELECT,
        }),
        includeCount
          ? models.sequelize.query<{ total: string }>(countQuery, {
              bind,
              type: QueryTypes.SELECT,
            })
          : Promise.resolve([{ total: '0' }]),
      ]);

      const totalResults = includeCount
        ? parseInt(countResult[0]?.total || '0', 10)
        : results.length;

      return {
        results,
        totalResults,
        limit,
        page,
      };
    },
  };
}

function getEntityTypesFromScope(
  searchScope: SearchScope[],
): SearchEntityType[] {
  const entityTypes: SearchEntityType[] = [];

  for (const scope of searchScope) {
    switch (scope) {
      case 'All':
        return [
          SearchEntityType.USER,
          SearchEntityType.COMMUNITY,
          SearchEntityType.TOPIC,
          SearchEntityType.THREAD,
          SearchEntityType.PROPOSAL,
        ];
      case 'Members':
        entityTypes.push(SearchEntityType.USER);
        break;
      case 'Communities':
        entityTypes.push(SearchEntityType.COMMUNITY);
        break;
      case 'Topics':
        entityTypes.push(SearchEntityType.TOPIC);
        break;
      case 'Threads':
        entityTypes.push(SearchEntityType.THREAD);
        break;
      case 'Proposals':
        entityTypes.push(SearchEntityType.PROPOSAL);
        break;
    }
  }

  return [...new Set(entityTypes)]; // Remove duplicates
}

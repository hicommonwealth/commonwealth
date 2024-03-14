import z from 'zod';
import { Comment } from '../entities.schemas';
import { PaginatedResultSchema } from './pagination';

export const SearchComments = {
  input: z.object({
    community_id: z.string(),
    search: z.string(),
    limit: z.number().int().optional().default(20),
    page: z.number().int().optional().default(1),
    orderBy: z.string().optional().default('created_at'),
    orderDirection: z.enum(['ASC', 'DESC']).default('DESC'),
  }),
  output: PaginatedResultSchema(Comment),
};

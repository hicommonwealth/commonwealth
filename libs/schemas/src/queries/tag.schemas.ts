import { z } from 'zod';
import { AuthContext } from '../context';
import { Tags } from '../entities/tag.schemas';

export const TagView = Tags.extend({
  created_at: z.date().or(z.string()).optional(),
  updated_at: z.date().or(z.string()).optional(),
  community_count: z.number().optional(),
});

export const GetTags = {
  input: z.object({
    with_community_count: z.boolean().optional(),
  }),
  output: z.array(TagView),
  context: AuthContext,
};

export const CommunityTagView = z.object({
  id: z.string(),
  name: z.string(),
});

export const GetTagUsage = {
  input: z.object({
    id: z.number(),
  }),
  output: z.object({
    communities: z.array(CommunityTagView),
  }),
  context: AuthContext,
};

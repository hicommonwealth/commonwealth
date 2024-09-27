import { z } from 'zod';
import { ApiKey, User } from '../entities';

export const UpdateUser = {
  input: User.omit({ is_welcome_onboard_flow_complete: true }).extend({
    id: z.number(),
    promotional_emails_enabled: z.boolean().nullish(),
    tag_ids: z.number().array().nullish(),
  }),
  output: User,
};

export const GetNewContent = {
  input: z.object({}),
  output: z.object({
    joinedCommunityIdsWithNewContent: z.array(z.string()),
  }),
};

export const CreateApiKey = {
  input: z.object({}),
  output: z.object({
    api_key: z.string(),
  }),
};

export const GetApiKey = {
  input: z.object({}),
  output: ApiKey.pick({ hashed_api_key: true, created_at: true }),
};

export const DeleteApiKey = {
  input: z.object({}),
  output: z.object({}),
};

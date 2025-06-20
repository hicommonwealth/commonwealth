import {
  BalanceType,
  CommunityGoalTypes,
  CommunityTierMap,
  UserTierMap,
} from '@hicommonwealth/shared';
import { z } from 'zod';
import { Community, CommunityGoalMeta } from '../entities';

export const CreateChainNode = {
  input: z.object({
    url: z.string().url(),
    name: z.string(),
    balance_type: z.literal(BalanceType.Ethereum),
    eth_chain_id: z.number(),
  }),
  output: z.object({
    node_id: z.number(),
  }),
};

export const UpdateCommunityId = {
  input: z.object({
    community_id: z.string(),
    new_community_id: z.string(),
    redirect: z.boolean().optional(),
  }),
  output: Community,
};

export const TriggerNotificationsWorkflow = {
  input: z.object({
    workflow_key: z.string(),
    data: z.record(z.string(), z.any()),
  }),
  output: z.object({
    numFailed: z
      .number()
      .describe('The number of users for which triggering the workflow failed'),
    numSucceeded: z
      .number()
      .describe(
        'The number of users for which triggering the workflow succeeded',
      ),
  }),
};

export const SetCommunityTier = {
  input: z.object({
    community_id: z.string(),
    tier: z.nativeEnum(CommunityTierMap),
  }),
  output: z.object({
    success: z.boolean(),
  }),
};

export const SetUserTier = {
  input: z.object({
    user_id: z.number(),
    tier: z.nativeEnum(UserTierMap),
  }),
  output: z.object({
    success: z.boolean(),
  }),
};

export const RerankThreads = {
  input: z.object({
    community_id: z.string().optional(),
  }),
  output: z.object({
    numThreadsReranked: z.number(),
  }),
};

export const EnableDigestEmail = {
  input: z.object({
    communityId: z.string(),
  }),
  output: z.object({
    success: z.boolean(),
  }),
};

export const UpdateResourceTimestamps = {
  input: z
    .object({
      resource_id: z.string().or(z.number()),
      resource_name: z.enum(['Quests']), // add more resource/table names when needed
      date_field_name: z.enum([
        'start_date',
        'end_date',
        'created_at',
        'updated_at',
        'deleted_at',
      ]), // add more date fields as required
      date_field_value: z.string(),
    })
    .refine(
      (data) => {
        if (
          data.resource_name === 'Quests' &&
          typeof data.resource_id !== 'number'
        ) {
          return false;
        }
        return true;
      },
      {
        path: ['resource_id'],
        message: `For resource_name=Quests, resource_id must be a number`,
      },
    )
    .refine(
      (data) => {
        if (
          data.resource_name === 'Quests' &&
          !['start_date', 'end_date', 'created_at', 'updated_at'].includes(
            data.date_field_name,
          )
        ) {
          return false;
        }
        return true;
      },
      {
        path: ['date_field_name'],
        message: `For resource_name=Quests, date_field_name must be either 'start_date' or 'end_date'`,
      },
    ),
  output: z.object({
    success: z.boolean(),
  }),
};

export type Type1 = z.infer<typeof TriggerNotificationsWorkflow.input>;

export const UpdateSiteAdmin = {
  input: z.object({
    address: z.string(),
    is_admin: z.boolean(),
  }),
  output: z.boolean(),
};

export const CreateCommunityGoalMeta = {
  input: z.object({
    name: z.string(),
    description: z.string(),
    type: z.enum(CommunityGoalTypes),
    target: z.number(),
  }),
  output: CommunityGoalMeta,
};

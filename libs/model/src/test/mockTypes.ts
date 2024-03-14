import { NotificationCategories, schemas } from '@hicommonwealth/core';
import { models } from '../database';
import { SchemaWithModel } from './seed';

export const UserSchema: SchemaWithModel<typeof schemas.entities.User> = {
  schema: schemas.entities.User,
  model: models.User,
  mockDefaults: () => ({
    isAdmin: false,
    emailVerified: true,
    selected_community_id: 'etheruem',
  }),
};

export const ChainNodeSchema: SchemaWithModel<
  typeof schemas.entities.ChainNode
> = {
  schema: schemas.entities.ChainNode,
  model: models.ChainNode,
};

export const ContractSchema: SchemaWithModel<typeof schemas.entities.Contract> =
  {
    schema: schemas.entities.Contract,
    model: models.Contract,
    mockDefaults: () => ({
      chain_node_id: 1,
      abi_id: null,
    }),
  };

export const CommunityContractSchema: SchemaWithModel<
  typeof schemas.entities.CommunityContract
> = {
  schema: schemas.entities.CommunityContract,
  model: models.CommunityContract,
  mockDefaults: () => ({
    community_id: 'ethereum',
    contract_id: 1,
  }),
};

export const CommunitySchema: SchemaWithModel<
  typeof schemas.entities.Community
> = {
  schema: schemas.entities.Community,
  model: models.Community,
  allowedGeneratedProps: ['id'],
  mockDefaults: () => ({
    chain_node_id: 1,
  }),
};

export const TopicSchema: SchemaWithModel<typeof schemas.entities.Topic> = {
  schema: schemas.entities.Topic,
  model: models.Topic,
  mockDefaults: () => ({
    community_id: 'ethereum',
    order: 1,
    group_ids: [],
  }),
};

export const CommunityStakeSchema: SchemaWithModel<
  typeof schemas.entities.CommunityStake
> = {
  schema: schemas.entities.CommunityStake,
  model: models.CommunityStake,
  mockDefaults: () => ({
    community_id: 'ethereum',
    stake_enabled: true,
  }),
  buildQuery: (data) => ({
    where: {
      community_id: data.community_id,
      stake_id: data.stake_id,
    },
  }),
};

export const ProfileSchema: SchemaWithModel<typeof schemas.entities.Profile> = {
  schema: schemas.entities.Profile,
  model: models.Profile,
  mockDefaults: () => ({
    user_id: 1,
  }),
};

export const AddressSchema: SchemaWithModel<typeof schemas.entities.Address> = {
  schema: schemas.entities.Address,
  model: models.Address,
  mockDefaults: () => ({
    community_id: 'ethereum',
    user_id: 1,
    profile_id: 1,
  }),
};

export const NotificationCategorySchema: SchemaWithModel<
  typeof schemas.entities.NotificationCategory
> = {
  schema: schemas.entities.NotificationCategory,
  model: models.NotificationCategory,
  mockDefaults: () => ({}),
  buildQuery: (data) => ({
    where: {
      name: data.name,
    },
  }),
};

export const SubscriptionSchema: SchemaWithModel<
  typeof schemas.entities.Subscription
> = {
  schema: schemas.entities.Subscription,
  model: models.Subscription,
  mockDefaults: () => ({
    subscriber_id: 1,
    category_id: NotificationCategories.NewThread,
    community_id: 'ethereum',
    thread_id: null,
    comment_id: null,
  }),
};

export const SnapshotSpaceSchema: SchemaWithModel<
  typeof schemas.entities.SnapshotSpace
> = {
  schema: schemas.entities.SnapshotSpace,
  model: models.SnapshotSpace,
  mockDefaults: () => ({}),
  buildQuery: (data) => ({
    where: {
      snapshot_space: data.snapshot_space,
    },
  }),
};

export const SnapshotProposalSchema: SchemaWithModel<
  typeof schemas.entities.SnapshotProposal
> = {
  schema: schemas.entities.SnapshotProposal,
  model: models.SnapshotProposal,
  mockDefaults: () => ({}),
  allowedGeneratedProps: ['id'],
};

export const GroupSchema: SchemaWithModel<typeof schemas.entities.Group> = {
  schema: schemas.entities.Group,
  model: models.Group,
  mockDefaults: () => ({
    community_id: 'ethereum',
  }),
};

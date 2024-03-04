import {
  NotificationCategories,
  address,
  chainNode,
  community,
  group,
  notification,
  snapshot,
  subscription,
  user,
} from '@hicommonwealth/core';
import { models } from '../database';
import { SchemaWithModel } from './seed';

export const UserSchema: SchemaWithModel<typeof user.User> = {
  schema: user.User,
  model: models.User,
  mockDefaults: () => ({
    isAdmin: false,
    emailVerified: true,
    selected_community_id: 'etheruem',
  }),
};

export const ChainNodeSchema: SchemaWithModel<typeof chainNode.ChainNode> = {
  schema: chainNode.ChainNode,
  model: models.ChainNode,
};

export const ContractSchema: SchemaWithModel<typeof community.Contract> = {
  schema: community.Contract,
  model: models.Contract,
  mockDefaults: () => ({
    chain_node_id: 1,
    abi_id: null,
  }),
};

export const CommunityContractSchema: SchemaWithModel<
  typeof community.CommunityContract
> = {
  schema: community.CommunityContract,
  model: models.CommunityContract,
  mockDefaults: () => ({
    community_id: 'ethereum',
    contract_id: 1,
  }),
};

export const CommunitySchema: SchemaWithModel<typeof community.Community> = {
  schema: community.Community,
  model: models.Community,
  allowedGeneratedProps: ['id'],
  mockDefaults: () => ({
    chain_node_id: 1,
  }),
};

export const TopicSchema: SchemaWithModel<typeof community.Topic> = {
  schema: community.Topic,
  model: models.Topic,
  mockDefaults: () => ({
    community_id: 'ethereum',
    order: 1,
    group_ids: [],
  }),
};

export const CommunityStakeSchema: SchemaWithModel<
  typeof community.CommunityStake
> = {
  schema: community.CommunityStake,
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

export const ProfileSchema: SchemaWithModel<typeof user.Profile> = {
  schema: user.Profile,
  model: models.Profile,
  mockDefaults: () => ({
    user_id: 1,
  }),
};

export const AddressSchema: SchemaWithModel<typeof address.Address> = {
  schema: address.Address,
  model: models.Address,
  mockDefaults: () => ({
    community_id: 'ethereum',
    user_id: 1,
    profile_id: 1,
  }),
};

export const NotificationCategorySchema: SchemaWithModel<
  typeof notification.NotificationCategory
> = {
  schema: notification.NotificationCategory,
  model: models.NotificationCategory,
  mockDefaults: () => ({}),
  buildQuery: (data) => ({
    where: {
      name: data.name,
    },
  }),
};

export const SubscriptionSchema: SchemaWithModel<
  typeof subscription.Subscription
> = {
  schema: subscription.Subscription,
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
  typeof snapshot.SnapshotSpace
> = {
  schema: snapshot.SnapshotSpace,
  model: models.SnapshotSpace,
  mockDefaults: () => ({}),
  buildQuery: (data) => ({
    where: {
      snapshot_space: data.snapshot_space,
    },
  }),
};

export const SnapshotProposalSchema: SchemaWithModel<
  typeof snapshot.SnapshotProposal
> = {
  schema: snapshot.SnapshotProposal,
  model: models.SnapshotProposal,
  mockDefaults: () => ({}),
  allowedGeneratedProps: ['id'],
};

export const GroupSchema: SchemaWithModel<typeof group.Group> = {
  schema: group.Group,
  model: models.Group,
  mockDefaults: () => ({
    community_id: 'ethereum',
  }),
};

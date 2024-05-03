import { DB } from '.';

/**
 * Associates models with type safety
 */
export const buildAssociations = (db: DB) => {
  db.User.withMany(db.Address, 'user_id')
    .withMany(db.ThreadSubscription, 'user_id', {
      asMany: 'ThreadSubscriptions',
      onDelete: 'CASCADE',
    })
    .withMany(db.CommunityAlert, 'user_id', {
      asMany: 'CommunityAlerts',
      onDelete: 'CASCADE',
    })
    .withMany(db.CommentSubscription, 'user_id', {
      asMany: 'CommentSubscriptions',
      onDelete: 'CASCADE',
    })
    .withOne(db.SubscriptionPreference, ['id', 'user_id'], {
      as: 'SubscriptionPreferences',
      onDelete: 'CASCADE',
    });

  db.Address.withMany(db.Membership, 'address_id', {
    asOne: 'address',
    asMany: 'Memberships',
  });

  db.ChainNode.withMany(db.Community, 'chain_node_id')
    .withMany(db.Contract, 'chain_node_id', { asMany: 'contracts' })
    .withOne(db.LastProcessedEvmBlock, ['id', 'chain_node_id']);

  db.ContractAbi.withMany(db.Contract, 'abi_id').withMany(
    db.EvmEventSource,
    'abi_id',
  );

  db.Community.withMany(db.Group, 'community_id', { asMany: 'groups' })
    .withMany(db.Topic, 'community_id', {
      asOne: 'community',
      asMany: 'topics',
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    })
    .withMany(db.Address, 'community_id')
    .withMany(db.Thread, 'community_id', {
      asOne: 'Community',
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    })
    .withMany(db.Comment, 'community_id')
    .withMany(db.CommunityStake, 'community_id')
    .withMany(db.ContestManager, 'community_id', {
      asMany: 'contest_managers',
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    })
    .withMany(db.CommunityAlert, 'community_id', {
      onDelete: 'CASCADE',
    })
    .withMany(db.Notification, 'community_id')
    .withMany(db.Webhook, 'community_id')
    .withOne(db.DiscordBotConfig, ['discord_config_id', 'community_id'], {
      onDelete: 'CASCADE',
    });

  db.Group.withMany(db.Membership, 'group_id', {
    asOne: 'group',
    asMany: 'memberships',
  });

  db.Topic.withMany(db.Thread, 'topic_id', {
    asMany: 'threads',
    onUpdate: 'CASCADE',
    onDelete: 'SET NULL',
  }).withMany(db.ContestTopic, 'topic_id');

  db.Thread.withMany(db.Poll, 'thread_id', {})
    .withMany(db.ContestAction, 'thread_id', {
      optional: true,
    })
    .withMany(db.ThreadSubscription, 'thread_id', {
      onDelete: 'CASCADE',
    })
    .withMany(db.Reaction, 'thread_id', {
      asMany: 'reactions',
    });

  db.Comment.withMany(db.Reaction, 'comment_id', {
    asMany: 'reactions',
  }).withMany(db.CommentSubscription, 'comment_id', { onDelete: 'CASCADE' });

  db.ContestManager.withMany(db.Contest, 'contest_address', {
    asMany: 'contests',
  }).withMany(db.ContestTopic, 'contest_address', { asMany: 'topics' });

  db.Contest.withMany(db.ContestAction, ['contest_address', 'contest_id'], {
    asMany: 'actions',
  });

  db.CommunityStake.withMany(
    db.StakeTransaction,
    ['community_id', 'stake_id'],
    {
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
  );

  db.Poll.withMany(db.Vote, 'poll_id', {
    asOne: 'poll',
    asMany: 'votes',
    onDelete: 'CASCADE',
  });

  db.NotificationCategory.withMany(db.Subscription, 'category_id').withMany(
    db.Notification,
    'category_id',
  );

  // Many-to-many associations (cross-references)
  db.Collaboration.withManyToMany(
    [db.Address, 'address_id', 'collaborators', {}],
    [db.Thread, 'thread_id', 'collaborations', {}],
  );
  db.CommunityContract.withManyToMany(
    [db.Community, 'community_id', 'communities', {}],
    [db.Contract, 'contract_id', 'contracts', {}],
  );
  db.StarredCommunity.withManyToMany(
    [db.Community, 'community_id', 'communities', { onUpdate: 'CASCADE' }],
    [db.User, 'user_id', 'users', { onUpdate: 'CASCADE' }],
  );

  // Reconciling constraint rules in "loose" FKs
  db.User.belongsTo(db.Community, {
    as: 'selectedCommunity',
    foreignKey: 'selected_community_id',
    onUpdate: 'NO ACTION',
    onDelete: 'NO ACTION',
  });
  db.Template.belongsTo(db.ContractAbi, {
    foreignKey: 'abi_id',
  });
  db.Template.belongsTo(db.Community, {
    foreignKey: 'created_for_community',
    onUpdate: 'NO ACTION',
    onDelete: 'NO ACTION',
  });
  db.Subscription.belongsTo(db.User, {
    foreignKey: 'subscriber_id',
    onUpdate: 'NO ACTION',
    onDelete: 'NO ACTION',
  });
  db.SsoToken.belongsTo(db.Profile, {
    foreignKey: 'profile_id',
    onUpdate: 'NO ACTION',
    onDelete: 'NO ACTION',
  });
  db.Poll.belongsTo(db.Community, {
    foreignKey: 'community_id',
    targetKey: 'id',
    onUpdate: 'NO ACTION',
    onDelete: 'NO ACTION',
  });
  db.NotificationsRead.belongsTo(db.User, {
    foreignKey: 'user_id',
    onUpdate: 'NO ACTION',
    onDelete: 'NO ACTION',
  });
  db.EvmEventSource.belongsTo(db.ChainNode, {
    foreignKey: 'chain_node_id',
    onUpdate: 'NO ACTION',
    onDelete: 'NO ACTION',
  });
  db.CommunityBanner.belongsTo(db.Community, {
    foreignKey: 'community_id',
    onUpdate: 'NO ACTION',
    onDelete: 'NO ACTION',
  });
  db.Ban.belongsTo(db.Community, {
    foreignKey: 'community_id',
    onUpdate: 'NO ACTION',
    onDelete: 'NO ACTION',
  });
  db.Contract.belongsTo(db.ChainNode, {
    foreignKey: 'chain_node_id',
  });
};

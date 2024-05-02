import { DB } from '.';

/**
 * Associates models with type safety
 */
export const buildAssociations = (db: DB) => {
  db.User.withMany(db.Address, 'user_id')
    .withMany(db.Profile, 'user_id', { onUpdate: 'CASCADE' })
    .withMany(db.CommunityAlert, 'user_id', {
      asMany: 'CommunityAlerts',
      onDelete: 'CASCADE',
    })
    .withMany(db.Subscription, 'subscriber_id')
    .withMany(db.NotificationsRead, 'user_id')
    .withOne(db.Community, ['selected_community_id', 'id'], {
      as: 'selectedCommunity',
    })
    .withOne(db.SubscriptionPreference, ['id', 'user_id'], {
      as: 'SubscriptionPreferences',
      onDelete: 'CASCADE',
    });

  db.Profile.withMany(db.Address, 'profile_id').withMany(
    db.SsoToken,
    'profile_id',
  );

  db.Address.withMany(db.Thread, 'address_id', {
    asOne: 'Address',
    onUpdate: 'CASCADE',
    onDelete: 'SET NULL',
  })
    .withMany(db.Comment, 'address_id', {
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    })
    .withMany(db.Reaction, 'address_id')
    .withOne(db.SsoToken, ['id', 'address_id'], {
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    });

  db.ChainNode.withMany(db.Community, 'chain_node_id')
    .withMany(db.Contract, 'chain_node_id', { asMany: 'contracts' })
    .withMany(db.EvmEventSource, 'chain_node_id')
    .withOne(db.LastProcessedEvmBlock, ['id', 'chain_node_id']);

  db.ContractAbi.withMany(db.Contract, 'abi_id')
    .withMany(db.EvmEventSource, 'abi_id')
    .withMany(db.Template, 'abi_id', { onUpdate: 'CASCADE' });

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
    .withMany(db.Poll, 'community_id')
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
    .withMany(db.Ban, 'community_id')
    .withMany(db.CommunityBanner, 'community_id')
    .withMany(db.Template, 'created_for_community')
    .withOne(db.DiscordBotConfig, ['discord_config_id', 'community_id'], {
      onDelete: 'CASCADE',
    });

  db.Topic.withMany(db.Thread, 'topic_id', {
    asOne: 'topic',
    asMany: 'threads',
    onUpdate: 'CASCADE',
    onDelete: 'SET NULL',
  }).withMany(db.ContestTopic, 'topic_id');

  db.Thread.withMany(db.Poll, 'thread_id', {})
    .withMany(db.ContestAction, 'thread_id', {
      optional: true,
    })
    .withMany(db.Reaction, 'thread_id', {
      asMany: 'reactions',
    })
    .withMany(db.Comment, 'thread_id')
    .withMany(db.Notification, 'thread_id');

  db.Comment.withMany(db.Reaction, 'comment_id', {
    asMany: 'reactions',
  });

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

  db.SnapshotSpace.withMany(db.SnapshotProposal, 'space', {
    onUpdate: 'CASCADE',
  });

  db.NotificationCategory.withMany(db.Subscription, 'category_id').withMany(
    db.Notification,
    'category_id',
  );

  // Many-to-many associations (cross-references)
  db.Membership.withManyToMany(
    {
      model: db.Group,
      key: 'group_id',
      as: 'memberships',
      asOne: 'group',
    },
    {
      model: db.Address,
      key: 'address_id',
      as: 'Memberships',
      asOne: 'address',
    },
  );
  db.Collaboration.withManyToMany(
    { model: db.Address, key: 'address_id' },
    { model: db.Thread, key: 'thread_id', asMany: 'collaborators' },
  );
  db.CommunityContract.withManyToMany(
    { model: db.Community, key: 'community_id' },
    { model: db.Contract, key: 'contract_id' },
  );
  db.StarredCommunity.withManyToMany(
    { model: db.Community, key: 'community_id', onUpdate: 'CASCADE' },
    { model: db.User, key: 'user_id', onUpdate: 'CASCADE' },
  );
  db.ThreadSubscription.withManyToMany(
    {
      model: db.Thread,
      key: 'thread_id',
      as: 'subscriptions',
      onDelete: 'CASCADE',
    },
    {
      model: db.User,
      key: 'user_id',
      as: 'threadSubscriptions',
      onDelete: 'CASCADE',
    },
  );
  db.CommentSubscription.withManyToMany(
    {
      model: db.Comment,
      key: 'comment_id',
      as: 'subscriptions',
      onDelete: 'CASCADE',
    },
    {
      model: db.User,
      key: 'user_id',
      as: 'commentSubscriptions',
      onDelete: 'CASCADE',
    },
  );
  db.NotificationsRead.withManyToMany(
    { model: db.Subscription, key: 'subscription_id', onDelete: 'CASCADE' },
    {
      model: db.Notification,
      key: 'notification_id',
      onDelete: 'CASCADE',
      hooks: true,
    },
  );
  db.CommunitySnapshotSpaces.withManyToMany(
    {
      model: db.Community,
      key: 'community_id',
      as: 'spaces',
      onUpdate: 'CASCADE',
    },
    {
      model: db.SnapshotSpace,
      key: 'snapshot_space_id',
      as: 'spaces',
      asOne: 'snapshot_space',
      onUpdate: 'CASCADE',
    },
  );

  // 3-way x-ref table
  db.CommunityContractTemplate.belongsTo(db.CommunityContract, {
    foreignKey: 'community_contract_id',
  });
  db.CommunityContractTemplate.belongsTo(db.Template, {
    foreignKey: 'template_id',
  });
  db.CommunityContractTemplate.belongsTo(db.CommunityContractTemplateMetadata, {
    foreignKey: 'cctmd_id',
  });

  // "loose" FKs
  db.Comment.belongsTo(db.Community, {
    foreignKey: 'community_id',
  });
  db.Reaction.belongsTo(db.Community, {
    foreignKey: 'community_id',
  });
  db.Subscription.belongsTo(db.Community, {
    as: 'Community',
    foreignKey: 'community_id',
  });
  db.Subscription.belongsTo(db.Thread, {
    foreignKey: 'thread_id',
  });
  db.Subscription.belongsTo(db.Comment, {
    foreignKey: 'comment_id',
  });

  // TODO: find a better place for these
  db.User.createWithProfile = async (attrs, options) => {
    const newUser = await db.User.create(attrs, options);
    const profile = await db.Profile.create(
      {
        user_id: newUser.id!,
      },
      options,
    );
    newUser.Profiles = [profile];
    return newUser;
  };
};

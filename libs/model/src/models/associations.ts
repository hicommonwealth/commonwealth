import type { DB } from './factories';

/**
 * Associates models with type safety
 */
export const buildAssociations = (db: DB) => {
  db.User.withMany(db.Address)
    .withMany(db.Profile, { onUpdate: 'CASCADE' })
    .withMany(db.Subscription, { foreignKey: 'subscriber_id' })
    .withMany(db.NotificationsRead)
    .withMany(db.SubscriptionPreference, {
      asMany: 'SubscriptionPreferences',
      onDelete: 'CASCADE',
    });

  db.Profile.withMany(db.Address)
    .withMany(db.SsoToken)
    .withMany(db.ProfileTags, { onDelete: 'CASCADE' });

  db.Address.withMany(db.Thread, {
    asOne: 'Address',
    onUpdate: 'CASCADE',
    onDelete: 'SET NULL',
  })
    .withMany(db.Comment, {
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    })
    .withMany(db.Reaction)
    .withMany(db.SsoToken, {
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    });

  db.ChainNode.withMany(db.Community)
    .withMany(db.Contract, { asMany: 'contracts' })
    .withMany(db.EvmEventSource)
    .withOne(db.LastProcessedEvmBlock);

  db.ContractAbi.withMany(db.Contract, { foreignKey: 'abi_id' })
    .withMany(db.EvmEventSource, { foreignKey: 'abi_id' })
    .withMany(db.Template, { foreignKey: 'abi_id', onUpdate: 'CASCADE' });

  db.Community.withMany(db.Group, { asMany: 'groups' })
    .withMany(db.Topic, {
      asOne: 'community',
      asMany: 'topics',
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    })
    .withMany(db.Address)
    .withMany(db.Thread, {
      asOne: 'Community',
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    })
    .withMany(db.Poll)
    .withMany(db.CommunityStake)
    .withMany(db.ContestManager, {
      asMany: 'contest_managers',
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    })
    .withMany(db.Notification)
    .withMany(db.Webhook)
    .withMany(db.Ban)
    .withMany(db.CommunityBanner)
    .withMany(db.Template, { foreignKey: 'created_for_community' })
    .withMany(db.CommunityTags, {
      onDelete: 'CASCADE',
    })
    .withOne(db.DiscordBotConfig, {
      targeyKey: 'discord_config_id',
      onDelete: 'CASCADE',
    })
    .withOne(db.User, {
      foreignKey: 'selected_community_id',
      as: 'selectedCommunity',
    });

  db.Tags.withMany(db.ProfileTags, {
    foreignKey: 'tag_id',
    onDelete: 'CASCADE',
  }).withMany(db.CommunityTags, {
    foreignKey: 'tag_id',
    onDelete: 'CASCADE',
  });

  db.Topic.withMany(db.Thread, {
    asOne: 'topic',
    asMany: 'threads',
    onUpdate: 'CASCADE',
    onDelete: 'SET NULL',
  }).withMany(db.ContestTopic);

  db.Thread.withMany(db.Poll)
    .withMany(db.ContestAction, {
      optional: true,
    })
    .withMany(db.Reaction, {
      asMany: 'reactions',
    })
    .withMany(db.Comment)
    .withMany(db.Notification);

  db.Comment.withMany(db.Reaction, {
    asMany: 'reactions',
  });

  db.ContestManager.withMany(db.Contest, {
    foreignKey: 'contest_address',
    asMany: 'contests',
  }).withMany(db.ContestTopic, {
    foreignKey: 'contest_address',
    asMany: 'topics',
  });

  db.Contest.withMany(db.ContestAction, {
    foreignKey: ['contest_address', 'contest_id'],
    asMany: 'actions',
  });

  db.CommunityStake.withMany(db.StakeTransaction, {
    foreignKey: ['community_id', 'stake_id'],
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
  });

  db.Poll.withMany(db.Vote, {
    asOne: 'poll',
    asMany: 'votes',
    onDelete: 'CASCADE',
  });

  db.NotificationCategory.withMany(db.Subscription, {
    foreignKey: 'category_id',
  }).withMany(db.Notification, { foreignKey: 'category_id' });

  // Many-to-many associations (cross-references)
  db.Membership.withManyToMany(
    {
      model: db.Group,
      as: 'memberships',
      asOne: 'group',
    },
    {
      model: db.Address,
      as: 'Memberships',
      asOne: 'address',
    },
  );
  db.Collaboration.withManyToMany(
    { model: db.Address },
    { model: db.Thread, asMany: 'collaborators' },
  );
  db.CommunityContract.withManyToMany(
    { model: db.Community },
    { model: db.Contract },
  );
  db.StarredCommunity.withManyToMany(
    { model: db.Community, onUpdate: 'CASCADE' },
    { model: db.User, onUpdate: 'CASCADE' },
  );
  db.CommunityAlert.withManyToMany(
    {
      model: db.User,
      as: 'communityAlerts',
      onDelete: 'CASCADE',
    },
    {
      model: db.Community,
      as: 'communityAlerts',
      onDelete: 'CASCADE',
    },
  );

  db.ThreadSubscription.withManyToMany(
    {
      model: db.Thread,
      as: 'subscriptions',
      onDelete: 'CASCADE',
    },
    {
      model: db.User,
      as: 'threadSubscriptions',
      onDelete: 'CASCADE',
    },
  );
  db.CommentSubscription.withManyToMany(
    {
      model: db.Comment,
      as: 'subscriptions',
      onDelete: 'CASCADE',
    },
    {
      model: db.User,
      as: 'commentSubscriptions',
      onDelete: 'CASCADE',
    },
  );
  db.NotificationsRead.withManyToMany(
    { model: db.Subscription, onDelete: 'CASCADE' },
    {
      model: db.Notification,
      onDelete: 'CASCADE',
      hooks: true,
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
    foreignKey: 'community_id',
  });
  db.Subscription.belongsTo(db.Thread, {
    foreignKey: 'thread_id',
  });
  db.Subscription.belongsTo(db.Comment, {
    foreignKey: 'comment_id',
  });
};

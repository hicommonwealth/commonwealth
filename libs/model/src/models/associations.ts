import type { DB } from './factories';

/**
 * Associates models with type safety
 */
export const buildAssociations = (db: DB) => {
  db.User.withMany(db.Address, {
    onUpdate: 'CASCADE',
    onDelete: 'SET NULL',
  })
    .withMany(db.ProfileTags)
    .withMany(db.SubscriptionPreference, {
      asMany: 'SubscriptionPreferences',
      onDelete: 'CASCADE',
    })
    .withMany(db.Wallets)
    .withOne(db.ApiKey, {
      targetKey: 'id',
      onDelete: 'CASCADE',
    })
    .withMany(db.XpLog, {
      foreignKey: 'user_id',
      onDelete: 'CASCADE',
      asOne: 'user',
    })
    .withMany(db.XpLog, {
      foreignKey: 'creator_user_id',
      asOne: 'creator',
    });

  db.Quest.withMany(db.QuestActionMeta, {
    asMany: 'action_metas',
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
  });

  db.QuestActionMeta.withMany(db.XpLog, {
    foreignKey: 'action_meta_id',
    asOne: 'quest_action_meta',
  })
    .withOne(db.ChainEventXpSource, {
      foreignKey: 'quest_action_meta_id',
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    })
    .withOne(db.QuestTweets, {
      foreignKey: 'quest_action_meta_id',
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    });

  db.CommunityGoalMeta.withMany(db.QuestActionMeta, {
    foreignKey: 'community_goal_meta_id',
    onDelete: 'SET NULL',
    onUpdate: 'CASCADE',
  });

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
    .withOne(db.SsoToken, {
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    });

  db.ChainNode.withMany(db.Community)
    .withOne(db.LastProcessedEvmBlock)
    .withMany(db.Topic, {
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    })
    .withMany(db.PinnedToken, {
      onDelete: 'CASCADE',
    })
    .withMany(db.ChainEventXpSource, {
      foreignKey: 'chain_node_id',
      onDelete: 'CASCADE',
    });

  db.DiscordBotConfig.withOne(db.Community, {
    foreignKey: 'discord_config_id',
    targetKey: 'id',
  });

  db.Community.withMany(db.Group, { asMany: 'groups' })
    .withMany(db.Topic, {
      asOne: 'community',
      asMany: 'topics',
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    })
    .withMany(db.Address, {
      onUpdate: 'CASCADE',
    })
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
    .withMany(db.Webhook)
    .withMany(db.CommunityTags, {
      onDelete: 'CASCADE',
    })
    .withOne(db.DiscordBotConfig, {
      foreignKey: 'community_id',
      targetKey: 'id',
      onDelete: 'CASCADE',
    })
    .withOne(db.User, {
      foreignKey: 'selected_community_id',
      as: 'selectedCommunity',
    })
    .withMany(db.Quest, { onUpdate: 'CASCADE', onDelete: 'CASCADE' })
    .withMany(db.ContestManager, { onUpdate: 'CASCADE', onDelete: 'CASCADE' })
    .withMany(db.PinnedToken, {
      onDelete: 'CASCADE',
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
  })
    .withMany(db.GroupGatedAction, {
      foreignKey: 'topic_id',
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    })
    .withMany(db.ContestManager, {});

  db.Thread.withMany(db.Poll)
    .withMany(db.ContestAction, {
      optional: true,
    })
    .withMany(db.Reaction, {
      asMany: 'reactions',
    })
    .withMany(db.Comment)
    .withMany(db.ThreadVersionHistory)
    .withOne(db.ThreadRank, {
      onDelete: 'CASCADE',
    });

  db.Comment.withMany(db.Reaction, {
    asMany: 'reactions',
  }).withMany(db.CommentVersionHistory);

  db.ContestManager.withMany(db.Contest, {
    foreignKey: 'contest_address',
    asMany: 'contests',
    onDelete: 'CASCADE',
  }).withMany(db.ContestAction, {
    foreignKey: 'contest_address',
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
  });

  db.Contest.withMany(db.ContestAction, {
    foreignKey: ['contest_address', 'contest_id'],
    asMany: 'actions',
    onDelete: 'CASCADE',
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

  db.Group.withMany(db.GroupGatedAction, {
    foreignKey: 'group_id',
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
  });

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

  db.CommunityGoalReached.withManyToMany(
    {
      model: db.Community,
      onDelete: 'CASCADE',
    },
    {
      model: db.CommunityGoalMeta,
      onDelete: 'CASCADE',
      asOne: 'meta',
    },
  );

  db.LaunchpadToken.withMany(db.LaunchpadTrade, {
    foreignKey: 'token_address',
  });

  db.MCPServerCommunity.withManyToMany(
    {
      model: db.MCPServer,
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    },
    {
      model: db.Community,
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    },
  );
};

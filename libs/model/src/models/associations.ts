import { DB } from '.';

/**
 * Proposed pattern to associate models with type safety
 */
export const buildAssociations = (db: DB) => {
  db.Community.withMany(db.CommunityStake, 'community_id').withMany(
    db.ContestManager,
    'community_id',
  );

  // Contest manager associations
  db.ContestManager.withMany(db.Contest, 'contest_address').withMany(
    db.ContestTopic,
    'contest_address',
  );
  db.Contest.withMany(db.ContestAction, 'contest_address', { as: 'actions' });
  db.Thread.withMany(db.ContestAction, 'thread_id', { optional: true });
  db.Topic.withMany(db.ContestTopic, 'topic_id');

  // Stake associations
  db.CommunityStake.withMany(db.StakeTransaction, 'community_id').withMany(
    db.StakeTransaction,
    'stake_id',
  );

  // TODO: build many-to-many utility
  db.Address.hasMany(db.Collaboration, {
    foreignKey: { name: 'address_id', allowNull: false },
  });
  db.Thread.hasMany(db.Collaboration, {
    foreignKey: 'thread_id',
  });
  db.Collaboration.belongsTo(db.Address, {
    foreignKey: { name: 'thread_id' },
  });
  db.Collaboration.belongsTo(db.Thread);
  db.Address.belongsToMany(db.Thread, {
    through: db.Collaboration,
    as: 'collaboration',
    foreignKey: { name: 'address_id', allowNull: false },
  });
  db.Thread.belongsToMany(db.Address, {
    through: db.Collaboration,
    as: 'collaborators',
    foreignKey: { name: 'thread_id', allowNull: false },
  });
};

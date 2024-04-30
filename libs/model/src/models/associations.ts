import { DB } from '.';

/**
 * Proposed pattern to associate models with type safety
 */
export const buildAssociations = (db: DB) => {
  db.Community.withMany(db.CommunityStake, 'community_id').withMany(
    db.ContestManager,
    'community_id',
    { as: 'contest_managers' },
  );

  // Contest manager associations
  db.ContestManager.withMany(db.Contest, 'contest_address', {
    as: 'contests',
  }).withMany(db.ContestTopic, 'contest_address', { as: 'topics' });
  db.Contest.withMany(db.ContestAction, 'contest_address', { as: 'actions' });
  db.Thread.withMany(db.ContestAction, 'thread_id', { optional: true });
  db.Topic.withMany(db.ContestTopic, 'topic_id');

  // Stake associations
  db.CommunityStake.withMany(db.StakeTransaction, 'community_id').withMany(
    db.StakeTransaction,
    'stake_id',
  );

  // Many-to-many associations (cross-references)
  db.Collaboration.withManyToMany(
    [db.Address, 'address_id', 'collaborators'],
    [db.Thread, 'thread_id', 'collaborations'],
  );
  db.CommunityContract.withManyToMany(
    [db.Community, 'community_id', 'communities'],
    [db.Contract, 'contract_id', 'contracts'],
  );
};

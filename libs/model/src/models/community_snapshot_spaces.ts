import Sequelize from 'sequelize';
import type { SnapshotSpaceAttributes } from './snapshot_spaces';
import type { ModelInstance, ModelStatic } from './types';

export type CommunitySnapshotSpacesAttributes = {
  snapshot_space_id: string;
  community_id: string;
  created_at: Date;
  updated_at: Date;
  snapshot_space?: SnapshotSpaceAttributes;
};

export type CommunitySnapshotSpaceWithSpaceAttached =
  CommunitySnapshotSpacesAttributes & {
    snapshot_space?: SnapshotSpaceAttributes;
  };

export type CommunitySnapshotSpaceInstance =
  ModelInstance<CommunitySnapshotSpacesAttributes>;

export type CommunitySnapshotSpaceModelStatic =
  ModelStatic<CommunitySnapshotSpaceInstance>;

export default (sequelize: Sequelize.Sequelize) =>
  <CommunitySnapshotSpaceModelStatic>(
    sequelize.define<CommunitySnapshotSpaceInstance>(
      'CommunitySnapshotSpaces',
      {
        snapshot_space_id: { type: Sequelize.STRING, primaryKey: true },
        community_id: { type: Sequelize.STRING, primaryKey: true },
        created_at: { type: Sequelize.DATE, allowNull: false },
        updated_at: { type: Sequelize.DATE, allowNull: false },
      },
      {
        tableName: 'CommunitySnapshotSpaces',
        timestamps: true,
        underscored: true,
      },
    )
  );

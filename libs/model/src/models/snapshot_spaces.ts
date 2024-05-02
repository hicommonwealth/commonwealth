import Sequelize from 'sequelize';
import type { CommunitySnapshotSpacesAttributes } from '.';
import type { ModelInstance, ModelStatic } from './types';

export type SnapshotSpaceAttributes = {
  snapshot_space: string;
  created_at?: Date;
  updated_at?: Date;
  spaces?: CommunitySnapshotSpacesAttributes[];
};

export type SnapshotSpaceInstance = ModelInstance<SnapshotSpaceAttributes>;

export type SnapshotSpaceModelStatic = ModelStatic<SnapshotSpaceInstance>;

export default (sequelize: Sequelize.Sequelize): SnapshotSpaceModelStatic => {
  const SnapshotSpaces = <SnapshotSpaceModelStatic>sequelize.define(
    'SnapshotSpaces',
    {
      snapshot_space: {
        type: Sequelize.STRING,
        primaryKey: true,
        allowNull: false,
      },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    },
    {
      tableName: 'SnapshotSpaces',
      timestamps: true,
      underscored: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    },
  );

  return SnapshotSpaces;
};

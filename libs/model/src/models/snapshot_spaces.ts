import type * as Sequelize from 'sequelize';
import type { DataTypes } from 'sequelize';
import type { ModelInstance, ModelStatic } from './types';

export type SnapshotSpaceAttributes = {
  snapshot_space: string;
  created_at?: Date;
  updated_at?: Date;
};

export type SnapshotSpaceInstance = ModelInstance<SnapshotSpaceAttributes>;

export type SnapshotSpaceModelStatic = ModelStatic<SnapshotSpaceInstance>;

export default (
  sequelize: Sequelize.Sequelize,
  dataTypes: typeof DataTypes,
): SnapshotSpaceModelStatic => {
  const SnapshotSpaces = <SnapshotSpaceModelStatic>sequelize.define(
    'SnapshotSpaces',
    {
      snapshot_space: {
        type: dataTypes.STRING,
        primaryKey: true,
        allowNull: false,
      },
      created_at: { type: dataTypes.DATE, allowNull: false },
      updated_at: { type: dataTypes.DATE, allowNull: false },
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

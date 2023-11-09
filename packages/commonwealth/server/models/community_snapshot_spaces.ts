import type * as Sequelize from 'sequelize';
import type { DataTypes } from 'sequelize';
import type { SnapshotSpaceAttributes } from './snapshot_spaces';
import type { ModelInstance, ModelStatic } from './types';

export type CommunitySnapshotSpacesAttributes = {
  id: number;
  snapshot_space_id: string;
  chain_id: string;
  created_at?: Date;
  updated_at?: Date;
};

export type CommunitySnapshotSpaceWithSpaceAttached =
  CommunitySnapshotSpacesAttributes & {
    snapshot_space?: SnapshotSpaceAttributes;
  };

export type CommunitySnapshotSpaceInstance =
  ModelInstance<CommunitySnapshotSpacesAttributes>;

export type CommunitySnapshotSpaceModelStatic =
  ModelStatic<CommunitySnapshotSpaceInstance>;

export default (
  sequelize: Sequelize.Sequelize,
  dataTypes: typeof DataTypes,
): CommunitySnapshotSpaceModelStatic => {
  const CommunitySnapshotSpaces = <CommunitySnapshotSpaceModelStatic>(
    sequelize.define(
      'CommunitySnapshotSpaces',
      {
        id: {
          type: dataTypes.INTEGER,
          autoIncrement: true,
          primaryKey: true,
        }, // autogenerated
        snapshot_space_id: { type: dataTypes.STRING, allowNull: false },
        chain_id: { type: dataTypes.STRING, allowNull: false },
        created_at: { type: dataTypes.DATE, allowNull: false },
        updated_at: { type: dataTypes.DATE, allowNull: false },
      },
      {
        tableName: 'CommunitySnapshotSpaces',
        timestamps: true,
        underscored: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
      },
    )
  );

  CommunitySnapshotSpaces.associate = (models) => {
    models.CommunitySnapshotSpaces.belongsTo(models.Community, {
      foreignKey: 'chain_id',
      targetKey: 'id',
    });
    models.CommunitySnapshotSpaces.belongsTo(models.SnapshotSpace, {
      as: 'snapshot_space',
      foreignKey: 'snapshot_space_id',
      targetKey: 'snapshot_space',
    });
  };

  return CommunitySnapshotSpaces;
};

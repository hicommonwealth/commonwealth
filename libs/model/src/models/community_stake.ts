import type * as Sequelize from 'sequelize'; // must use "* as" to avoid scope errors
import type { DataTypes } from 'sequelize';
import type { ModelInstance, ModelStatic } from './types';

export type CommunityStakeAttributes = {
  id?: number;
  community_id?: string;
  stake_id?: number;
  stake_token?: string;
  stake_scaler?: number;
  stake_enabled?: boolean;

  created_at?: Date;
  updated_at?: Date;
};

export type CommunityStakeInstance = ModelInstance<CommunityStakeAttributes>;

export type CommunityStakeModelStatic = ModelStatic<CommunityStakeInstance>;

export default (
  sequelize: Sequelize.Sequelize,
  dataTypes: typeof DataTypes,
): CommunityStakeModelStatic => {
  const CommunityStake = <CommunityStakeModelStatic>sequelize.define(
    'CommunityStakes',
    {
      id: { type: dataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      community_id: { type: dataTypes.STRING, allowNull: false },
      stake_id: { type: dataTypes.INTEGER, allowNull: false },
      stake_token: { type: dataTypes.STRING, allowNull: false },
      stake_scaler: { type: dataTypes.REAL, allowNull: false },
      stake_enabled: { type: dataTypes.BOOLEAN, allowNull: false },
      created_at: { type: dataTypes.DATE, allowNull: false },
      updated_at: { type: dataTypes.DATE, allowNull: false },
    },
    {
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      underscored: true,
      tableName: 'CommunityStakes',
      indexes: [{ fields: ['community_id'] }],
    },
  );

  CommunityStake.associate = (models) => {
    models.CommunityStake.belongsTo(models.Community, {
      foreignKey: 'community_id',
      targetKey: 'id',
      as: 'Community',
    });
  };

  return CommunityStake;
};

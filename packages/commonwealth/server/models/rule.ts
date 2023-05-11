import type * as Sequelize from 'sequelize';
import type { DataTypes } from 'sequelize';
import type { CommunityAttributes } from './communities';
import type { ModelInstance, ModelStatic } from './types';

export type RuleAttributes = {
  id?: number;
  chain_id: string;
  rule: Record<string, unknown>;
  created_at?: Date;
  updated_at?: Date;

  Chain?: CommunityAttributes;
};

export type RuleInstance = ModelInstance<RuleAttributes>;

export type RuleModelStatic = ModelStatic<RuleInstance>;

export default (
  sequelize: Sequelize.Sequelize,
  dataTypes: typeof DataTypes
): RuleModelStatic => {
  const Rule = <RuleModelStatic>sequelize.define(
    'Rule',
    {
      id: { type: dataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      chain_id: { type: dataTypes.STRING, allowNull: false, field: 'community_id' },
      rule: { type: dataTypes.JSONB, allowNull: false },
      created_at: { type: dataTypes.DATE, allowNull: false },
      updated_at: { type: dataTypes.DATE, allowNull: false },
    },
    {
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      tableName: 'Rules',
      underscored: true,
      indexes: [{ fields: ['community_id'] }],
    }
  );

  Rule.associate = (models) => {
    models.Rule.belongsTo(models.Community, {
      foreignKey: 'community_id',
      targetKey: 'id',
    });
  };

  return Rule;
};

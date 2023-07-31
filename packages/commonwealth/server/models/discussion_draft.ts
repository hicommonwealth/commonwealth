import type * as Sequelize from 'sequelize';
import { DataTypes } from 'sequelize';
import type { ModelInstance, ModelStatic } from './types';

export type DiscussionDraftAttributes = {
  id: number;
  address_id: number;
  title?: string;
  topic?: string;
  body?: string;
  chain: string;
};

export type DiscussionDraftInstance = ModelInstance<DiscussionDraftAttributes>;

export type DiscussionDraftModelStatic = ModelStatic<DiscussionDraftInstance>;

export default (
  sequelize: Sequelize.Sequelize,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  dataTypes: typeof DataTypes
) => {
  const DiscussionDraft = <DiscussionDraftModelStatic>sequelize.define(
    'DiscussionDraft',
    {
      id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      address_id: { type: DataTypes.INTEGER, allowNull: false },
      title: { type: DataTypes.TEXT, allowNull: true },
      topic: { type: DataTypes.STRING, allowNull: true },
      body: { type: DataTypes.TEXT, allowNull: true },
      chain: { type: DataTypes.STRING, allowNull: false },
    },
    {
      tableName: 'DiscussionDrafts',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      underscored: true,
      indexes: [{ fields: ['address_id'] }],
    }
  );

  DiscussionDraft.associate = (models) => {
    models.DiscussionDraft.belongsTo(models.Chain, {
      foreignKey: 'chain',
      targetKey: 'id',
    });
    models.DiscussionDraft.belongsTo(models.Address, {
      foreignKey: 'address_id',
      targetKey: 'id',
    });
  };

  return DiscussionDraft;
};

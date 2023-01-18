import type * as Sequelize from 'sequelize';
import type { DataTypes } from 'sequelize';
import type { ChainAttributes } from './chain';
import type { ThreadAttributes } from './thread';
import type { ModelInstance, ModelStatic } from './types';

export type ViewCountAttributes = {
  object_id: number;
  view_count: number;
  id?: number;
  chain: string;
  Chain?: ChainAttributes;
  Thread?: ThreadAttributes;
};

export type ViewCountInstance = ModelInstance<ViewCountAttributes>;

export type ViewCountModelStatic = ModelStatic<ViewCountInstance>;

export default (
  sequelize: Sequelize.Sequelize,
  dataTypes: typeof DataTypes
): ViewCountModelStatic => {
  const ViewCount = <ViewCountModelStatic>sequelize.define(
    'ViewCount',
    {
      id: { type: dataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      chain: { type: dataTypes.STRING, allowNull: false },
      object_id: { type: dataTypes.INTEGER, allowNull: false },
      view_count: { type: dataTypes.INTEGER, allowNull: false },
    },
    {
      tableName: 'ViewCounts',
      underscored: true,
      timestamps: false,
      indexes: [
        { fields: ['id'] },
        { fields: ['chain', 'object_id'] },
        { fields: ['view_count'] },
      ],
    }
  );

  ViewCount.associate = (models) => {
    models.ViewCount.belongsTo(models.Chain, {
      foreignKey: 'chain',
      targetKey: 'id',
    });
    models.ViewCount.belongsTo(models.Thread, {
      foreignKey: 'object_id',
      targetKey: 'id',
    });
  };

  return ViewCount;
};

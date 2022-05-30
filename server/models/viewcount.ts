import * as Sequelize from 'sequelize';
import { DataTypes, Model } from 'sequelize';
import { ModelStatic, ModelInstance } from './types';
import { CommunityAttributes } from './community';
import { ThreadAttributes } from './thread';

export type ViewCountAttributes = {
  object_id: number;
  view_count: number;
  id?: number;
  community_id: string;
  Community?: CommunityAttributes;
  Thread?: ThreadAttributes;
}

export type ViewCountInstance = ModelInstance<ViewCountAttributes> & {

}

export type ViewCountModelStatic = ModelStatic<ViewCountInstance>;

export default (
  sequelize: Sequelize.Sequelize,
  dataTypes: typeof DataTypes,
): ViewCountModelStatic => {
  const ViewCount = <ViewCountModelStatic>sequelize.define('ViewCount', {
    id: { type: dataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    community_id: { type: dataTypes.STRING, allowNull: false },
    object_id: { type: dataTypes.INTEGER, allowNull: false },
    view_count: { type: dataTypes.INTEGER, allowNull: false },
  }, {
    tableName: 'ViewCounts',
    underscored: true,
    timestamps: false,
    indexes: [
      { fields: ['id'] },
      { fields: ['chain', 'object_id'] },
      { fields: ['view_count'] },
    ],
  });

  ViewCount.associate = (models) => {
    models.ViewCount.belongsTo(models.Community, { foreignKey: 'community_id', targetKey: 'id' });
    models.ViewCount.belongsTo(models.Thread, { foreignKey: 'object_id', targetKey: 'id' });
  };

  return ViewCount;
};

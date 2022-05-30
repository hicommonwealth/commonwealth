import * as Sequelize from 'sequelize';
import { Model, DataTypes } from 'sequelize';
import { ModelStatic } from './types';

export interface CommunityCategoryAttributes {
  id: number;
  community_id: string;
  category_type_id: number;
}

export interface CommunityCategoryInstance
  extends Model<CommunityCategoryAttributes>,
    CommunityCategoryAttributes {}

export type CommunityCategoryModelStatic = ModelStatic<CommunityCategoryInstance>;

export default (
  sequelize: Sequelize.Sequelize,
  dataTypes: typeof DataTypes
): CommunityCategoryModelStatic => {
  const CommunityCategory = <CommunityCategoryModelStatic>sequelize.define(
    'CommunityCategories',
    {
      id: { type: dataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      chain_id: {
        type: dataTypes.STRING,
        allowNull: false,
        references: { model: 'Communitys', key: 'id' },
      },
      category_type_id: {
        type: dataTypes.INTEGER,
        allowNull: false,
      },
    },
    {
      tableName: 'CommunityCategories',
      timestamps: false,
      underscored: true,
    }
  );

  CommunityCategory.associate = (models) => {
    models.CommunityCategory.belongsTo(models.Community);
    models.CommunityCategory.belongsTo(models.CommunityCategoryType, {
      foreignKey: 'category_type_id',
    });
  };

  return CommunityCategory;
};

import type * as Sequelize from 'sequelize';
import type { DataTypes, Model } from 'sequelize';
import type { ModelStatic } from './types';

export interface ChainCategoryAttributes {
  id: number;
  chain_id: string;
  category_type_id: number;
}

export interface ChainCategoryInstance
  extends Model<ChainCategoryAttributes>,
    ChainCategoryAttributes {}

export type ChainCategoryModelStatic = ModelStatic<ChainCategoryInstance>;

export default (
  sequelize: Sequelize.Sequelize,
  dataTypes: typeof DataTypes
): ChainCategoryModelStatic => {
  const ChainCategory = <ChainCategoryModelStatic>sequelize.define(
    'ChainCategories',
    {
      id: { type: dataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      chain_id: {
        type: dataTypes.STRING,
        allowNull: false,
        field: 'community_id',
        references: { model: 'Communities', key: 'id' }
      },
      category_type_id: {
        type: dataTypes.INTEGER,
        allowNull: false,
      },
    },
    {
      tableName: 'ChainCategories',
      timestamps: false,
      underscored: true,
    }
  );

  ChainCategory.associate = (models) => {
    models.ChainCategory.belongsTo(models.Community);
    models.ChainCategory.belongsTo(models.ChainCategoryType, {
      foreignKey: 'category_type_id',
    });
  };

  return ChainCategory;
};

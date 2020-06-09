import * as Sequelize from 'sequelize';

export interface ContractCategoryAttributes {
  id?: number;
  name: string;
  description: string;
  color: string;
  created_at?: Date;
  updated_at?: Date;
}

export interface ContractCategoryInstance
extends Sequelize.Instance<ContractCategoryAttributes>, ContractCategoryAttributes {

}

export interface ContractCategoryModel extends Sequelize.Model<ContractCategoryInstance, ContractCategoryAttributes> {

}

export default (
  sequelize: Sequelize.Sequelize,
  dataTypes: Sequelize.DataTypes,
): ContractCategoryModel => {
  const ContractCategory = sequelize.define<ContractCategoryInstance, ContractCategoryAttributes>('ContractCategory', {
    id:          { type: dataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    name:        { type: dataTypes.STRING, allowNull: false },
    description: { type: dataTypes.TEXT, allowNull: false },
    color:       { type: dataTypes.STRING, allowNull: false },
  }, {
    underscored: true,
  });

  return ContractCategory;
};

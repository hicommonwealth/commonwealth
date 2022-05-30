import * as Sequelize from 'sequelize';
import { Model, DataTypes } from 'sequelize';
import { ModelStatic } from './types';

export interface CommunityCategoryTypeAttributes {
  id: number;
  category_name: string;
}

export interface CommunityCategoryTypeInstance
  extends Model<CommunityCategoryTypeAttributes>,
    CommunityCategoryTypeAttributes {}

export type CommunityCategoryTypeModelStatic =
  ModelStatic<CommunityCategoryTypeInstance>;

export default (
  sequelize: Sequelize.Sequelize,
  dataTypes: typeof DataTypes
): CommunityCategoryTypeModelStatic => {
  const CommunityCategoryType = <CommunityCategoryTypeModelStatic>sequelize.define(
    'CommunityCategoryType',
    {
      id: { type: dataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      category_name: { type: dataTypes.STRING, allowNull: true },
    },
    {
      tableName: 'CommunityCategoryTypes',
      timestamps: false,
      underscored: true,
    }
  );

  return CommunityCategoryType;
};

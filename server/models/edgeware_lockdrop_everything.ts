import * as Sequelize from 'sequelize';
import { Model, DataTypes } from 'sequelize';
import { ModelStatic } from './types';

export interface EdgewareLockdropEverythingAttributes {
  createdAt: Date;
  id?: number;
  data?: string;
  created_at?: Date;
  updated_at?: Date;
}

export interface EdgewareLockdropEverythingInstance
extends Model<EdgewareLockdropEverythingAttributes>, EdgewareLockdropEverythingAttributes {}

export type EdgewareLockdropEverythingModelStatic = ModelStatic<EdgewareLockdropEverythingInstance>

export default (
  sequelize: Sequelize.Sequelize,
  dataTypes: typeof DataTypes,
): EdgewareLockdropEverythingModelStatic => {
  const EdgewareLockdropEverything = <EdgewareLockdropEverythingModelStatic>sequelize.define('EdgewareLockdropEverything', {
    id: { type: dataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    createdAt: { type: dataTypes.DATE, allowNull: false },
    data: { type: dataTypes.TEXT, allowNull: true },
  }, {
    tableName: 'EdgewareLockdropEverythings',
    underscored: true,
    timestamps: true,
  });

  return EdgewareLockdropEverything;
};

import * as Sequelize from 'sequelize';
import { BuildOptions, Model, DataTypes } from 'sequelize';

export interface EdgewareLockdropEverythingAttributes {
  id?: number;
  createdAt: Date;
  data?: string;
  created_at?: Date;
  updated_at?: Date;
}

export interface EdgewareLockdropEverythingInstance
extends Model<EdgewareLockdropEverythingAttributes>, EdgewareLockdropEverythingAttributes {}

type EdgewareLockdropEverythingModelStatic = typeof Model
    & { associate: (models: any) => void }
    & { new(values?: Record<string, unknown>, options?: BuildOptions): EdgewareLockdropEverythingInstance }

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

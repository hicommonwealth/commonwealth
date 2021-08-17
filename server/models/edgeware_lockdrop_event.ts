import * as Sequelize from 'sequelize';
import { Model, DataTypes } from 'sequelize';
import { ModelStatic } from './types';

export interface EdgewareLockdropEventAttributes {
  origin: string;
  blocknum: number;
  id?: number;
  timestamp?: string;
  name: string;
  data?: string;
}

export interface EdgewareLockdropEventInstance
extends Model<EdgewareLockdropEventAttributes>, EdgewareLockdropEventAttributes {}

export type EdgewareLockdropEventModelStatic = ModelStatic<EdgewareLockdropEventInstance>

export default (
  sequelize: Sequelize.Sequelize,
  dataTypes: typeof DataTypes,
): EdgewareLockdropEventModelStatic => {
  const EdgewareLockdropEvent = <EdgewareLockdropEventModelStatic>sequelize.define('EdgewareLockdropEvent', {
    id: { type: dataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    origin: { type: dataTypes.STRING, allowNull: false },
    blocknum: { type: dataTypes.INTEGER, allowNull: false },
    timestamp: { type: dataTypes.STRING, allowNull: true },
    name: { type: dataTypes.STRING, allowNull: false },
    data: { type: dataTypes.TEXT, allowNull: true },
  }, {
    tableName: 'EdgewareLockdropEvents',
    underscored: true,
    timestamps: false,
    indexes: [
      { fields: ['origin', 'blocknum'] },
      { fields: ['origin', 'timestamp'] },
    ],
  });

  return EdgewareLockdropEvent;
};

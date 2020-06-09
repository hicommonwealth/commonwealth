import * as Sequelize from 'sequelize';

export interface EdgewareLockdropEventAttributes {
  id?: number;
  origin: string;
  blocknum: number;
  timestamp?: string;
  name: string;
  data?: string;
}

export interface EdgewareLockdropEventInstance
extends Sequelize.Instance<EdgewareLockdropEventAttributes>, EdgewareLockdropEventAttributes {

}

export interface EdgewareLockdropEventModel extends Sequelize.Model<
  EdgewareLockdropEventInstance, EdgewareLockdropEventAttributes
> {

}

export default (
  sequelize: Sequelize.Sequelize,
  dataTypes: Sequelize.DataTypes,
): EdgewareLockdropEventModel => {
  const EdgewareLockdropEvent = sequelize.define<
    EdgewareLockdropEventInstance, EdgewareLockdropEventAttributes
  >('EdgewareLockdropEvent', {
    id: { type: dataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    origin: { type: dataTypes.STRING, allowNull: false },
    blocknum: { type: dataTypes.INTEGER, allowNull: false },
    timestamp: { type: dataTypes.STRING, allowNull: true },
    name: { type: dataTypes.STRING, allowNull: false },
    data: { type: dataTypes.TEXT, allowNull: true },
  }, {
    underscored: true,
    timestamps: false,
    indexes: [
      { fields: ['origin', 'blocknum'] },
      { fields: ['origin', 'timestamp'] },
    ],
  });

  return EdgewareLockdropEvent;
};

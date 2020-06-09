import * as Sequelize from 'sequelize';

export interface EdgewareLockdropEverythingAttributes {
  id?: number;
  createdAt: Date;
  data?: string;
  created_at?: Date;
  updated_at?: Date;
}

export interface EdgewareLockdropEverythingInstance
extends Sequelize.Instance<EdgewareLockdropEverythingAttributes>, EdgewareLockdropEverythingAttributes {

}

export interface EdgewareLockdropEverythingModel
extends Sequelize.Model<EdgewareLockdropEverythingInstance, EdgewareLockdropEverythingAttributes> {

}

export default (
  sequelize: Sequelize.Sequelize,
  dataTypes: Sequelize.DataTypes,
): EdgewareLockdropEverythingModel => {
  const EdgewareLockdropEverything = sequelize.define<
    EdgewareLockdropEverythingInstance, EdgewareLockdropEverythingAttributes
  >('EdgewareLockdropEverything', {
    id: { type: dataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    createdAt: { type: dataTypes.DATE, allowNull: false },
    data: { type: dataTypes.TEXT, allowNull: true },
  }, {
    underscored: true,
    timestamps: true,
  });

  return EdgewareLockdropEverything;
};

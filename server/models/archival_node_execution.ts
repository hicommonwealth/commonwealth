import * as Sequelize from 'sequelize';

export interface ArchivalNodeAttributes {
    id?: number;
    chain_event_version: string;
    start_block: number;
    created_at?: Date;
    updated_at?: Date;
  }

export interface ArchivalNodeInstance extends Sequelize.Instance<ArchivalNodeAttributes>, ArchivalNodeAttributes {

}

export interface ArchivalNodeModel extends Sequelize.Model<ArchivalNodeInstance, ArchivalNodeAttributes> {

}

export default (
  sequelize: Sequelize.Sequelize,
  dataTypes: Sequelize.DataTypes,
): ArchivalNodeModel => {
  const ArchivalNode = sequelize.define<ArchivalNodeInstance, ArchivalNodeAttributes>('ArchivalNodeExecutionEntries', {
    id: { type: dataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    chain_event_version: { type: dataTypes.STRING, allowNull: false }, //@commonwealth/chain-events version from package.json
    start_block: { type: dataTypes.INTEGER, allowNull: false, unique: true }, // starting block number when archival node executed
    created_at: { type: dataTypes.DATE, allowNull: false },
    updated_at: { type: dataTypes.DATE, allowNull: false }
  }, {
    timestamps: true,
    underscored: true,
    freezeTableName: true,
  });

  return ArchivalNode;
};

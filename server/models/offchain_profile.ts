import * as Sequelize from 'sequelize';
import { AddressAttributes } from './address';

export interface OffchainProfileAttributes {
  address_id: number;
  identity?: string;   // display name from chain
  data?: string;

  // associations
  Address?: AddressAttributes;
}

export interface OffchainProfileInstance
extends Sequelize.Instance<OffchainProfileAttributes>, OffchainProfileAttributes {

}

export interface OffchainProfileModel extends Sequelize.Model<OffchainProfileInstance, OffchainProfileAttributes> {

}

export default (
  sequelize: Sequelize.Sequelize,
  dataTypes: Sequelize.DataTypes,
): OffchainProfileModel => {
  const OffchainProfile = sequelize.define<OffchainProfileInstance, OffchainProfileAttributes>(
    'OffchainProfile', {
      address_id: { type: dataTypes.INTEGER, allowNull: false, primaryKey: true },
      identity: { type: dataTypes.STRING, allowNull: true },
      data: { type: dataTypes.TEXT, allowNull: true },
    }, {
      underscored: true,
      timestamps: false,
      indexes: [
        { fields: ['address_id'] },
      ],
    }
  );

  OffchainProfile.associate = (models) => {
    models.OffchainProfile.belongsTo(models.Address, { foreignKey: 'address_id', targetKey: 'id' });
  };

  return OffchainProfile;
};

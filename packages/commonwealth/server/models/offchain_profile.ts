import type { SubstrateTypes } from 'chain-events/src/types';
import type * as Sequelize from 'sequelize';
import type { DataTypes } from 'sequelize';
import type { AddressAttributes } from './address';
import type { ModelInstance, ModelStatic } from './types';

export type OffchainProfileAttributes = {
  address_id: number;
  data?: string;
  identity?: string; // deprecated but keeping to preserve server-side behavior

  // associations
  Address?: AddressAttributes;
};

export type OffchainProfileInstance = ModelInstance<OffchainProfileAttributes>;

export type OffchainProfileModelStatic = ModelStatic<OffchainProfileInstance>;

export default (
  sequelize: Sequelize.Sequelize,
  dataTypes: typeof DataTypes
): OffchainProfileModelStatic => {
  const OffchainProfile = <OffchainProfileModelStatic>sequelize.define(
    'OffchainProfile',
    {
      address_id: {
        type: dataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
      },
      identity: { type: dataTypes.STRING, allowNull: true },
      data: { type: dataTypes.TEXT, allowNull: true },
    },
    {
      tableName: 'OffchainProfiles',
      underscored: true,
      timestamps: false,
      indexes: [{ fields: ['address_id'] }],
    }
  );

  OffchainProfile.associate = (models) => {
    models.OffchainProfile.belongsTo(models.Address, {
      foreignKey: 'address_id',
      targetKey: 'id',
    });
  };

  return OffchainProfile;
};

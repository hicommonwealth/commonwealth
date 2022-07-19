import * as Sequelize from 'sequelize';
import { Model, DataTypes } from 'sequelize';

import { SubstrateTypes } from '@commonwealth/chain-events';
import { AddressAttributes } from './address';
import { ModelStatic, ModelInstance } from './types';

export type OffchainProfileAttributes = {
  address_id: number;
  identity?: string;   // display name from chain
  judgements?: { [registrar: string]: SubstrateTypes.IdentityJudgement }
  data?: string;

  // associations
  Address?: AddressAttributes;
}

export type OffchainProfileInstance = ModelInstance<OffchainProfileAttributes>;

export type OffchainProfileModelStatic = ModelStatic<OffchainProfileInstance>;

export default (
  sequelize: Sequelize.Sequelize,
  dataTypes: typeof DataTypes,
): OffchainProfileModelStatic => {
  const OffchainProfile = <OffchainProfileModelStatic>sequelize.define(
    'OffchainProfile', {
      address_id: { type: dataTypes.INTEGER, allowNull: false, primaryKey: true },
      identity: { type: dataTypes.STRING, allowNull: true },
      judgements: { type: dataTypes.JSONB, allowNull: true },
      data: { type: dataTypes.TEXT, allowNull: true },
    }, {
      tableName: 'OffchainProfiles',
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

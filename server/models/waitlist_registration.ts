import * as Sequelize from 'sequelize';
import { DataTypes, Model } from 'sequelize';
import { ModelStatic } from '../../shared/types';

export interface WaitlistRegistrationAttributes {
  user_id: number;
  chain_id: string;
  address?: string;
  created_at?: Date;
  updated_at?: Date;
}

export interface WaitlistRegistrationInstance
extends Model<WaitlistRegistrationAttributes>, WaitlistRegistrationAttributes {}

type WaitlistRegistrationModelStatic = ModelStatic<WaitlistRegistrationInstance>

export default (
  sequelize: Sequelize.Sequelize,
  dataTypes: typeof DataTypes,
): WaitlistRegistrationModelStatic => {
  const WaitlistRegistration = <WaitlistRegistrationModelStatic>sequelize.define(
    'WaitlistRegistration', {
      user_id: { type: dataTypes.INTEGER, allowNull: false },
      chain_id: { type: dataTypes.STRING, allowNull: false },
      address: { type: dataTypes.STRING, allowNull: true },
      created_at: { type: dataTypes.DATE, allowNull: false },
      updated_at: { type: dataTypes.DATE, allowNull: false },
    }, {
      tableName: 'WaitlistRegistrations',
      timestamps: true,
      underscored: true,
    }
  );
  return WaitlistRegistration;
};

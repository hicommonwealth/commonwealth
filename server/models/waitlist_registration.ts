import * as Sequelize from 'sequelize';

export interface WaitlistRegistrationAttributes {
  user_id: number;
  chain_id: string;
  address?: string;
  created_at?: Date;
  updated_at?: Date;
}

export interface WaitlistRegistrationInstance
extends Sequelize.Instance<WaitlistRegistrationAttributes>, WaitlistRegistrationAttributes {

}

export interface WaitlistRegistrationModel extends Sequelize.Model<
  WaitlistRegistrationInstance, WaitlistRegistrationAttributes
> {

}

export default (
  sequelize: Sequelize.Sequelize,
  dataTypes: Sequelize.DataTypes,
): WaitlistRegistrationModel => {
  const WaitlistRegistration = sequelize.define<WaitlistRegistrationInstance, WaitlistRegistrationAttributes>(
    'WaitlistRegistration', {
      user_id: { type: dataTypes.INTEGER, allowNull: false },
      chain_id: { type: dataTypes.STRING, allowNull: false },
      address: { type: dataTypes.STRING, allowNull: true },
      created_at: { type: dataTypes.DATE, allowNull: false },
      updated_at: { type: dataTypes.DATE, allowNull: false },
    }, {
      timestamps: true,
      underscored: true,
    }
  );
  return WaitlistRegistration;
};

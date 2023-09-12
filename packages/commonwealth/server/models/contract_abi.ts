import type * as Sequelize from 'sequelize'; // must use "* as" to avoid scope errors
import type { DataTypes } from 'sequelize';
import type { ModelInstance, ModelStatic } from './types';
import crypto from 'crypto';

function hashAbi(abi: any) {
  let stringifiedAbi: any;
  if (typeof abi === 'string') {
    stringifiedAbi = JSON.parse(abi);
  } else {
    stringifiedAbi = abi;
  }
  const hash = crypto.createHash('sha256');
  hash.update(stringifiedAbi);
  return hash.digest('hex');
}

export type ContractAbiAttributes = {
  id: number;
  nickname?: string;
  abi: string;
  abi_hash?: string;
  verified?: boolean;
  created_at?: Date;
  updated_at?: Date;
};

export type ContractAbiInstance = ModelInstance<ContractAbiAttributes>;

export type ContractAbiModelStatic = ModelStatic<ContractAbiInstance>;

export default (
  sequelize: Sequelize.Sequelize,
  dataTypes: typeof DataTypes
): ContractAbiModelStatic => {
  const ContractAbi = <ContractAbiModelStatic>sequelize.define(
    'ContractAbi',
    {
      id: { type: dataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      nickname: { type: dataTypes.STRING, allowNull: true },
      abi: { type: dataTypes.JSONB, allowNull: false },
      abi_hash: { type: dataTypes.TEXT, allowNull: false, unique: true },
      verified: {
        type: dataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      created_at: { type: dataTypes.DATE, allowNull: false },
      updated_at: { type: dataTypes.DATE, allowNull: false },
    },
    {
      tableName: 'ContractAbis',
      timestamps: true,
      underscored: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      hooks: {
        beforeValidate(instance: ContractAbiInstance) {
          if (!instance.abi_hash) {
            instance.abi_hash = hashAbi(instance.abi);
          }
        },
      },
    }
  );

  ContractAbi.associate = (models) => {
    models.ContractAbi.hasMany(models.Contract, { foreignKey: 'abi_id' });
  };

  return ContractAbi;
};

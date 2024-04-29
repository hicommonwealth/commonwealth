import type { AbiType } from '@hicommonwealth/shared';
import type * as Sequelize from 'sequelize'; // must use "* as" to avoid scope errors
import type { DataTypes } from 'sequelize';
import { hashAbi } from '../utils';
import type { ModelInstance, ModelStatic } from './types';

export type ContractAbiAttributes = {
  id: number;
  nickname?: string;
  abi: AbiType;
  abi_hash?: string;
  verified?: boolean;
  created_at?: Date;
  updated_at?: Date;
};

export type ContractAbiInstance = ModelInstance<ContractAbiAttributes>;

export type ContractAbiModelStatic = ModelStatic<ContractAbiInstance>;

export default (
  sequelize: Sequelize.Sequelize,
  dataTypes: typeof DataTypes,
): ContractAbiModelStatic => {
  const ContractAbi = <ContractAbiModelStatic>sequelize.define(
    'ContractAbi',
    {
      id: { type: dataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      nickname: { type: dataTypes.STRING, allowNull: true, unique: true },
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
      validate: {
        // this validation function is replicated in the database as the 'chk_contract_abi_array' CHECK constraint
        // see 20230913003500-contract-abis-fixes.js for the constraint
        validAbi() {
          if (!Array.isArray(this.abi)) {
            throw new Error(
              `Invalid ABI. The given ABI of type ${typeof this
                .abi} is not a valid array.`,
            );
          }
        },
      },
      hooks: {
        beforeValidate(instance: ContractAbiInstance) {
          if (!instance.abi_hash) {
            instance.abi_hash = hashAbi(instance.abi);
          }
        },
      },
    },
  );

  ContractAbi.associate = (models) => {
    models.ContractAbi.hasMany(models.Contract, { foreignKey: 'abi_id' });
    models.ContractAbi.hasMany(models.EvmEventSource, { foreignKey: 'abi_id' });
  };

  return ContractAbi;
};

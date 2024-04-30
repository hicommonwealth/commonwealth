import type { AbiType } from '@hicommonwealth/shared';
import Sequelize from 'sequelize'; // must use "* as" to avoid scope errors
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

export default (sequelize: Sequelize.Sequelize) =>
  <ContractAbiModelStatic>sequelize.define<ContractAbiInstance>(
    'ContractAbi',
    {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      nickname: { type: Sequelize.STRING, allowNull: true, unique: true },
      abi: { type: Sequelize.JSONB, allowNull: false },
      abi_hash: { type: Sequelize.TEXT, allowNull: false, unique: true },
      verified: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
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

import * as Sequelize from 'sequelize'; // must use "* as" to avoid scope errors
import { DataTypes } from 'sequelize';
import { ModelStatic, ModelInstance } from './types';
import { ContractAttributes, ContractInstance } from './contract';

export type ContractAbiAttributes = {
  id: number;
  nickname?: string;
  abi: Array<Record<string, unknown>>;
  verified?: boolean;
  created_at?: Date;
  updated_at?: Date;
  is_factory?: boolean;
  create_dao_function_name?: string;
  create_dao_event_name?: string;
  create_dao_event_parameter?: string;

  Contracts?: ContractAttributes[];
};

export type ContractAbiInstance = ModelInstance<ContractAbiAttributes> & {
  getContracts: Sequelize.HasManyGetAssociationsMixin<ContractInstance>;
};

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
      abi: { type: dataTypes.JSONB, allowNull: false, unique: true },
      verified: {
        type: dataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      created_at: { type: dataTypes.DATE, allowNull: false },
      updated_at: { type: dataTypes.DATE, allowNull: false },
      is_factory: {
        type: dataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      create_dao_function_name: { type: dataTypes.STRING, allowNull: true },
      create_dao_event_name: { type: dataTypes.STRING, allowNull: true },
      create_dao_event_parameter: { type: dataTypes.STRING, allowNull: true },
    },
    {
      tableName: 'ContractAbis',
      timestamps: true,
      underscored: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    }
  );

  ContractAbi.associate = (models) => {
    models.ContractAbi.hasMany(models.Contract, { foreignKey: 'abi_id' });
  };

  return ContractAbi;
};

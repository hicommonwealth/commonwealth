import * as Sequelize from 'sequelize'; // must use "* as" to avoid scope errors
import { DataTypes } from 'sequelize';
import { ModelStatic, ModelInstance } from './types';


export type ContractAbiAttributes = {
  id: number;
  abi: string;
};

export type ContractAbiInstance = ModelInstance<ContractAbiAttributes> & {
    // add mixins as needed
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
      abi: { type: dataTypes.JSONB, allowNull: false, unique: true },
      created_at: { type: dataTypes.DATE, allowNull: false },
      updated_at: { type: dataTypes.DATE, allowNull: false },
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
import * as Sequelize from 'sequelize'; // must use "* as" to avoid scope errors
import { DataTypes } from 'sequelize';
import { ModelStatic, ModelInstance } from './types';
import { RegisteredTypes } from "@polkadot/types/types";
import { ChainBase, ChainNetwork } from 'common-common/src/types';
import { ChainNodeAttributes } from "./chain_node";

export type ChainAttributes = {
  id: string;
  base: ChainBase;
  network: ChainNetwork;
  chain_node_id: number;
  contract_address: string;
  substrate_spec: RegisteredTypes;
  verbose_logging: boolean;
  active: boolean;

  ChainNode?: ChainNodeAttributes;
};

export type ChainInstance = ModelInstance<ChainAttributes> & {};

export type ChainModelStatic = ModelStatic<ChainInstance>;

export default (
  sequelize: Sequelize.Sequelize,
  dataTypes: typeof DataTypes
): ChainModelStatic => {
  const Chain = <ChainModelStatic>sequelize.define(
    'Chain',
    {
      id: { type: dataTypes.STRING, primaryKey: true },
      base: { type: dataTypes.STRING, allowNull: false },
      network: { type: dataTypes.STRING, allowNull: false },
      chain_node_id: { type: dataTypes.INTEGER, allowNull: false },
      contract_address: { type: dataTypes.STRING, allowNull: true },
      substrate_spec: { type: dataTypes.JSONB, allowNull: true },
      verbose_logging: { type: dataTypes.BOOLEAN, allowNull: true },
      active: { type: dataTypes.BOOLEAN, allowNull: false, defaultValue: false }
    },
    {
      tableName: 'Chains',
      timestamps: false,
      underscored: false,
    }
  );

  Chain.associate = (models) => {
    models.Chain.belongsTo(models.ChainNode, { foreignKey: 'chain_node_id' });
  };

  return Chain;
};

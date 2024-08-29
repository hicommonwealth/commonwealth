console.log('LOADING src/models/lastProcessedEvmBlock.ts START');
import Sequelize from 'sequelize';
import { ModelInstance } from './types';

export type LastProcessedEvmBlockAttributes = {
  chain_node_id: number;
  block_number: number;
};

export type LastProcessedEvmBlockInstance =
  ModelInstance<LastProcessedEvmBlockAttributes>;

export default (
  sequelize: Sequelize.Sequelize,
): Sequelize.ModelStatic<LastProcessedEvmBlockInstance> =>
  sequelize.define<LastProcessedEvmBlockInstance>(
    'LastProcessedEvmBlock',
    {
      chain_node_id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
      },
      block_number: { type: Sequelize.INTEGER, allowNull: false },
    },
    {
      timestamps: false,
      tableName: 'LastProcessedEvmBlocks',
    },
  );

console.log('LOADING src/models/lastProcessedEvmBlock.ts END');

import Sequelize from 'sequelize';
import { ModelInstance, ModelStatic } from './types';

export type LastProcessedEvmBlockAttributes = {
  chain_node_id: number;
  block_number: number;
};

export type LastProcessedEvmBlockInstance =
  ModelInstance<LastProcessedEvmBlockAttributes>;

export type LastProcessedEvmBlockModelStatic =
  ModelStatic<LastProcessedEvmBlockInstance>;

export default (sequelize: Sequelize.Sequelize) =>
  <LastProcessedEvmBlockModelStatic>(
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
    )
  );

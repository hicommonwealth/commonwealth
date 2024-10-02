import { Token } from '@hicommonwealth/schemas';
import Sequelize from 'sequelize'; // must use "* as" to avoid scope errors
import { z } from 'zod';
import type { ChainNodeAttributes, ChainNodeInstance } from './chain_node';
import type { ModelInstance } from './types';

export type TokenAttributes = z.infer<typeof Token> & {
  // associations
  ChainNode?: ChainNodeAttributes;
};

export type TokenInstance = ModelInstance<TokenAttributes> & {
  // add mixins as needed
  getChainNode: Sequelize.BelongsToGetAssociationMixin<ChainNodeInstance>;
};

export default (
  sequelize: Sequelize.Sequelize,
): Sequelize.ModelStatic<TokenInstance> =>
  sequelize.define<TokenInstance>(
    'Token',
    {
      name: { type: Sequelize.STRING, primaryKey: true },
      icon_url: { type: Sequelize.STRING, allowNull: true },
      description: { type: Sequelize.STRING, allowNull: true },
      symbol: { type: Sequelize.STRING },
      chain_node_id: { type: Sequelize.INTEGER },
      base: { type: Sequelize.STRING, allowNull: false },
      author_address: { type: Sequelize.STRING, allowNull: false },
    },
    {
      tableName: 'Tokens',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      underscored: false,
    },
  );

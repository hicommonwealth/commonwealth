import * as Sequelize from 'sequelize';
import { Model } from 'sequelize';
import { ModelStatic } from './types';

export interface TokenAttributes {
  id: string;
  decimals: number;
  name: string;
  address: string;
  symbol: string;
  icon_url?: string;
}

export interface TokenInstance extends Model<TokenAttributes>, TokenAttributes {

}

export type TokenModelStatic = ModelStatic<TokenInstance>

export default (
  sequelize: Sequelize.Sequelize,
  dataTypes: typeof Sequelize.DataTypes,
): TokenModelStatic => {
  const Token = <TokenModelStatic>sequelize.define<TokenInstance, TokenAttributes>('Token', {
    id: { type: dataTypes.STRING, allowNull: false, primaryKey: true },
    decimals: { type: dataTypes.INTEGER, allowNull: false },
    name: { type: dataTypes.STRING, allowNull: false },
    address: { type: dataTypes.STRING, allowNull: false },
    symbol: { type: dataTypes.STRING, allowNull: false },
    icon_url: { type: dataTypes.STRING(1024), allowNull: true },
  }, {
    tableName: 'Tokens',
    timestamps: false,
    underscored: true,
    // TODO: indexes
  });

  return Token;
};

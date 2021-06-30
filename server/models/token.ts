import * as Sequelize from 'sequelize';
import { AddressAttributes } from './address';
import { OffchainCommunityAttributes } from './offchain_community';
import { ChainAttributes } from './chain';

export interface TokenAttributes {
  name: string;
  address: string;
  symbol: string;
  decimals: number;
}

export interface TokenInstance extends Sequelize.Instance<TokenAttributes>, TokenAttributes {

}

export interface TokenModel extends Sequelize.Model<TokenInstance, TokenAttributes> {

}

export default (
  sequelize: Sequelize.Sequelize,
  dataTypes: Sequelize.DataTypes,
): TokenModel => {
  const Token = sequelize.define<TokenInstance, TokenAttributes>('Token', {
    decimals: { type: dataTypes.INTEGER, allowNull: false },
    name: { type: dataTypes.STRING, allowNull: false },
    address: { type: dataTypes.STRING, allowNull: false },
    symbol: { type: dataTypes.STRING, allowNull: false, primaryKey: true },
  });

  return Token;
};

import * as Sequelize from 'sequelize'; // must use "* as" to avoid scope errors
import { Model, DataTypes } from 'sequelize';
import {ChainAttributes, ChainInstance} from "./chain";
import {TokenAttributes, TokenInstance} from "./token";
import {ModelStatic} from "./types";

export interface DiscordTokenGatingAttributes {
    guild_id: string;
    role_id: string;
    chain_id?: string;
    token_id?: string;
    min_tokens: number;
    max_tokens?: number;

    Chain?: ChainAttributes | ChainAttributes['id'];
    Token?: TokenAttributes | TokenAttributes['id'];
}

export interface DiscordTokenGatingInstance extends Model<DiscordTokenGatingAttributes>, DiscordTokenGatingAttributes {
    getChain: Sequelize.HasOneGetAssociationMixin<ChainInstance>;
    getToken: Sequelize.HasOneGetAssociationMixin<TokenInstance>;
}

export type DiscordTokenGatingModelStatic = ModelStatic<DiscordTokenGatingInstance>;

export default (
    sequelize: Sequelize.Sequelize,
    dataTypes: typeof DataTypes
): DiscordTokenGatingModelStatic => {
    const DiscordTokenGating = <DiscordTokenGatingModelStatic>sequelize.define(
        'DiscordTokenGating',
        {
            guild_id: {type: dataTypes.STRING, primaryKey: true},
            role_id: {type: dataTypes.STRING, primaryKey: true},
            chain_id: {type: dataTypes.STRING, allowNull: true, references: {model: 'Chains', key: 'id'}},
            token_id: {type: dataTypes.STRING, allowNull: true, references: {model: 'Tokens', key: 'id'}},
            min_tokens: {type: dataTypes.INTEGER, allowNull: false},
            max_tokens: {type: dataTypes.INTEGER, allowNull: true}
        }, {
            tableName: 'DiscordTokenGating',
            timestamps: false,
            underscored: true
        }
    );

    DiscordTokenGating.associate = (models) => {
        models.DiscordTokenGating.hasOne(models.Chain, { foreignKey: 'id' });
        models.DiscordTokenGating.hasOne(models.Token, { foreignKey: 'id' });
    }

    return DiscordTokenGating
}

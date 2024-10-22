/**
 * This file was auto-generated by Fern from our API Definition.
 */
import * as CommonApi from '../../../../api/index';
import * as core from '../../../../core';
import * as serializers from '../../../index';
export declare const GetCommunitiesRequestNetwork: core.serialization.Schema<
  serializers.GetCommunitiesRequestNetwork.Raw,
  CommonApi.GetCommunitiesRequestNetwork
>;
export declare namespace GetCommunitiesRequestNetwork {
  type Raw =
    | 'ethereum'
    | 'erc20'
    | 'erc721'
    | 'erc1155'
    | 'edgeware'
    | 'osmosis'
    | 'injective'
    | 'solana'
    | 'terra'
    | 'near'
    | 'stargaze'
    | 'compound'
    | 'evmos'
    | 'kava'
    | 'kyve';
}

/**
 * This file was auto-generated by Fern from our API Definition.
 */
import * as CommonApi from '../../../../api/index';
import * as core from '../../../../core';
import * as serializers from '../../../index';

export declare const CreateGroupResponseAddressesItemWalletId: core.serialization.Schema<
  serializers.CreateGroupResponseAddressesItemWalletId.Raw,
  CommonApi.CreateGroupResponseAddressesItemWalletId
>;
export declare namespace CreateGroupResponseAddressesItemWalletId {
  type Raw =
    | 'magic'
    | 'polkadot'
    | 'metamask'
    | 'walletconnect'
    | 'keplr-ethereum'
    | 'keplr'
    | 'leap'
    | 'near'
    | 'terrastation'
    | 'terra-walletconnect'
    | 'cosm-metamask'
    | 'phantom'
    | 'coinbase';
}

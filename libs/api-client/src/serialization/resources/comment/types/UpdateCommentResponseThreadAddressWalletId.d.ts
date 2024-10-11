/**
 * This file was auto-generated by Fern from our API Definition.
 */
import * as CommonApi from '../../../../api/index';
import * as core from '../../../../core';
import * as serializers from '../../../index';

export declare const UpdateCommentResponseThreadAddressWalletId: core.serialization.Schema<
  serializers.UpdateCommentResponseThreadAddressWalletId.Raw,
  CommonApi.UpdateCommentResponseThreadAddressWalletId
>;
export declare namespace UpdateCommentResponseThreadAddressWalletId {
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

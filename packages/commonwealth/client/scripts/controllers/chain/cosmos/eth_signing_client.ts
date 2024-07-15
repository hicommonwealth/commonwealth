// derived from https://github.com/eco-stake/restake/blob/master/src/utils/SigningClient.mjs
// Copyright (c) 2022 ECO Stake
// This client can also work with slip44 coinType 144 if REST url is provided,
// but we are using it for ethermint chains only for now.
// We use this client because cosmjs does not have plans to support Ethermint.
// See: https://github.com/cosmos/cosmjs/issues/1351
import { fromBase64, toBase64 } from '@cosmjs/encoding';
import { Registry, makeSignDoc } from '@cosmjs/proto-signing';
import {
  DeliverTxResponse,
  assertIsDeliverTxSuccess,
  defaultRegistryTypes as defaultStargateTypes,
} from '@cosmjs/stargate';
import { sleep } from '@cosmjs/utils';
import axios from 'axios';
import { PubKey } from 'cosmjs-types/cosmos/crypto/secp256k1/keys.js';
import { SignMode } from 'cosmjs-types/cosmos/tx/signing/v1beta1/signing.js';
import {
  AuthInfo,
  Fee,
  TxBody,
  TxRaw,
} from 'cosmjs-types/cosmos/tx/v1beta1/tx.js';
import Long from 'long';

function EthSigningClient(network, signer) {
  const coinType = 60; // Common to ethermint chains
  const { restUrl, chainId } = network;

  const registry = new Registry(defaultStargateTypes);

  function getAccount(address) {
    return axios
      .post(restUrl + '/cosmos/auth/v1beta1/accounts/' + address)
      .then((res) => res.data.account)
      .then((value) => {
        if (!value) throw new Error('Account not found');
        const baseAccount =
          value.BaseAccount || value.baseAccount || value.base_account;
        if (baseAccount) {
          value = baseAccount;
        }

        // If the account is the vesting account that embeds the base vesting account,
        // the actual base account exists under the base vesting account.
        // But, this can be different according to the version of cosmos-sdk.
        // So, anyway, try to parse it by some ways...
        const baseVestingAccount =
          value.BaseVestingAccount ||
          value.baseVestingAccount ||
          value.base_vesting_account;
        if (baseVestingAccount) {
          value = baseVestingAccount;

          const _baseAccount =
            value.BaseAccount || value.baseAccount || value.base_account;
          if (_baseAccount) {
            value = _baseAccount;
          }
        }

        // Handle nested account like Desmos
        const nestedAccount = value.account;
        if (nestedAccount) {
          value = nestedAccount;
        }

        return value;
      })
      .catch((error) => {
        if (error.response?.status === 404) {
          throw new Error('Account does not exist on chain');
        } else {
          throw error;
        }
      });
  }

  async function signAndBroadcast(address, messages, gas, memo) {
    const txBody = await sign(address, messages, memo, gas);
    return broadcast(txBody);
  }

  async function broadcast(txBody) {
    const timeoutMs = network.txTimeout || 60_000;
    const pollIntervalMs = 3_000;
    let timedOut = false;
    const txPollTimeout = setTimeout(() => {
      timedOut = true;
    }, timeoutMs);

    const pollForTx = async (txId) => {
      if (timedOut) {
        throw new Error(
          `Transaction with ID ${txId} was submitted but was not yet found on the chain. 
          You might want to check later. There was a wait of ${
            timeoutMs / 1000
          } seconds.`,
        );
      }
      await sleep(pollIntervalMs);
      try {
        const response = await axios.get(
          restUrl + '/cosmos/tx/v1beta1/txs/' + txId,
        );
        const result = parseTxResult(response.data.tx_response);
        return result;
      } catch {
        return pollForTx(txId);
      }
    };

    const response = await axios.post(restUrl + '/cosmos/tx/v1beta1/txs', {
      tx_bytes: toBase64(TxRaw.encode(txBody).finish()),
      mode: 'BROADCAST_MODE_SYNC',
    });
    const result = parseTxResult(response.data?.tx_response);
    assertIsDeliverTxSuccess(result);
    return pollForTx(result.transactionHash).then(
      (value) => {
        clearTimeout(txPollTimeout);
        assertIsDeliverTxSuccess(value);
        return value;
      },
      (error) => {
        clearTimeout(txPollTimeout);
        return error;
      },
    );
  }

  async function sign(address, messages, memo, fee?) {
    const account = await getAccount(address);
    const { account_number: accountNumber } = account;
    const txBodyBytes = makeBodyBytes(messages, memo);
    // Sign using standard protobuf messages
    const authInfoBytes = await makeAuthInfoBytes(
      account,
      {
        amount: fee.amount,
        gasLimit: fee.gas,
      },
      SignMode.SIGN_MODE_DIRECT,
    );
    const signDoc = makeSignDoc(
      txBodyBytes,
      authInfoBytes,
      chainId,
      accountNumber,
    );
    const { signature, signed } = await signer.signDirect(address, signDoc);
    return {
      bodyBytes: signed.bodyBytes,
      authInfoBytes: signed.authInfoBytes,
      signatures: [fromBase64(signature.signature)],
    };
  }

  function parseTxResult(result): DeliverTxResponse {
    return {
      code: result.code,
      height: result.height,
      rawLog: result.raw_log,
      transactionHash: result.txhash,
      gasUsed: result.gas_used,
      gasWanted: result.gas_wanted,
      txIndex: result.tx_index,
      events: result.events,
      msgResponses: result.msg_responses,
    };
  }

  function makeBodyBytes(messages, memo) {
    const anyMsgs = messages.map((m) => registry.encodeAsAny(m));
    return TxBody.encode(
      TxBody.fromPartial({
        messages: anyMsgs,
        memo: memo,
      }),
    ).finish();
  }

  async function makeAuthInfoBytes(account, fee, mode) {
    const { sequence } = account;
    const accountFromSigner = (await signer.getAccounts())[0];
    if (!accountFromSigner) {
      throw new Error('Failed to retrieve account from signer');
    }
    const signerPubkey = accountFromSigner.pubkey;
    return AuthInfo.encode({
      signerInfos: [
        {
          publicKey: {
            typeUrl: pubkeyTypeUrl(account.pub_key),
            value: PubKey.encode({
              key: signerPubkey,
            }).finish(),
          },
          sequence: Long.fromNumber(sequence, true),
          modeInfo: { single: { mode: mode } },
        },
      ],
      fee: Fee.fromPartial(fee),
    }).finish();
  }

  function pubkeyTypeUrl(pub_key) {
    if (pub_key && pub_key['@type']) return pub_key['@type'];

    if (network.path === 'injective') {
      return '/injective.crypto.v1beta1.ethsecp256k1.PubKey';
    }

    if (coinType === 60) {
      return '/ethermint.crypto.v1.ethsecp256k1.PubKey';
    }
    return '/cosmos.crypto.secp256k1.PubKey';
  }

  return {
    signer,
    registry,
    signAndBroadcast,
  };
}

export default EthSigningClient;

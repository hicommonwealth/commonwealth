import { Tendermint34Client } from '@cosmjs/tendermint-rpc';
import { OfflineSigner, decodePubkey } from '@cosmjs/proto-signing';
import {
  AccountParser,
  SigningStargateClient,
  SigningStargateClientOptions,
  accountFromAny,
  Account,
} from '@cosmjs/stargate';
import { CosmosApiType } from './chain';
import { LCD } from 'chain-events/src/chains/cosmos/types';
import { Any } from 'common-common/src/cosmos-ts/src/codegen/google/protobuf/any';
import { EthAccount } from 'common-common/src/ethermint/src/codegen/ethermint/types/v1/account';
import { Uint64 } from '@cosmjs/math';
import { BaseAccount } from 'common-common/src/ethermint/src/codegen/cosmos/auth/v1beta1/auth';

export const getTMClient = async (
  rpcUrl: string
): Promise<Tendermint34Client> => {
  const tm = await import('@cosmjs/tendermint-rpc');
  return await tm.Tendermint34Client.connect(rpcUrl);
};

export const getRPCClient = async (
  tmClient: Tendermint34Client
): Promise<CosmosApiType> => {
  const cosm = await import('@cosmjs/stargate');
  const client = await cosm.QueryClient.withExtensions(
    tmClient,
    cosm.setupGovExtension,
    cosm.setupStakingExtension,
    cosm.setupBankExtension
  );
  return client;
};

export const getLCDClient = async (lcdUrl: string): Promise<LCD> => {
  const { createLCDClient } = await import(
    'common-common/src/cosmos-ts/src/codegen/cosmos/lcd'
  );

  return await createLCDClient({
    restEndpoint: lcdUrl,
  });
};

// export const getSigningEthermintClient = async (
//   url: string,
//   signer: OfflineSigner
// ): Promise<SigningStargateClient> => {
//   const { getSigningEthermintClient } = await import(
//     'common-common/src/ethermint/src/codegen/ethermint/client'
//   );

//   return getSigningEthermintClient({ rpcEndpoint: url, signer });
// };

function uint64FromProto(input: number | Long): Uint64 {
  return Uint64.fromString(input.toString());
}

function accountFromBaseAccount(input: BaseAccount): Account {
  const { address, pubKey, accountNumber, sequence } = input;
  const pubkey = pubKey ? decodePubkey(pubKey) : null;
  return {
    address: address,
    pubkey: pubkey,
    accountNumber: uint64FromProto(accountNumber).toNumber(),
    sequence: uint64FromProto(sequence).toNumber(),
  };
}

const ethAccountFromAny = (input: Any): Account => {
  const { typeUrl, value } = input;
  console.log('typeUrl', typeUrl);
  console.log('value', value);
  switch (typeUrl) {
    case '/ethermint.types.v1.EthAccount': {
      const baseAccount = EthAccount.decode(value).baseAccount;

      console.log('baseAccount', baseAccount);
      // assert(baseAccount);
      return accountFromBaseAccount(baseAccount);
    }
    // case '/cosmos.auth.v1beta1.ModuleAccount': {
    //   const baseAccount = auth_1.ModuleAccount.decode(value).baseAccount;
    //   (0, utils_1.assert)(baseAccount);
    //   return accountFromBaseAccount(baseAccount);
    // }
    default:
      return accountFromAny(input);
  }
};

export const getSigningClient = async (
  url: string,
  signer: OfflineSigner
): Promise<SigningStargateClient> => {
  const options: SigningStargateClientOptions = {
    accountParser: ethAccountFromAny,
  };
  return await SigningStargateClient.connectWithSigner(url, signer, options);
};

import { Tendermint34Client } from '@cosmjs/tendermint-rpc';
import { OfflineSigner } from '@cosmjs/proto-signing';
import { SigningStargateClient } from '@cosmjs/stargate';
import { CosmosApiType } from './chain';
import { LCD } from 'chain-events/src/chain-bases/cosmos/types';

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

export const getSigningClient = async (
  url: string,
  signer: OfflineSigner
): Promise<SigningStargateClient> => {
  return await SigningStargateClient.connectWithSigner(url, signer);
};

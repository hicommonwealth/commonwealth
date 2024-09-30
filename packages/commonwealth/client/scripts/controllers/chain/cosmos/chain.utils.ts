import { registry } from '@atomone/govgen-types-long/govgen/gov/v1beta1/tx.registry';
import { OfflineSigner, Registry } from '@cosmjs/proto-signing';
import {
  AminoTypes,
  SigningStargateClient,
  createDefaultAminoConverters,
  defaultRegistryTypes,
} from '@cosmjs/stargate';
import { Tendermint34Client } from '@cosmjs/tendermint-rpc';
import { LCD } from '../../../../../shared/chain/types/cosmos';
import { CosmosApiType } from './chain';
import {
  createAltGovAminoConverters,
  createGovgenGovAminoConverters,
} from './gov/aminomessages';
import { setupGovgenExtension } from './gov/govgen/queries-v1beta1';

export const getTMClient = async (
  rpcUrl: string,
): Promise<Tendermint34Client> => {
  const tm = await import('@cosmjs/tendermint-rpc');
  return await tm.Tendermint34Client.connect(rpcUrl);
};

export const getRPCClient = async (
  tmClient: Tendermint34Client,
): Promise<CosmosApiType> => {
  const cosm = await import('@cosmjs/stargate');
  const client = await cosm.QueryClient.withExtensions(
    tmClient,
    cosm.setupGovExtension,
    cosm.setupStakingExtension,
    setupGovgenExtension,
    cosm.setupBankExtension,
  );
  return client;
};

export const getLCDClient = async (lcdUrl: string): Promise<LCD> => {
  const { createLCDClient } = await import('@hicommonwealth/chains');

  return await createLCDClient({
    restEndpoint: lcdUrl,
  });
};

export const getSigningClient = async (
  url: string,
  signer: OfflineSigner,
): Promise<SigningStargateClient> => {
  const aminoTypes = new AminoTypes({
    ...createDefaultAminoConverters(),
    ...createAltGovAminoConverters(),
    ...createGovgenGovAminoConverters(),
  });
  return await SigningStargateClient.connectWithSigner(url, signer, {
    registry: new Registry([...defaultRegistryTypes, ...registry]),
    aminoTypes,
  });
};

import { OfflineSigner } from '@cosmjs/proto-signing';
import {
  AminoTypes,
  SigningStargateClient,
  createDefaultAminoConverters,
} from '@cosmjs/stargate';
import { Tendermint34Client } from '@cosmjs/tendermint-rpc';
import { AtomOneLCD, LCD } from '../../../../../shared/chain/types/cosmos';
import { CosmosApiType } from './chain';
import {
  createAltGovAminoConverters,
  createAtomoneGovAminoConverters,
  createGovgenGovAminoConverters,
} from './gov/aminomessages';
import { setupAtomOneExtension } from './gov/atomone/queries-v1';
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
    setupAtomOneExtension,
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

export const getAtomOneLCDClient = async (
  lcdUrl: string,
): Promise<AtomOneLCD> => {
  const { createAtomOneLCDClient } = await import('@hicommonwealth/chains');

  return await createAtomOneLCDClient({
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
    ...createAtomoneGovAminoConverters(),
  });

  return await SigningStargateClient.connectWithSigner(url, signer, {
    aminoTypes,
  });
};

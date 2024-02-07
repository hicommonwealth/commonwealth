import { OfflineSigner } from '@cosmjs/proto-signing';
import {
  AminoTypes,
  SigningStargateClient,
  createDefaultAminoConverters,
} from '@cosmjs/stargate';
import { Tendermint34Client } from '@cosmjs/tendermint-rpc';
import { LCD } from '../../../../../shared/chain/types/cosmos';
import { CosmosApiType } from './chain';
import { createAltGovAminoConverters } from './gov/aminomessages';

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
  });

  return await SigningStargateClient.connectWithSigner(url, signer, {
    aminoTypes,
  });
};

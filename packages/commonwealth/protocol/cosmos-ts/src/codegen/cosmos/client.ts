import { GeneratedType, OfflineSigner, Registry } from '@cosmjs/proto-signing';
import { AminoTypes, SigningStargateClient } from '@cosmjs/stargate';
import { HttpEndpoint } from '@cosmjs/tendermint-rpc';

import * as cosmosGovV1TxRegistry from './gov/v1/tx.registry';

import * as cosmosGovV1TxAmino from './gov/v1/tx.amino';

export const cosmosAminoConverters = {
  ...cosmosGovV1TxAmino.AminoConverter,
};
export const cosmosProtoRegistry: ReadonlyArray<[string, GeneratedType]> = [
  ...cosmosGovV1TxRegistry.registry,
];
export const getSigningCosmosClientOptions = (): {
  registry: Registry;
  aminoTypes: AminoTypes;
} => {
  const registry = new Registry([...cosmosProtoRegistry]);
  const aminoTypes = new AminoTypes({ ...cosmosAminoConverters });
  return {
    registry,
    aminoTypes,
  };
};
export const getSigningCosmosClient = async ({
  rpcEndpoint,
  signer,
}: {
  rpcEndpoint: string | HttpEndpoint;
  signer: OfflineSigner;
}) => {
  const { registry, aminoTypes } = getSigningCosmosClientOptions();
  const client = await SigningStargateClient.connectWithSigner(
    rpcEndpoint,
    signer,
    {
      registry,
      aminoTypes,
    },
  );
  return client;
};

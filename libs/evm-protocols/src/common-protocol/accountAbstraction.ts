import { createModularAccountAlchemyClient } from '@alchemy/aa-alchemy';
import {
  LocalAccountSigner,
  sepolia,
  SmartAccountSigner,
} from '@alchemy/aa-core';
import Web3 from 'web3';

type CreateSmartAccountClientOptions = {
  owners?: `0x${string}`[];
  accountAddress?: `0x${string}`;
  privateKey: string;
  alchemyKey: string;
  gasPolicy: string;
};

export const createSmartAccountClient: (
  options: CreateSmartAccountClientOptions,
) => Promise<{
  client: Awaited<ReturnType<typeof createModularAccountAlchemyClient>>;
  signerAddress: string;
}> = async ({
  owners,
  accountAddress,
  privateKey,
  alchemyKey,
  gasPolicy,
}: CreateSmartAccountClientOptions) => {
  //Figure out specific chain for this at later time
  const chain = sepolia;

  const signer: SmartAccountSigner =
    LocalAccountSigner.privateKeyToAccountSigner(`0x${privateKey}`);
  const smartAccountClient = await createModularAccountAlchemyClient({
    apiKey: alchemyKey,
    chain,
    signer,
    owners,
    accountAddress,
    gasManagerConfig: {
      policyId: gasPolicy,
    },
  });

  return {
    client: smartAccountClient,
    signerAddress: await signer.getAddress(),
  };
};

export const sendUserOpHelper = async ({
  client,
  to,
  data,
  value,
}: {
  client: Awaited<ReturnType<typeof createSmartAccountClient>>['client'];
  to: string;
  value: number;
  data: string;
}) => {
  const uo = await client.sendUserOperation({
    uo: {
      target: `0x${to.replace('0x', '')}`,
      data: `0x${data.replace('0x', '')}`,
      value: Web3.utils.toBigInt(value),
    },
    account: client.account,
  });
  return await client.waitForUserOperationTransaction(uo);
};

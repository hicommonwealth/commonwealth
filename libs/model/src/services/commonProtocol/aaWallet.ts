import { createModularAccountAlchemyClient } from '@alchemy/aa-alchemy';
import {
  LocalAccountSigner,
  SmartAccountSigner,
  sepolia,
} from '@alchemy/aa-core';
import { AppError } from '@hicommonwealth/core';
import { config, equalEvmAddresses } from '@hicommonwealth/model';
import Web3 from 'web3';

const message =
  'I approve commonwealth to create a smart wallet on behalf of this account';

export const verifySignature = (
  signerAddress: string,
  signedMessage: string,
) => {
  const web3 = new Web3();
  // Calculate the signer's address
  const recoveredSignerAddress = web3.eth.accounts.recover(
    message,
    signedMessage,
  );
  if (equalEvmAddresses(signerAddress, recoveredSignerAddress)) {
    throw new AppError('Validation Error: Invalid signature');
  }
};

const createSmartAccountClient = async (
  owners?: `0x${string}`[],
  accountAddress?: `0x${string}`,
) => {
  //Figure out specific chain for this at later time
  const chain = sepolia;

  const signer: SmartAccountSigner =
    LocalAccountSigner.privateKeyToAccountSigner(
      `0x${config.ALCHEMY.AA.PRIVATE_KEY}`,
    );
  const smartAccountClient = await createModularAccountAlchemyClient({
    apiKey: config.ALCHEMY.AA.ALCHEMY_KEY,
    chain,
    signer,
    owners,
    accountAddress,
    gasManagerConfig: {
      policyId: config.ALCHEMY.AA.GAS_POLICY!,
    },
  });

  return {
    client: smartAccountClient,
    signerAddress: await signer.getAddress(),
  };
};

export const newSmartAccount = async (owners: string[]) => {
  const processedOwners = owners.map((o) => {
    return `0x${o.replace('0x', '')}`;
  }) as `0x${string}`[];
  const accountClient = await createSmartAccountClient(processedOwners);

  const client = accountClient.client;

  const uo = await client.sendUserOperation({
    uo: {
      target: `0x${owners[0].replace('0x', '')}`,
      data: `0x`,
      value: Web3.utils.toBigInt(0),
    },
    account: client.account,
  });

  const txHash = await client.waitForUserOperationTransaction(uo);
  console.log(txHash);
  return {
    walletAddress: client.account.address,
    relayAddress: accountClient.signerAddress,
  };
};

export const sendUserOp = async (
  from: string,
  to: string,
  value: number,
  data: string,
): Promise<string> => {
  const accountClient = await createSmartAccountClient(
    undefined,
    from as `0x${string}`,
  );
  const client = accountClient.client;
  const uo = await client.sendUserOperation({
    uo: {
      target: `0x${to.replace('0x', '')}`,
      data: `0x${data.replace('0x', '')}`,
      value: Web3.utils.toBigInt(value),
    },
    account: client.account,
  });
  const txHash = await client.waitForUserOperationTransaction(uo);
  return txHash;
};

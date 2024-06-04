import { createModularAccountAlchemyClient } from '@alchemy/aa-alchemy';
import {
  LocalAccountSigner,
  SmartAccountSigner,
  sepolia,
} from '@alchemy/aa-core';
import { AppError } from '@hicommonwealth/core';
import Web3 from 'web3';

//Keep this for testing purposes
const mockSig =
  '0x716eac74630c92680a71eba4c728554480fa94e8f78e3f2f3f2da2b8ee907d09613c53effcd5d9735dd0224fc3e2c329c0d60c673d949225ce58e4b34b65cc481c';

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
  if (signerAddress.toLowerCase() !== recoveredSignerAddress.toLowerCase()) {
    throw new AppError('Validation Error: Invalid signature');
  }
};

const createSmartAccountClient = async (owners?: `0x${string}`[]) => {
  //Figure out specific chain for this at later time
  const chain = sepolia;

  const signer: SmartAccountSigner =
    LocalAccountSigner.privateKeyToAccountSigner(
      `0x${process.env.AA_PRIVATE_KEY}`,
    );
  const smartAccountClient = await createModularAccountAlchemyClient({
    apiKey: process.env.AA_ALCHEMY_KEY,
    chain,
    signer,
    owners,
    gasManagerConfig: {
      policyId: process.env.AA_GAS_POLICY!,
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
      value: Web3.utils.toBigInt(5e16),
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

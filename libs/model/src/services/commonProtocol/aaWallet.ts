import { AppError } from '@hicommonwealth/core';
import {
  createSmartAccountClient,
  getAddressFromSignedMessage,
  sendUserOpHelper,
} from '@hicommonwealth/evm-protocols';
import { config, equalEvmAddresses } from '@hicommonwealth/model';

const message =
  'I approve commonwealth to create a smart wallet on behalf of this account';

export const verifySignature = (
  signerAddress: string,
  signedMessage: string,
) => {
  const recoveredSignerAddress = getAddressFromSignedMessage(
    message,
    signedMessage,
  );
  if (equalEvmAddresses(signerAddress, recoveredSignerAddress)) {
    throw new AppError('Validation Error: Invalid signature');
  }
};

export const newSmartAccount = async (owners: string[]) => {
  const processedOwners = owners.map((o) => {
    return `0x${o.replace('0x', '')}`;
  }) as `0x${string}`[];
  const accountClient = await createSmartAccountClient({
    owners: processedOwners,
    privateKey: config.ALCHEMY.AA.PRIVATE_KEY!,
    alchemyKey: config.ALCHEMY.AA.ALCHEMY_KEY!,
    gasPolicy: config.ALCHEMY.AA.GAS_POLICY!,
  });

  const txHash = sendUserOpHelper({
    client: accountClient.client,
    to: owners[0],
    data: '',
    value: 0,
  });
  console.log(txHash);
  return {
    walletAddress: accountClient.client.account.address,
    relayAddress: accountClient.signerAddress,
  };
};

export const sendUserOp = async (
  from: string,
  to: string,
  value: number,
  data: string,
): Promise<string> => {
  const accountClient = await createSmartAccountClient({
    accountAddress: from as `0x${string}`,
    privateKey: config.ALCHEMY.AA.PRIVATE_KEY!,
    alchemyKey: config.ALCHEMY.AA.ALCHEMY_KEY!,
    gasPolicy: config.ALCHEMY.AA.GAS_POLICY!,
  });
  return sendUserOpHelper({
    client: accountClient.client,
    to,
    value,
    data,
  });
};

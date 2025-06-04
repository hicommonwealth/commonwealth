import { createPrivateEvmClient } from '@hicommonwealth/evm-protocols';
import { config } from '@hicommonwealth/model';

export const getPrivateWalletAddress = (): string => {
  const web3 = createPrivateEvmClient({ privateKey: config.WEB3.PRIVATE_KEY });
  return web3.eth.defaultAccount!;
};
